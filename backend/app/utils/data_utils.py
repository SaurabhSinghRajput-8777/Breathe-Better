# app/utils/data_utils.py
import requests

# ---------------------------------------------
#  Fetch live AQI data from OpenAQ API (Existing)
# ---------------------------------------------

OPENAQ_URL = "https://api.openaq.org/v2/latest"


def fetch_live_aqi(city: str):
    """
    Fetches real-time AQI pollutant readings from OpenAQ API.
    Returns dictionary containing pm25, pm10, no2, o3, so2, co and timestamp.
    """
    params = {
        "city": city,
        "limit": 1
    }

    try:
        response = requests.get(OPENAQ_URL, params=params)
        data = response.json()
    except Exception:
        return None

    # Validate
    if "results" not in data or len(data["results"]) == 0:
        return None

    measurements = data["results"][0]["measurements"]

    # Extract pollutants safely
    def get_value(param):
        for m in measurements:
            if m["parameter"] == param:
                return m["value"]
        return None

    return {
        "pm25": get_value("pm25"),
        "pm10": get_value("pm10"),
        "no2": get_value("no2"),
        "o3": get_value("o3"),
        "so2": get_value("so2"), # ADDED
        "co": get_value("co"),   # ADDED
        "datetime": measurements[0]["lastUpdated"]
    }


# ---------------------------------------------
#  AQI CALCULATION (EPA BREAKPOINT METHOD) (Existing)
# ---------------------------------------------

def calculate_aqi(pm25):
    """
    Approximate AQI based on PM2.5 using standard EPA breakpoints.
    """
    if pm25 is None:
        return None

    pm25 = float(pm25)

    if 0 <= pm25 <= 12:
        return (pm25 / 12) * 50
    elif 12 < pm25 <= 35.4:
        return 50 + (pm25 - 12) * (50 / 23.4)
    elif 35.5 <= pm25 <= 55.4:
        return 100 + (pm25 - 35.4) * (50 / 20)
    elif 55.5 <= pm25 <= 150.4:
        return 150 + (pm25 - 55.4) * (100 / 95)
    elif 150.5 <= pm25 <= 250.4:
        return 200 + (pm25 - 150.4) * (100 / 100)
    else:
        return 300 + (pm25 - 250.4) * (100 / 150)


# ---------------------------------------------
#  AQI CATEGORY LABELS (Existing)
# ---------------------------------------------

def category(aqi):
    """
    Maps numeric AQI value to its air quality category.
    """
    if aqi is None:
        return "Unknown"

    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Moderate"
    if aqi <= 150:
        return "Unhealthy for Sensitive Groups"
    if aqi <= 200:
        return "Unhealthy"
    if aqi <= 300:
        return "Very Unhealthy"
    return "Hazardous"

# -------------------------------------------------------------------
# NEW ADDITION FOR THE SPATIAL HEATMAP
# (This is the part that is missing)
# -------------------------------------------------------------------
CITY_BOUNDING_BOXES = {
    "Delhi": {"lat_min": 28.4, "lat_max": 28.9, "lon_min": 76.8, "lon_max": 77.4},
    "Mumbai": {"lat_min": 18.8, "lat_max": 19.3, "lon_min": 72.7, "lon_max": 73.1},
    "Bengaluru": {"lat_min": 12.8, "lat_max": 13.1, "lon_min": 77.4, "lon_max": 77.8},
    "Hyderabad": {"lat_min": 17.2, "lat_max": 17.6, "lon_min": 78.2, "lon_max": 78.7},
    "Chennai": {"lat_min": 12.9, "lat_max": 13.2, "lon_min": 80.1, "lon_max": 80.4},
    "Kolkata": {"lat_min": 22.4, "lat_max": 22.7, "lon_min": 88.2, "lon_max": 88.5},
}