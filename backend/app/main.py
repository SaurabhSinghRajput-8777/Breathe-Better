# app/main.py

from fastapi import HTTPException
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from dotenv import load_dotenv
import pandas as pd
from datetime import datetime 
import os
import json
import math
import io
import asyncio      
import httpx        
import numpy as np  
from cachetools import cached, TTLCache 

# utils
from app.utils.history_utils import fetch_history
from app.utils.weather_utils import fetch_hourly_weather
from app.utils.data_utils import CITY_BOUNDING_BOXES 
from app.utils.report_utils import generate_pdf_report

# ml
from app.ml.model import train_model, load_model, predict_future, get_metrics

load_dotenv()

OWM_API_KEY = os.environ.get("OWM_API_KEY")
print(f"--- SERVER START: OWM API Key is Loaded: {OWM_API_KEY is not None} ---")

app = FastAPI(title="BreatheBetter Hybrid Backend", version="4.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CITY_COORDS = {
    "Delhi": (28.7041, 77.1025),
    "Mumbai": (19.0760, 72.8777),
    "Bengaluru": (12.9716, 77.5946),
    "Hyderabad": (17.3850, 78.4867),
    "Chennai": (13.0827, 80.2707),
    "Kolkata": (22.5726, 88.3639)
}

# -------------------------------------------------------------------
# CACHE & HELPERS
# -------------------------------------------------------------------
spatial_cache = TTLCache(maxsize=10, ttl=900)

def get_aqi_category(pm25):
    """Categorizes PM2.5 value based on US EPA standards for AQI"""
    if pm25 <= 50: return {"category": "Good", "color": "green"}
    if pm25 <= 100: return {"category": "Moderate", "color": "yellow"}
    if pm25 <= 150: return {"category": "Unhealthy for SG", "color": "orange"}
    if pm25 <= 200: return {"category": "Unhealthy", "color": "red"}
    if pm25 <= 300: return {"category": "Very Unhealthy", "color": "purple"}
    return {"category": "Hazardous", "color": "maroon"}

async def fetch_air_quality_for_point(lat: float, lon: float, client: httpx.AsyncClient):
    """
    Fetches PM2.5 data for a single coordinate point from OpenWeatherMap.
    """
    if not OWM_API_KEY:
        return None
        
    url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={OWM_API_KEY}"
    try:
        response = await client.get(url, timeout=10.0) 
        response.raise_for_status() 
        data = response.json()
        pm25 = data.get("list", [{}])[0].get("components", {}).get("pm2_5", 0)
        return [lat, lon, pm25]
    except Exception:
        return None 

# -----------------------------------------------------------
# MODEL & PREDICTION ENDPOINTS
# -----------------------------------------------------------

@app.get("/")
async def root():
    return {"message": "BreatheBetter backend is running"}

@app.get("/live_pollutants")
async def live_pollutants(city: str = Query("Delhi")):
    if city not in CITY_COORDS:
        return {"error": "City not supported"}, 400
    
    if not OWM_API_KEY:
        return {"error": "Server is missing API key"}, 500
        
    lat, lon = CITY_COORDS[city]
    url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={OWM_API_KEY}"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
        components = data.get("list", [{}])[0].get("components", {})
        dt = data.get("list", [{}])[0].get("dt", datetime.now().timestamp())
        
        return {
            "pm25": components.get("pm2_5"),
            "pm10": components.get("pm10"),
            "no2": components.get("no2"),
            "o3": components.get("o3"),
            "so2": components.get("so2"),
            "co": components.get("co"),
            "datetime": datetime.fromtimestamp(dt).isoformat()
        }
        
    except Exception as e:
        return {"error": "No live pollutant data found."}, 404

@app.get("/current_aqi")
async def current_aqi(city: str = Query("Delhi")):
    if city not in CITY_COORDS:
        return {"error": "City not supported"}, 400

    df_pm25 = fetch_history(city, days=1)
    if df_pm25 is None or df_pm25.empty:
        return {"error": "No current historical data found."}, 404

    latest = df_pm25.sort_values("datetime", ascending=False).iloc[0]
    pm25_val = float(latest["pm25"])
    category_info = get_aqi_category(pm25_val)

    return {
        "city": city,
        "pm25": round(pm25_val, 2),
        "datetime": str(latest["datetime"]),
        "category": category_info["category"],
        "color": category_info["color"]
    }

