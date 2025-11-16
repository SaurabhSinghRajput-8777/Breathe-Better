# app/main.py

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import pandas as pd

# utils
from app.utils.history_utils import fetch_history
from app.utils.weather_utils import fetch_hourly_weather

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
# FIX: ADD MISSING AQI CATEGORIZATION HELPER FUNCTION
# -----------------------------------------------------------
def get_aqi_category(pm25):
    """Categorizes PM2.5 value based on US EPA standards for AQI"""
    if pm25 <= 50: return {"category": "Good", "color": "green"}
    if pm25 <= 100: return {"category": "Moderate", "color": "yellow"}
    if pm25 <= 150: return {"category": "Unhealthy for SG", "color": "orange"}
    if pm25 <= 200: return {"category": "Unhealthy", "color": "red"}
    if pm25 <= 300: return {"category": "Very Unhealthy", "color": "purple"}
    return {"category": "Hazardous", "color": "maroon"}

@app.get("/")
async def root():
    return {"message": "BreatheBetter backend is running"}

# -----------------------------------------------------------
# NEW: CURRENT AQI ENDPOINT (for Dashboard)
# -----------------------------------------------------------
@app.get("/current_aqi")
async def current_aqi(city: str = Query("Delhi")):
    """
    Returns the last known PM2.5 reading for the city.
    """
    if city not in CITY_COORDS:
        return {"error": "City not supported"}, 400

    # Fetch 1 day of history to get the latest reading
    df_pm25 = fetch_history(city, days=1)
    
    if df_pm25 is None or df_pm25.empty:
        return {"error": "No current historical data found."}, 404

    # Get the latest reading
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
# TRAIN ENDPOINT
# -----------------------------------------------------------
@app.get("/train")
async def train(city: str = Query("Delhi"), days: int = Query(30)):
    if city not in CITY_COORDS:
        return {"error": "City not supported"}

    lat, lon = CITY_COORDS[city]

    df_pm25 = fetch_history(city, days)
    if df_pm25 is None or df_pm25.empty:
        return {"error": "No historical PM2.5 data found."}

    start = pd.to_datetime(df_pm25["datetime"].min())
    end = pd.to_datetime(df_pm25["datetime"].max())
    hours_span = int(((end - start).total_seconds() // 3600) + 24)

    df_weather = fetch_hourly_weather(lat, lon, hours=hours_span)
    if df_weather is None or df_weather.empty:
        return {"error": "Weather API returned no data."}

    df_weather = df_weather[
        (df_weather["datetime"] >= start - pd.Timedelta(hours=1)) &
        (df_weather["datetime"] <= end + pd.Timedelta(hours=1))
    ].reset_index(drop=True)

    try:
        return train_model(df_pm25, df_weather)
    except Exception as e:
        return {"error": str(e)}


# -----------------------------------------------------------
# PREDICT (WITH CONFIDENCE INTERVALS)
# -----------------------------------------------------------
@app.get("/predict")
async def predict(city: str = Query("Delhi"), duration_hours: int = Query(24)):

    if city not in CITY_COORDS:
        return {"error": "City not supported"}

    lat, lon = CITY_COORDS[city]

    bundle, scaler, metrics = load_model()
    if bundle is None or scaler is None:
        return {"error": "Model not trained. Call /train first."}

    df_pm25 = fetch_history(city, days=7)
    last_pm25 = (
        float(df_pm25.sort_values("datetime").iloc[-1]["pm25"])
        if df_pm25 is not None and not df_pm25.empty
        else 0
    )

    df_weather = fetch_hourly_weather(lat, lon, hours=duration_hours)
    if df_weather is None or df_weather.empty:
        return {"error": "No weather forecast found."}

    df_weather["pm25"] = last_pm25

    try:
        output = predict_future(bundle, scaler, df_weather)
    except Exception as e:
        return {"error": str(e)}

    preds = output["predictions"]
    result_df = output["result_df"]

    # ---- Confidence Interval Calculation ----
    stds = metrics["residual_std"]
    w = metrics["weights"]

    sigma = (
        w["xgb"] * stds["xgb"] +
        w["rf"] * stds["rf"] +
        w["lr"] * stds["lr"]
    )

    ci_mult = 1.96  # 95% confidence interval

    # Build response list
    final = []
    for i, p in enumerate(preds):
        dt = str(result_df.iloc[i]["datetime"]) if result_df is not None else None
        lower = max(0, float(p - ci_mult * sigma))
        upper = float(p + ci_mult * sigma)
        final.append({
            "hour_index": i,
            "datetime": dt,
            "pm25": round(float(p), 3),
            "lower_95": round(lower, 3),
            "upper_95": round(upper, 3)
        })

    return {
        "city": city,
        "duration_hours": duration_hours,
        "predictions": final
    }


# -----------------------------------------------------------
# WEEKLY FORECAST (7-DAY AGGREGATE)
# -----------------------------------------------------------
@app.get("/forecast/weekly")
async def weekly_forecast(city: str = Query("Delhi")):

    if city not in CITY_COORDS:
        return {"error": "City not supported"}

    lat, lon = CITY_COORDS[city]

    bundle, scaler, metrics = load_model()
    if bundle is None:
        return {"error": "Model not trained"}

    df_pm25 = fetch_history(city, days=7)
    last_pm25 = (
        float(df_pm25.sort_values("datetime").iloc[-1]["pm25"])
        if df_pm25 is not None and not df_pm25.empty
        else 0
    )

    hours = 7 * 24  # 168 hours
    df_weather = fetch_hourly_weather(lat, lon, hours=hours)
    if df_weather is None or df_weather.empty:
        return {"error": "No weather forecast found."}

    df_weather["pm25"] = last_pm25

    try:
        output = predict_future(bundle, scaler, df_weather)
    except Exception as e:
        return {"error": str(e)}

    preds = output["predictions"]
    result_df = output["result_df"]

    # Combine into DataFrame
    df = pd.DataFrame({
        "datetime": result_df["datetime"],
        "pm25": preds
    })
    df["date"] = df["datetime"].dt.date

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
# METRICS ENDPOINT
# -----------------------------------------------------------
@app.get("/metrics")
async def metrics():
    try:
        return get_metrics()
    except Exception as e:
        return {"error": str(e)}

# -----------------------------
# HEATMAP (GeoJSON) endpoint
# -----------------------------
@app.get("/heatmap")
async def heatmap(city: str = Query("Delhi"), days: int = Query(1)):
    """
    Returns a GeoJSON FeatureCollection for recent PM2.5 readings.
    If history rows contain 'lat'/'lon' columns, those are used.
    Otherwise the city center is used and small jitter applied for demo heatmap points.
    """
    if city not in CITY_COORDS:
        return {"error": "City not supported."}

    df = fetch_history(city, days)
    if df is None or df.empty:
        return {"error": "No historical PM2.5 data found."}

    # Use lat/lon if present
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
        # fallback: create points around city center (small jitter) using pm25 values
        lat_center, lon_center = CITY_COORDS[city]
        # sample up to 200 points from df
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
# PDF REPORT endpoint
# -----------------------------
@app.get("/report/pdf")
async def report_pdf(city: str = Query("Delhi"), days: int = Query(7)):
    """
    Generates a PDF report (bytes) for the given city and returns it as a streaming download.
    """
    if city not in CITY_COORDS:
        return {"error": "City not supported."}

    # Fetch history + metrics
    df_history = fetch_history(city, days)
    metrics = get_metrics() or {}

    # Generate PDF bytes
    try:
        pdf_bytes = generate_pdf_report(city, df_history, metrics, days=days)
    except Exception as e:
        return {"error": f"Failed to generate PDF: {e}"}

    # Stream response
    filename = f"{city}_BreatheBetter_report_{days}d.pdf"
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf",
                             headers={"Content-Disposition": f"attachment; filename={filename}"})
