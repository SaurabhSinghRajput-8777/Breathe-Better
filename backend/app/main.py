# app/main.py

from fastapi import HTTPException
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import pandas as pd
from datetime import datetime 
import os

# utils
from app.utils.history_utils import fetch_history
from app.utils.weather_utils import fetch_hourly_weather
# 1. We NO LONGER need fetch_live_aqi from data_utils
from app.utils.data_utils import CITY_BOUNDING_BOXES 

from fastapi.responses import StreamingResponse, JSONResponse
from app.utils.report_utils import generate_pdf_report
import json
import math
import io

# ml
from app.ml.model import train_model, load_model, predict_future, get_metrics

# -------------------------------------------------------------------
# IMPORTS FOR OUR API CALLS
# -------------------------------------------------------------------
import asyncio      
import httpx        # <-- 2. This is now used by /live_pollutants
from cachetools import cached, TTLCache 
import numpy as np  
# -------------------------------------------------------------------


load_dotenv()

OWM_API_KEY = os.environ.get("OWM_API_KEY")
print(f"--- SERVER START: OWM API Key is Loaded: {OWM_API_KEY is not None} ---") # <-- ADD THIS

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

# -----------------------------------------------------------
# AQI CATEGORIZATION HELPER (Existing)
# -----------------------------------------------------------
def get_aqi_category(pm25):
    """Categorizes PM2.5 value based on US EPA standards for AQI"""
    if pm25 <= 50: return {"category": "Good", "color": "green"}
    if pm25 <= 100: return {"category": "Moderate", "color": "yellow"}
    if pm25 <= 150: return {"category": "Unhealthy for SG", "color": "orange"}
    if pm25 <= 200: return {"category": "Unhealthy", "color": "red"}
    if pm25 <= 300: return {"category": "Very Unhealthy", "color": "purple"}
    return {"category": "Hazardous", "color": "maroon"}


# -----------------------------------------------------------
# AUTO-TRAIN HELPER FUNCTION (Existing)
# -----------------------------------------------------------
async def get_or_train_model(city: str, train_days: int = 30):
    """
    Loads model for city. If it doesn't exist, this function
    triggers a new training run and then returns the new model.
    """
    bundle, scaler, metrics = load_model(city)
    if bundle and scaler:
        print(f"Model for {city} loaded from cache.")
        return bundle, scaler, metrics

    # --- Model not found, so we must train it ---
    print(f"Model for {city} not found. Training new model...")
    if city not in CITY_COORDS:
        raise Exception("City not supported")

    lat, lon = CITY_COORDS[city]

    TRAIN_DAYS_LIMIT = 14
    
    # 1. Fetch PM2.5 history (using the new limit)
    df_pm25 = fetch_history(city, TRAIN_DAYS_LIMIT)
    if df_pm25 is None or df_pm25.empty:
        raise Exception("No historical PM2.5 data found to train on.")

    # 2. Fetch corresponding *historical* weather
    start = pd.to_datetime(df_pm25["datetime"].min()) 
    
    days_ago_start = (pd.Timestamp.utcnow() - start).days
    past_days_to_fetch = max(1, days_ago_start + 2) # Fetch with a 2-day buffer
    
    print(f"Fetching {past_days_to_fetch} days of historical weather for training...")
    df_weather = fetch_hourly_weather(lat, lon, past_days=past_days_to_fetch, forecast_hours=0)
    
    if df_weather is None or df_weather.empty:
        raise Exception("Weather API returned no data for training.")

    # 3. Filter weather to match PM2.5 data range
    end = pd.to_datetime(df_pm25["datetime"].max())
    df_weather_filtered = df_weather[
        (df_weather["datetime"] >= start - pd.Timedelta(hours=1)) &
        (df_weather["datetime"] <= end + pd.Timedelta(hours=1))
    ].reset_index(drop=True)

    if df_weather_filtered.empty:
        print(f"PM2.5 range: {start} to {end}")
        print(f"Weather range: {df_weather['datetime'].min()} to {df_weather['datetime'].max()}")
        raise Exception("No overlapping weather data found for the PM2.5 history range.")

    # 4. Train
    try:
        metrics = train_model(city, df_pm25, df_weather_filtered) 
    except Exception as e:
        raise Exception(f"Model training failed for {city}: {e}")

    # 5. Load the newly trained model
    bundle, scaler, _ = load_model(city) # We already have metrics
    if bundle is None:
        raise Exception(f"Failed to load model for {city} even after training.")
        
    print(f"Model for {city} trained and cached successfully.")
    return bundle, scaler, metrics


