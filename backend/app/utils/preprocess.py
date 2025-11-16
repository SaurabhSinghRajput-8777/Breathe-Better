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

    # remove duplicate datetime rows in weather, keep the latest
    df_weather = df_weather.drop_duplicates(subset="datetime", keep="last")

    # 🔥 the FIX — clean merge
    merged = pd.merge(df_pm25, df_weather, on="datetime", how="left")

    merged = merged.sort_values("datetime").reset_index(drop=True)

    # forward/backfill weather gaps
    weather_cols = [
        c for c in merged.columns
        if c not in ["datetime", "pm25", "lat", "lon"]
    ]

    if weather_cols:
        merged[weather_cols] = merged[weather_cols].ffill().bfill()

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

    # ensure numeric pm25
    df["pm25"] = pd.to_numeric(df["pm25"], errors="coerce")

    # sort
    df = df.sort_values("datetime").reset_index(drop=True)

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
    # weather_cols will include time features as well; that's okay

    # keep only relevant columns: datetime, y, lag features, weather/time features
    feature_cols = [c for c in df.columns if c.startswith("pm25_lag_")] + [c for c in weather_cols if c != "y" and c != "pm25"]
    keep_cols = ["datetime", "y"] + feature_cols
    out = df[keep_cols].copy()

    # drop rows with NaN in any of feature columns or target
    out = out.dropna().reset_index(drop=True)

    return out
