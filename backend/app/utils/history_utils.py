# backend/app/utils/history_utils.py

import requests
import pandas as pd

# Coordinates of supported Indian cities
CITY_COORDS = {
    "Delhi": (28.7041, 77.1025),
    "Mumbai": (19.0760, 72.8777),
    "Bengaluru": (12.9716, 77.5946),
    "Hyderabad": (17.3850, 78.4867),
    "Chennai": (13.0827, 80.2707),
    "Kolkata": (22.5726, 88.3639)
}

def fetch_history(city: str, days: int = 30):
    """
    Fetch historical PM2.5 for the last `days` using Open-Meteo Air Quality API.
    Returns DataFrame with datetime and pm25.
    """

    if city not in CITY_COORDS:
        print("City not supported in coords")
        return pd.DataFrame()

    lat, lon = CITY_COORDS[city]

    url = (
        "https://air-quality-api.open-meteo.com/v1/air-quality"
        f"?latitude={lat}"
        f"&longitude={lon}"
        f"&hourly=pm2_5"
        f"&past_days={days}"
        f"&timezone=UTC"
    )

    try:
        res = requests.get(url, timeout=15).json()

        if "hourly" not in res or "pm2_5" not in res["hourly"]:
            print("Open-Meteo returned no hourly pm2_5 data.")
            return pd.DataFrame()

        times = res["hourly"]["time"]
        pm25_values = res["hourly"]["pm2_5"]

        df = pd.DataFrame({
            "datetime": pd.to_datetime(times),
            "pm25": pm25_values
        })

        df = df.dropna().sort_values("datetime").reset_index(drop=True)
        return df

    except Exception as e:
        print("Open-Meteo history error:", e)
        return pd.DataFrame()