@app.get("/")
async def root():
    return {"message": "BreatheBetter backend is running"}


# -----------------------------------------------------------
# UPDATED: LIVE POLLUTANTS ENDPOINT (for Home page)
# -----------------------------------------------------------
@app.get("/live_pollutants")
async def live_pollutants(city: str = Query("Delhi")):
    """
    Returns live pollutant data (pm10, no2, so2, etc.) from OpenWeatherMap.
    """
    if city not in CITY_COORDS:
        return {"error": "City not supported"}, 400
    
    if not OWM_API_KEY:
        print("Error: OWM_API_KEY is not set for /live_pollutants.")
        return {"error": "Server is missing API key"}, 500
        
    lat, lon = CITY_COORDS[city]
    url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={OWM_API_KEY}"
    
    try:
        # Use httpx for an async API call
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            response.raise_for_status() # Raise error on bad response
            data = response.json()
            
        # Extract the data we need
        components = data.get("list", [{}])[0].get("components", {})
        dt = data.get("list", [{}])[0].get("dt", datetime.now().timestamp())
        
        # 3. Reformat the OWM data to match what the frontend expects
        # (This matches the old OpenAQ format, so no frontend change is needed)
        formatted_data = {
            "pm25": components.get("pm2_5"),
            "pm10": components.get("pm10"),
            "no2": components.get("no2"),
            "o3": components.get("o3"),
            "so2": components.get("so2"),
            "co": components.get("co"),
            "datetime": datetime.fromtimestamp(dt).isoformat()
        }
        return formatted_data
        
    except Exception as e:
        print(f"Error fetching live pollutants from OWM: {e}")
        return {"error": "No live pollutant data found from OWM."}, 404

# -----------------------------------------------------------
# CURRENT AQI ENDPOINT (Existing)
# -----------------------------------------------------------
@app.get("/current_aqi")
async def current_aqi(city: str = Query("Delhi")):
    """
    Returns the last known PM2.5 reading for the city (from Open-Meteo).
    """
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

# -----------------------------------------------------------
# TRAIN ENDPOINT (Existing)
# -----------------------------------------------------------
@app.get("/train")
async def train(city: str = Query("Delhi"), days: int = Query(30)):
    
    try:
        metrics = await get_or_train_model(city, train_days=days)
        return metrics
    except Exception as e:
        return {"error": f"Training failed: {str(e)}"}


# -----------------------------------------------------------
# PREDICT (Existing)
# -----------------------------------------------------------
@app.get("/predict")
async def predict(city: str = Query("Delhi"), duration_hours: int = Query(24)):

    if city not in CITY_COORDS:
        return {"error": "City not supported"}

    try:
        bundle, scaler, metrics = await get_or_train_model(city)
    except Exception as e:
        return {"error": f"Failed to get or train model: {str(e)}"}

    lat, lon = CITY_COORDS[city]

    df_pm25 = fetch_history(city, days=7)
    if df_pm25 is None or df_pm25.empty:
        return {"error": "Cannot fetch recent PM2.5 data to start prediction."}

    df_weather = fetch_hourly_weather(lat, lon, past_days=0, forecast_hours=duration_hours)
    if df_weather is None or df_weather.empty:
        return {"error": "No weather forecast found."}

    try:
        output = predict_future(bundle, scaler, df_weather, last_history=df_pm25)
    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}

    preds = output["predictions"]
    result_df = output["result_df"] 

    # ---- Confidence Interval Calculation ----
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
        dt = str(row["datetime"])
        
        lower = max(0, float(p - ci_mult * sigma))
        upper = float(p + ci_mult * sigma)
        
        final.append({
            "hour_index": i,
            "datetime": dt,
            "pm25": round(float(p), 3),
            "lower_95": round(lower, 3),
            "upper_95": round(upper, 3),
        })

    return {
        "city": city,
        "duration_hours": duration_hours,
        "predictions": final
    }


# -----------------------------------------------------------
# WEEKLY FORECAST (Existing)
# -----------------------------------------------------------
@app.get("/forecast/weekly")
async def weekly_forecast(city: str = Query("Delhi")):

    if city not in CITY_COORDS:
        return {"error": "City not supported"}

    try:
        bundle, scaler, metrics = await get_or_train_model(city)
    except Exception as e:
        return {"error": f"Failed to get or train model: {str(e)}"}

    lat, lon = CITY_COORDS[city]

    df_pm25 = fetch_history(city, days=7)
    if df_pm25 is None or df_pm25.empty:
        return {"error": "Cannot fetch recent PM2.5 data to start prediction."}

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

    grouped = grouped.round(3)

    return {
        "city": city,
        "days": 7,
        "daily_forecast": grouped.to_dict(orient="records")
    }


