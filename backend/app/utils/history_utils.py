# backend/app/utils/history_utils.py
import requests
import pandas as pd
from datetime import datetime

# Coordinates of supported Indian cities
CITY_COORDS = {
    "Delhi": (28.7041, 77.1025),
    "Mumbai": (19.0760, 72.8777),
    "Bengaluru": (12.9716, 77.5946),
    "Hyderabad": (17.3850, 78.4867),
    "Chennai": (13.0827, 80.2707),
    "Kolkata": (22.5726, 88.3639)
}

def fetch_history(city: str, days: int = 7):
    """
    Fetch historical PM2.5 for the last `days` using Open-Meteo Air Quality API.
    Returns DataFrame with datetime and pm25.
    """
    # Validate City
    if city not in CITY_COORDS:
        print(f"❌ History Error: {city} not supported")
        return pd.DataFrame()

    lat, lon = CITY_COORDS[city]
    
    # Validate Days
    if days < 1: days = 1
    if days > 90: days = 90 # Open-Meteo limit
    
    # API URL
    url = (
        "https://air-quality-api.open-meteo.com/v1/air-quality"
        f"?latitude={lat}"
        f"&longitude={lon}"
        f"&hourly=pm2_5"
        f"&past_days={days}"  # 🔥 Dynamic Days
        f"&timezone=UTC"
    )

    print(f"📡 Fetching History for {city} ({days} days): {url}")

    try:
        res = requests.get(url, timeout=15).json()

        if "hourly" not in res or "pm2_5" not in res["hourly"]:
            print(f"❌ Open-Meteo returned no data for {city}")
            return pd.DataFrame()

        times = res["hourly"]["time"]
        pm25_values = res["hourly"]["pm2_5"]

        df = pd.DataFrame({
            "datetime": pd.to_datetime(times, utc=True),
            "pm25": pm25_values
        })

        # Clean data
        df = df.dropna().sort_values("datetime").reset_index(drop=True)
        
        print(f"✅ Fetched {len(df)} rows for {city}")
        return df

    except Exception as e:
        print(f"❌ History Exception: {e}")
        return pd.DataFrame()