@app.get("/train")
async def train(city: str = Query("Delhi"), days: int = Query(30)):
    # Helper wrapper to handle async call properly
    from app.main import get_or_train_model as helper
    try:
        metrics = await helper(city, train_days=days)
        return metrics
    except Exception as e:
        return {"error": f"Training failed: {str(e)}"}

@app.get("/predict")
async def predict(city: str = Query("Delhi"), duration_hours: int = Query(24)):
    if city not in CITY_COORDS:
        return {"error": "City not supported"}

    try:
        # Import locally to avoid circular issues if any
        from app.main import get_or_train_model as helper
        bundle, scaler, metrics = await helper(city)
    except Exception as e:
        return {"error": f"Failed to get model: {str(e)}"}

    lat, lon = CITY_COORDS[city]
    df_pm25 = fetch_history(city, days=7)
    
    if df_pm25 is None or df_pm25.empty:
        return {"error": "Cannot fetch recent PM2.5 data."}

    df_weather = fetch_hourly_weather(lat, lon, past_days=0, forecast_hours=duration_hours)
    if df_weather is None or df_weather.empty:
        return {"error": "No weather forecast found."}

    try:
        output = predict_future(bundle, scaler, df_weather, last_history=df_pm25)
    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}

    preds = output["predictions"]
    result_df = output["result_df"] 

    stds = metrics.get("residual_std", {"xgb":1, "rf":1, "lr":1}) 
    w = metrics.get("weights", {"xgb":0.5, "rf":0.3, "lr":0.2}) 

    sigma = (w.get("xgb", 0) * stds.get("xgb", 1) + 
             w.get("rf", 0) * stds.get("rf", 1) + 
             w.get("lr", 0) * stds.get("lr", 1))
    
    if sigma == 0: sigma = stds.get("rf", 1.0) 
    ci_mult = 1.96

    final = []
    for i, p in enumerate(preds):
        if i >= len(result_df): break 
        row = result_df.iloc[i]
        
        # --- FIXED NAN LOGIC ---
        val = float(p)
        if math.isnan(val):
            val = None
            lower = None
            upper = None
        else:
            lower = max(0, float(p - ci_mult * sigma))
            upper = float(p + ci_mult * sigma)
        
        final.append({
            "hour_index": i,
            "datetime": str(row["datetime"]),
            "pm25": round(val, 3) if val is not None else None,
            "lower_95": round(lower, 3) if lower is not None else None,
            "upper_95": round(upper, 3) if upper is not None else None,
        })

    return {
        "city": city,
        "duration_hours": duration_hours,
        "predictions": final
    }

@app.get("/forecast/weekly")
async def weekly_forecast(city: str = Query("Delhi")):
    if city not in CITY_COORDS:
        return {"error": "City not supported"}

    try:
        from app.main import get_or_train_model as helper
        bundle, scaler, metrics = await helper(city)
    except Exception as e:
        return {"error": f"Failed to get model: {str(e)}"}

    lat, lon = CITY_COORDS[city]
    df_pm25 = fetch_history(city, days=7)
    if df_pm25 is None or df_pm25.empty:
        return {"error": "Cannot fetch recent PM2.5 data."}

    hours = 7 * 24
    df_weather = fetch_hourly_weather(lat, lon, past_days=0, forecast_hours=hours)
    if df_weather is None or df_weather.empty:
        return {"error": "No weather forecast found."}

    try:
        output = predict_future(bundle, scaler, df_weather, last_history=df_pm25)
    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}

    preds = output["predictions"]
    result_df = output["result_df"]

    df = pd.DataFrame({
        "datetime": result_df["datetime"],
        "pm25": preds
    })
    df["date"] = pd.to_datetime(df["datetime"]).dt.date

    grouped = df.groupby("date").agg(
        avg_pm25=("pm25", "mean"),
        min_pm25=("pm25", "min"),
        max_pm25=("pm25", "max")
    ).reset_index()

    return {
        "city": city,
        "days": 7,
        "daily_forecast": grouped.round(3).to_dict(orient="records")
    }

@app.get("/metrics")
async def metrics(city: str = Query("Delhi")):
    try:
        return get_metrics(city)
    except Exception as e:
        return {"error": str(e)}

