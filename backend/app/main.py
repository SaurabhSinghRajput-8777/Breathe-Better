# app/main.py

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import pandas as pd
from datetime import datetime 

# utils
from app.utils.history_utils import fetch_history
from app.utils.weather_utils import fetch_hourly_weather
from app.utils.data_utils import fetch_live_aqi 

from fastapi.responses import StreamingResponse, JSONResponse
from app.utils.report_utils import generate_pdf_report
import json
import math
import io

# ml
from app.ml.model import train_model, load_model, predict_future, get_metrics

load_dotenv()

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
# AQI CATEGORIZATION HELPER
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
# NEW: AUTO-TRAIN HELPER FUNCTION
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
# NEW: LIVE POLLUTANTS ENDPOINT (for Home page)
# -----------------------------------------------------------
@app.get("/live_pollutants")
async def live_pollutants(city: str = Query("Delhi")):
    """
    Returns live pollutant data (pm10, no2, so2, etc.) from OpenAQ.
    """
    if city not in CITY_COORDS:
        return {"error": "City not supported"}, 400
    
    data = fetch_live_aqi(city) 
    if data is None:
        return {"error": "No live pollutant data found from OpenAQ."}, 404
    
    return data

# -----------------------------------------------------------
# CURRENT AQI ENDPOINT (for Home page)
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
# TRAIN ENDPOINT (Can still be called manually)
# -----------------------------------------------------------
@app.get("/train")
async def train(city: str = Query("Delhi"), days: int = Query(30)):
    
    try:
        metrics = await get_or_train_model(city, train_days=days)
        return metrics
    except Exception as e:
        return {"error": f"Training failed: {str(e)}"}


# -----------------------------------------------------------
# PREDICT (WITH AUTO-TRAINING)
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
        
        # 🔥 THE FIX: All weather logic is REMOVED.
        # This stops the "Internal Server Error" crash.

        final.append({
            "hour_index": i,
            "datetime": dt,
            "pm25": round(float(p), 3),
            "lower_95": round(lower, 3),
            "upper_95": round(upper, 3),
            # "weather": weather_data <-- REMOVED
        })

    return {
        "city": city,
        "duration_hours": duration_hours,
        "predictions": final
    }


# -----------------------------------------------------------
# WEEKLY FORECAST (WITH AUTO-TRAINING)
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
# METRICS ENDPOINT (NOW CITY-AWARE)
# -----------------------------------------------------------
@app.get("/metrics")
async def metrics(city: str = Query("Delhi")):
    try:
        return get_metrics(city) # Pass city
    except Exception as e:
        return {"error": str(e)}

# -----------------------------
# HEATMAP (GeoJSON) endpoint
# -----------------------------
@app.get("/heatmap")
async def heatmap(city: str = Query("Delhi"), days: int = Query(1)):
    
    if city not in CITY_COORDS:
        return {"error": "City not supported."}
    df = fetch_history(city, days)
    if df is None or df.empty:
        return {"error": "No historical PM2.5 data found."}
    
    features = []
    if "lat" in df.columns and "lon" in df.columns:
        for _, r in df.iterrows():
            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [float(r["lon"]), float(r["lat"])]},
                "properties": {
                    "pm25": float(r["pm25"]) if not pd.isna(r["pm25"]) else None,
                    "datetime": str(r["datetime"])
                }
            })
    else:
        lat_center, lon_center = CITY_COORDS[city]
        sample = df.sort_values("datetime", ascending=False).head(200)
        import random
        for _, r in sample.iterrows():
            jitter_lat = lat_center + random.uniform(-0.02, 0.02)
            jitter_lon = lon_center + random.uniform(-0.02, 0.02)
            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [jitter_lon, jitter_lat]},
                "properties": {
                    "pm25": float(r["pm25"]) if not pd.isna(r["pm25"]) else None,
                    "datetime": str(r["datetime"])
                }
            })
            
    geojson = {"type": "FeatureCollection", "features": features}
    return JSONResponse(content=geojson)


# -----------------------------
# PDF REPORT endpoint (NOW CITY-AWARE METRICS)
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