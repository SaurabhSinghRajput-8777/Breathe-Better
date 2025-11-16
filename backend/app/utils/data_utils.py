import requests

# ---------------------------------------------
#  Fetch live AQI data from OpenAQ API
# ---------------------------------------------

OPENAQ_URL = "https://api.openaq.org/v2/latest"


def fetch_live_aqi(city: str):
    """
    Fetches real-time AQI pollutant readings from OpenAQ API.
    Returns dictionary containing pm25, pm10, no2, o3, and timestamp.
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
        "datetime": measurements[0]["lastUpdated"]
    }


# ---------------------------------------------
#  AQI CALCULATION (EPA BREAKPOINT METHOD)
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
#  AQI CATEGORY LABELS
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