# -----------------------------------------------------------
# METRICS ENDPOINT (Existing)
# -----------------------------------------------------------
@app.get("/metrics")
async def metrics(city: str = Query("Delhi")):
    try:
        return get_metrics(city) # Pass city
    except Exception as e:
        return {"error": str(e)}

# -----------------------------
# HEATMAP (GeoJSON) endpoint (Existing)
# -----------------------------
@app.get("/spatial_heatmap")
async def get_spatial_heatmap(city: str = Query("Delhi")):
    if city not in CITY_BOUNDING_BOXES:
        raise HTTPException(status_code=404, detail="City bounding box not found")

    # ---- Manual cache (fixes CORS issue) ----
    cached_value = spatial_cache.get(city)
    if cached_value:
        return cached_value

    bounds = CITY_BOUNDING_BOXES[city]

    lat_points = np.linspace(bounds["lat_min"], bounds["lat_max"], 10)
    lon_points = np.linspace(bounds["lon_min"], bounds["lon_max"], 10)

    tasks = []

    async with httpx.AsyncClient() as client:
        for lat in lat_points:
            for lon in lon_points:
                tasks.append(fetch_air_quality_for_point(lat, lon, client))

        results = await asyncio.gather(*tasks)

    spatial_data = [r for r in results if r is not None]

    print(f"Fetched {len(spatial_data)} spatial points for {city}")

    response = {"city": city, "points": spatial_data}

    # store manually in cache
    spatial_cache[city] = response

    return response



# -------------------------------------------------------------------
# SPATIAL HEATMAP (Existing)
# -------------------------------------------------------------------

spatial_cache = TTLCache(maxsize=10, ttl=900)

async def fetch_air_quality_for_point(lat: float, lon: float, client: httpx.AsyncClient):
    """
    Fetches PM2.5 data for a single coordinate point from OpenWeatherMap.
    """
    if not OWM_API_KEY:
        print("Error: OWM_API_KEY is not set.")
        return None
        
    url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={OWM_API_KEY}"
    try:
        response = await client.get(url, timeout=10.0) 
        response.raise_for_status() 
        data = response.json()
        
        pm25 = data.get("list", [{}])[0].get("components", {}).get("pm2_5", 0)
        
        return [lat, lon, pm25]
    except Exception as e:
        print(f"Failed to fetch spatial data for {lat},{lon}: {e}")
        return None 

@app.get("/spatial_heatmap")
async def get_spatial_heatmap(city: str = Query("Delhi")):
    """
    Generates random-scattered PM2.5 points for a city's bounding box.
    Avoids grid-effect and creates organic heatmap patterns.
    """

    if city not in CITY_BOUNDING_BOXES:
        raise HTTPException(status_code=404, detail="City bounding box not found")

    bounds = CITY_BOUNDING_BOXES[city]

    num_points = 300  # recommended: 80–150

    # random scattered coordinates
    lats = np.random.uniform(bounds["lat_min"], bounds["lat_max"], num_points)
    lons = np.random.uniform(bounds["lon_min"], bounds["lon_max"], num_points)

    tasks = []

    async with httpx.AsyncClient() as client:
        for lat, lon in zip(lats, lons):
            tasks.append(fetch_air_quality_for_point(lat, lon, client))

        results = await asyncio.gather(*tasks)

    # Filter valid points
    spatial_data = [r for r in results if r is not None]

    print(f"Fetched {len(spatial_data)} spatial points for {city}")

    return {"city": city, "points": spatial_data}


@app.get("/clear_cache")
async def clear():
    spatial_cache.clear()
    return {"status": "cleared"}

# -----------------------------
# PDF REPORT endpoint (Existing)
# -----------------------------
@app.get("/report/pdf")
async def report_pdf(city: str = Query("Delhi"), days: int = Query(7)):
    
    if city not in CITY_COORDS:
        return {"error": "City not supported."}

    df_history = fetch_history(city, days)
    metrics = get_metrics(city) or {} # Pass city to get_metrics

    try:
        pdf_bytes = generate_pdf_report(city, df_history, metrics, days=days)
    except Exception as e:
        return {"error": f"Failed to generate PDF: {e}"}

    filename = f"{city}_BreatheBetter_report_{days}d.pdf"
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf",
                             headers={"Content-Disposition": f"attachment; filename={filename}"})