@app.get("/report/pdf")
async def report_pdf(city: str = Query("Delhi"), days: int = Query(7)):
    """
    Generates and downloads a PDF report for the specified city and duration.
    """
    if city not in CITY_COORDS:
        return {"error": "City not supported."}
    
    print(f"📄 Generating PDF Report for {city}, Days: {days}")
    
    # 1. Fetch History
    df_history = fetch_history(city, days)
    
    # 2. Get Metrics
    metrics = get_metrics(city) or {} 
    
    # 3. Generate PDF
    try:
        pdf_bytes = generate_pdf_report(city, df_history, metrics, days=days)
    except Exception as e:
        print(f"❌ Report Gen Error: {e}")
        return {"error": f"Failed to generate PDF: {e}"}
        
    filename = f"{city}_BreatheBetter_report_{days}d.pdf"
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes), 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/history")
async def get_history(city: str = Query("Delhi"), days: int = Query(7)):
    """
    Returns hourly historical PM2.5 data for the specified city and duration.
    """
    if city not in CITY_COORDS:
        return {"error": "City not supported"}, 400
        
    try:
        # Reuse your existing utility!
        df = fetch_history(city, days=days)
        
        if df is None or df.empty:
            return {"city": city, "history": []}
            
        # Convert DataFrame to list of dicts for JSON response
        # df has 'datetime' and 'pm25' columns
        records = df.to_dict(orient="records")
        
        return {
            "city": city,
            "days": days,
            "history": records
        }
    except Exception as e:
        return {"error": f"Failed to fetch history: {str(e)}"}, 500

@app.get("/spatial_heatmap")
async def get_spatial_heatmap(city: str = Query("Delhi")):
    """Generates random-scattered PM2.5 points."""
    if city not in CITY_BOUNDING_BOXES:
        raise HTTPException(status_code=404, detail="City bounding box not found")

    cached_value = spatial_cache.get(city)
    if cached_value: return cached_value

    bounds = CITY_BOUNDING_BOXES[city]
    num_points = 300 
    lats = np.random.uniform(bounds["lat_min"], bounds["lat_max"], num_points)
    lons = np.random.uniform(bounds["lon_min"], bounds["lon_max"], num_points)

    tasks = []
    async with httpx.AsyncClient() as client:
        for lat, lon in zip(lats, lons):
            tasks.append(fetch_air_quality_for_point(lat, lon, client))
        results = await asyncio.gather(*tasks)

    spatial_data = [r for r in results if r is not None]
    response = {"city": city, "points": spatial_data}
    spatial_cache[city] = response
    return response

@app.get("/clear_cache")
async def clear():
    spatial_cache.clear()
    return {"status": "cleared"}

@app.get("/report/pdf")
async def report_pdf(city: str = Query("Delhi"), days: int = Query(7)):
    if city not in CITY_COORDS:
        return {"error": "City not supported."}
    df_history = fetch_history(city, days)
    metrics = get_metrics(city) or {} 
    try:
        pdf_bytes = generate_pdf_report(city, df_history, metrics, days=days)
    except Exception as e:
        return {"error": f"Failed to generate PDF: {e}"}
    filename = f"{city}_BreatheBetter_report_{days}d.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes), 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# Helper must be defined last to avoid circular import issues if moved
async def get_or_train_model(city: str, train_days: int = 30):
    bundle, scaler, metrics = load_model(city)
    if bundle and scaler: return bundle, scaler, metrics
    
    print(f"Training new model for {city}...")
    if city not in CITY_COORDS: raise Exception("City not supported")
    lat, lon = CITY_COORDS[city]
    
    df_pm25 = fetch_history(city, 14)
    if df_pm25 is None or df_pm25.empty: raise Exception("No history found")
    
    start = pd.to_datetime(df_pm25["datetime"].min())
    days_fetch = max(1, (pd.Timestamp.utcnow() - start).days + 2)
    df_weather = fetch_hourly_weather(lat, lon, past_days=days_fetch, forecast_hours=0)
    if df_weather is None or df_weather.empty: raise Exception("No weather data")
    
    end = pd.to_datetime(df_pm25["datetime"].max())
    df_weather = df_weather[(df_weather["datetime"] >= start - pd.Timedelta(hours=1)) & 
                            (df_weather["datetime"] <= end + pd.Timedelta(hours=1))].reset_index(drop=True)
    
    if df_weather.empty: raise Exception("No overlapping weather data")
    
    metrics = train_model(city, df_pm25, df_weather)
    bundle, scaler, _ = load_model(city)
    return bundle, scaler, metrics