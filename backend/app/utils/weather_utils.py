# backend/app/utils/weather_utils.py
import requests
import pandas as pd

# Open-Meteo example: hourly forecast and history
# returns DataFrame with datetime (UTC) and weather columns
def fetch_hourly_weather(lat: float, lon: float, hours: int = 168):
    """
    Fetch hourly weather forecast for next `hours` hours.
    Uses Open-Meteo free API.
    Returns DataFrame with columns: datetime (UTC), temp, humidity, pressure, wind, precipitation
    """
    # choose hourly variables
    hourly_vars = [
        "temperature_2m",
        "relativehumidity_2m",
        "pressure_msl",
        "wind_speed_10m",
        "precipitation"
    ]
    hourly = ",".join(hourly_vars)
    # Open-Meteo returns next 7 days usually; ask for timezone=UTC to keep things simple
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        f"&hourly={hourly}&timezone=UTC"
    )
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    j = r.json()
    hw = j.get("hourly", {})
    times = hw.get("time", [])
    if not times:
        return None
    df = pd.DataFrame({
        "datetime": pd.to_datetime(hw["time"]),
        "temp": hw.get("temperature_2m"),
        "humidity": hw.get("relativehumidity_2m"),
        "pressure": hw.get("pressure_msl"),
        "wind": hw.get("wind_speed_10m"),
        "precipitation": hw.get("precipitation")
    })
    # Keep only needed hours
    if hours:
        df = df.iloc[:hours].reset_index(drop=True)
    return df
