# app/utils/preprocess.py
"""
Preprocessing utilities for BreatheBetter.
- merge_pm25_weather(df_pm25, df_weather)
- make_features(df, lags=[1,2,3,6,12,24], horizon=1)
"""

import pandas as pd
from typing import List

def _ensure_dt(df: pd.DataFrame, col="datetime"):
    df = df.copy()
    if col in df.columns:
        df[col] = pd.to_datetime(df[col])
    else:
        raise ValueError(f"Missing datetime column: {col}")
    return df

def merge_pm25_weather(df_pm25: pd.DataFrame, df_weather: pd.DataFrame) -> pd.DataFrame:
    """
    Merge historical pm25 (datetime, pm25) WITH weather data (datetime, temp, humidity, etc.)
    Clean, safe merge using 'on="datetime"' only.
    """
    if df_pm25 is None or df_weather is None:
        return None

    df_pm25 = _ensure_dt(df_pm25)
    df_weather = _ensure_dt(df_weather)

    # round to nearest hour
    df_pm25["datetime"] = df_pm25["datetime"].dt.round("H")
    df_weather["datetime"] = df_weather["datetime"].dt.round("H")

    # remove duplicate datetime rows
    df_pm25 = df_pm25.drop_duplicates(subset="datetime", keep="last")
    df_weather = df_weather.drop_duplicates(subset="datetime", keep="last")

    # 🔥 THE FIX (Part 1): Create a complete hourly index
    # This finds the earliest and latest date in *either* dataset.
    min_dt = min(df_pm25["datetime"].min(), df_weather["datetime"].min())
    max_dt = max(df_pm25["datetime"].max(), df_weather["datetime"].max())
    
    # Create a perfect, hourly index spanning the full range
    hourly_index = pd.date_range(start=min_dt.floor('H'), end=max_dt.ceil('H'), freq='H')
    
    # Create a new DataFrame based on this perfect index
    df_complete = pd.DataFrame(hourly_index, columns=["datetime"])

    # Merge PM2.5 and weather data onto the perfect index
    # We set datetime as index to merge on it, then reset it
    df_pm25 = df_pm25.set_index("datetime")
    df_weather = df_weather.set_index("datetime")
    
    df_complete = df_complete.set_index("datetime")
    
    df_complete = df_complete.join(df_pm25[["pm25"]])
    df_complete = df_complete.join(df_weather.drop(columns=["lat", "lon"], errors="ignore"))
    
    df_complete = df_complete.reset_index()

    # 🔥 THE FIX (Part 2): Robust interpolation
    # Now that we have all rows, we can safely fill gaps.
    
    # Ensure all feature columns are numeric
    all_cols = list(df_complete.columns)
    all_cols.remove("datetime")
    
    for col in all_cols:
         df_complete[col] = pd.to_numeric(df_complete[col], errors="coerce")
         
    # 1. Interpolate to fill most gaps (linear fill)
    df_complete[all_cols] = df_complete[all_cols].interpolate(method='linear', limit_direction='both')
    # 2. ffill/bfill to clean up any remaining NaNs at the start/end
    df_complete[all_cols] = df_complete[all_cols].ffill().bfill()

    # Final safety net
    merged = df_complete.dropna().reset_index(drop=True)

    return merged



def make_features(df: pd.DataFrame, lags: List[int] = None, horizon: int = 1) -> pd.DataFrame:
    """
    Create features for supervised forecasting.
    - lags: list of integer lags in hours to include (e.g., [1,2,3,6,12,24])
    - horizon: how many hours ahead to predict (1 => next hour)
    Returns DataFrame with target column 'y' and features (lag cols, weather, time features).
    IMPORTANT: Does NOT include raw 'pm25' as a feature (only lagged pm25).
    """
    if lags is None:
        lags = [1,2,3,6,12,24]

    df = df.copy()
    df = _ensure_dt(df)
    
    # Data is already sorted and interpolated from merge_pm25_weather
    
    # create lag features from pm25
    for lag in lags:
        df[f"pm25_lag_{lag}"] = df["pm25"].shift(lag)

    # create target column (future pm25 at horizon)
    df["y"] = df["pm25"].shift(-horizon)

    # time features
    df["hour"] = df["datetime"].dt.hour
    df["day"] = df["datetime"].dt.day
    df["month"] = df["datetime"].dt.month
    df["weekday"] = df["datetime"].dt.weekday

    # collect weather columns (exclude pm25 and datetime)
    exclude = {"datetime", "pm25", "y"}
    weather_cols = [c for c in df.columns if c not in exclude and not c.startswith("pm25_lag_")]

    # keep only relevant columns: datetime, y, lag features, weather/time features
    feature_cols = [c for c in df.columns if c.startswith("pm25_lag_")] + [c for c in weather_cols if c != "y" and c != "pm25"]
    keep_cols = ["datetime", "y"] + feature_cols
    out = df[keep_cols].copy()

    # drop rows with NaN in any of feature columns or target (e.g. from lags)
    out = out.dropna().reset_index(drop=True)

    return out