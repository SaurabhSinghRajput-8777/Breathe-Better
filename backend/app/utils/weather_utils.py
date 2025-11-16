# app/utils/weather_utils.py
import requests
import pandas as pd

def fetch_hourly_weather(lat: float, lon: float, past_days: int = 0, forecast_hours: int = 168):
    """
    Fetch hourly weather for a location.
    
    🔥 This function is now "smart":
    - If past_days > 0, it calls the HISTORICAL API (archive-api) for training.
    - If forecast_hours > 0, it calls the FORECAST API (api) for predicting.
    
    Returns DataFrame with columns: datetime (UTC), temp, humidity, pressure, wind, precipitation
    """
    # These are the variables we want from both APIs
    hourly_vars = [
        "temperature_2m",
        "relativehumidity_2m",
        "pressure_msl",
        "wind_speed_10m",
        "precipitation"
    ]
    hourly = ",".join(hourly_vars)
    
    # --- 🔥 NEW API LOGIC ---
    
    if past_days > 0 and forecast_hours == 0:
        # --- We need HISTORICAL data for training ---
        print(f"Fetching HISTORICAL weather for {past_days} days...")
        
        # The Archive API needs start and end dates
        end_date = pd.Timestamp.utcnow().strftime('%Y-%m-%d')
        start_date = (pd.Timestamp.utcnow() - pd.Timedelta(days=past_days)).strftime('%Y-%m-%d')
        
        url = (
            f"https://archive-api.open-meteo.com/v1/archive?"
            f"latitude={lat}&longitude={lon}"
            f"&start_date={start_date}&end_date={end_date}"
            f"&hourly={hourly}&timezone=UTC"
        )
        
    elif past_days == 0 and forecast_hours > 0:
        # --- We need FORECAST data for prediction ---
        print(f"Fetching FORECAST weather for {forecast_hours} hours...")
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}"
            f"&hourly={hourly}&timezone=UTC"
            f"&past_days=0" # Explicitly 0
            f"&forecast_hours={forecast_hours}"
        )
    else:
        # This function is not designed to get both at once, or neither.
        print("Invalid weather request: Must ask for *either* past days or forecast hours, not both.")
        return pd.DataFrame()
        
    # --- END NEW API LOGIC ---
    
    try:
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        j = r.json()
    except requests.exceptions.RequestException as e:
        print(f"Weather API request failed: {e}")
        return pd.DataFrame()

    hw = j.get("hourly", {})
    times = hw.get("time", [])
    if not times:
        print("Weather API returned no hourly data from the correct API.")
        return pd.DataFrame()
        
    df = pd.DataFrame({
        "datetime": pd.to_datetime(hw["time"], utc=True), # Keep utc=True
        "temp": hw.get("temperature_2m"),
        "humidity": hw.get("relativehumidity_2m"),
        "pressure": hw.get("pressure_msl"),
        "wind": hw.get("wind_speed_10m"),
        "precipitation": hw.get("precipitation")
    })
    
    # Ensure no Nones (can happen in API response)
    df = df.dropna(subset=['datetime'])
    
    return df