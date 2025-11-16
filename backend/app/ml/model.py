# app/ml/model.py
"""
Updated model training / load / predict that avoids leakage.
- Trains on lag features + weather/time features
- Uses chronological train/test split
- Iterative forecasting for future hours using last observed lags
"""

import os
import json
import joblib
from pathlib import Path
from datetime import datetime
import numpy as np
import pandas as pd

from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

try:
    from xgboost import XGBRegressor
except Exception:
    XGBRegressor = None  # if not installed, we will skip xgb but prefer to have it

# paths
BASE_DIR = Path(__file__).resolve().parent
WEIGHTS_DIR = BASE_DIR / "weights"
WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = WEIGHTS_DIR / "ensemble_joblib_v3.joblib"
SCALER_PATH = WEIGHTS_DIR / "scaler_v3.joblib"
METRICS_PATH = WEIGHTS_DIR / "metrics_v3.json"

# default ensemble weights (can be tuned)
ENSEMBLE_WEIGHTS = {"xgb": 0.5, "rf": 0.3, "lr": 0.2}
DEFAULT_LAGS = [1,2,3,6,12,24]


# -----------------------
# Training
# -----------------------
def train_model(df_pm25: pd.DataFrame, df_weather: pd.DataFrame, lags: list = None, horizon: int = 1) -> dict:
    """
    Train ensemble using lag features and weather/time features.
    Uses chronological split (first 80% train, last 20% test).
    Returns metrics (test metrics) and saves model bundle.
    """
    if lags is None:
        lags = DEFAULT_LAGS

    # lazy import preprocess
    from app.utils.preprocess import merge_pm25_weather, make_features

    # validate
    if df_pm25 is None or df_weather is None:
        raise ValueError("Missing input dataframes")

    merged = merge_pm25_weather(df_pm25, df_weather)
    if merged is None or merged.empty:
        raise ValueError("Merged data is empty")

    df_feat = make_features(merged, lags=lags, horizon=horizon)
    if df_feat is None or df_feat.empty:
        raise ValueError("No usable rows after feature creation. Increase history or adjust lags.")

    # Prepare X, y
    y = df_feat["y"].values
    X = df_feat.drop(columns=["datetime", "y"], errors="ignore")
    feature_names = list(X.columns)

    # need enough rows
    n = len(X)
    if n < 30:
        raise ValueError("Not enough rows to train (need >=30 rows).")

    # chronological split
    split_idx = int(n * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]

    # scaler fit on train
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # instantiate models
    models = {}
    if XGBRegressor is not None:
        xgb = XGBRegressor(n_estimators=250, learning_rate=0.05, max_depth=6, subsample=0.9, colsample_bytree=0.9, objective="reg:squarederror", random_state=42, verbosity=0)
        xgb.fit(X_train_scaled, y_train)
        models["xgb"] = xgb
    else:
        models["xgb"] = None

    rf = RandomForestRegressor(n_estimators=200, n_jobs=-1, random_state=42)
    rf.fit(X_train_scaled, y_train)
    models["rf"] = rf

    lr = LinearRegression()
    lr.fit(X_train_scaled, y_train)
    models["lr"] = lr

    # predictions on test set
    preds = {}
    if models.get("xgb") is not None:
        preds["xgb"] = models["xgb"].predict(X_test_scaled)
    else:
        preds["xgb"] = np.zeros_like(y_test)

    preds["rf"] = models["rf"].predict(X_test_scaled)
    preds["lr"] = models["lr"].predict(X_test_scaled)

    # ensemble prediction using configured weights
    w = ENSEMBLE_WEIGHTS
    p_ensemble = w.get("xgb",0)*preds["xgb"] + w.get("rf",0)*preds["rf"] + w.get("lr",0)*preds["lr"]

    # metrics on test set (realistic eval)
    mae = float(mean_absolute_error(y_test, p_ensemble))
    rmse = float(np.sqrt(mean_squared_error(y_test, p_ensemble)))
    r2 = float(r2_score(y_test, p_ensemble))

    # residual stds per model on test
    res_xgb = (y_test - preds["xgb"]) if len(y_test)>0 else np.array([])
    res_rf = (y_test - preds["rf"]) if len(y_test)>0 else np.array([])
    res_lr = (y_test - preds["lr"]) if len(y_test)>0 else np.array([])

    stds = {
        "xgb": float(np.std(res_xgb, ddof=1)) if res_xgb.size>1 else 0.0,
        "rf": float(np.std(res_rf, ddof=1)) if res_rf.size>1 else 0.0,
        "lr": float(np.std(res_lr, ddof=1)) if res_lr.size>1 else 0.0
    }

    # rf tree variance on test predictions (optional)
    try:
        tree_preds = np.vstack([t.predict(X_test_scaled) for t in rf.estimators_]) if hasattr(rf, "estimators_") else np.zeros((1, len(y_test)))
        per_sample_var = np.var(tree_preds, axis=0, ddof=1) if tree_preds.size>0 else np.array([0.0])
        mean_tree_var = float(np.mean(per_sample_var)) if per_sample_var.size>0 else 0.0
    except Exception:
        mean_tree_var = 0.0

    # Save bundle: models + scaler + meta
    bundle = {
        "models": {"xgb": models.get("xgb"), "rf": models["rf"], "lr": models["lr"]},
        "scaler": scaler,
        "feature_names": feature_names,
        "lags": lags,
        "horizon": horizon,
        "weights": ENSEMBLE_WEIGHTS,
        "trained_at": datetime.utcnow().isoformat()
    }

    try:
        joblib.dump(bundle, MODEL_PATH)
        # also save scaler separately for backward compatibility
        joblib.dump(scaler, SCALER_PATH)
    except Exception as e:
        raise RuntimeError(f"Failed to save model bundle: {e}")

    # compute accuracy_percent similar to before but on test set
    mean_y = float(np.mean(y_test)) if len(y_test)>0 else 0.0
    accuracy_percent = (1.0 - (mae / (mean_y + 1e-9))) * 100.0 if mean_y > 0 else 0.0
    accuracy_percent = max(0.0, min(100.0, accuracy_percent))

    metrics = {
        "status": "trained",
        "rows": int(n),
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "MAE": round(mae, 4),
        "RMSE": round(rmse, 4),
        "R2_score": round(r2, 4),
        "accuracy_percent": round(accuracy_percent, 2),
        "residual_std": {"xgb": round(stds["xgb"],4), "rf": round(stds["rf"],4), "lr": round(stds["lr"],4)},
        "rf_tree_var": round(mean_tree_var,6),
        "weights": ENSEMBLE_WEIGHTS,
        "trained_at": bundle["trained_at"]
    }

    try:
        with open(METRICS_PATH, "w", encoding="utf-8") as f:
            json.dump(metrics, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

    return metrics


# -----------------------
# Load model
# -----------------------
def load_model():
    """
    Returns (bundle, scaler, metrics_dict) or (None, None, None).
    Bundle contains models, scaler, feature_names, lags, horizon, weights.
    """
    if not MODEL_PATH.exists():
        return None, None, None
    try:
        bundle = joblib.load(MODEL_PATH)
    except Exception as e:
        raise RuntimeError(f"Failed to load model bundle: {e}")
    scaler = bundle.get("scaler")
    metrics = None
    if METRICS_PATH.exists():
        try:
            with open(METRICS_PATH, "r", encoding="utf-8") as f:
                metrics = json.load(f)
        except Exception:
            metrics = None
    return bundle, scaler, metrics


# -----------------------
# Iterative future prediction
# -----------------------
def predict_future(bundle: dict, scaler: StandardScaler, future_weather: pd.DataFrame, last_history: pd.DataFrame = None):
    """
    Iteratively predict horizon=1 forward for len(future_weather) hours.
    - bundle: loaded model bundle
    - scaler: StandardScaler (not strictly required if bundle contains scaler)
    - future_weather: dataframe with datetime + weather cols for each future hour
    - last_history: recent historical pm25 with datetime & pm25 to bootstrap lags
    Returns dict with predictions aligned to future_weather datetimes.
    """
    from app.utils.preprocess import _ensure_dt  # internal helper

    if bundle is None:
        raise ValueError("Model bundle missing")

    future = future_weather.copy()
    future = _ensure_dt(future, col="datetime")
    future = future.sort_values("datetime").reset_index(drop=True)

    feature_names = bundle.get("feature_names", [])
    lags = bundle.get("lags", DEFAULT_LAGS)
    horizon = bundle.get("horizon", 1)
    models = bundle.get("models", {})
    weights = bundle.get("weights", ENSEMBLE_WEIGHTS)

    # Build initial lag list from last_history
    if last_history is None or last_history.empty:
        raise ValueError("last_history required for iterative predictions (to bootstrap lag features).")
    last_hist = last_history.copy()
    last_hist["datetime"] = pd.to_datetime(last_hist["datetime"])
    last_hist = last_hist.sort_values("datetime").reset_index(drop=True)

    # extract last max(lags) pm25 values as a deque-like list (most recent last)
    max_lag = max(lags)
    recent = last_hist.tail(max_lag)["pm25"].tolist()
    if len(recent) < max_lag:
        # pad at front with mean or zeros
        pad = [float(np.nanmean(last_hist["pm25"])) if not last_hist["pm25"].isna().all() else 0.0] * (max_lag - len(recent))
        recent = pad + recent

    # predictions list
    preds = []
    pred_datetimes = []

    # For each future hour, create feature vector using weather for that hour and lag features from 'recent'
    for idx, row in future.iterrows():
        # build a feature dictionary
        feat = {}

        # pm25_lag_k: take value from recent (recent[-1] is t-1, recent[-2] is t-2, etc.)
        for lag in lags:
            # get value at position -lag
            val = recent[-lag] if lag <= len(recent) else recent[0]
            feat[f"pm25_lag_{lag}"] = float(val) if val is not None else 0.0

        # time features from datetime
        dt = pd.to_datetime(row["datetime"])
        feat["hour"] = int(dt.hour)
        feat["day"] = int(dt.day)
        feat["month"] = int(dt.month)
        feat["weekday"] = int(dt.weekday())

        # include weather columns present in feature_names (if available in future df)
        for col in feature_names:
            if col.startswith("pm25_lag_") or col in ["hour","day","month","weekday"]:
                continue
            # if future has this weather column, use it; else try to fallback to NaN -> 0
            feat[col] = float(row[col]) if col in row and not pd.isna(row[col]) else 0.0

        # create DataFrame row matching feature_names order
        X_row = pd.DataFrame([feat], columns=feature_names)
        # scale
        X_scaled = scaler.transform(X_row)

        # model preds
        p_xgb = models.get("xgb").predict(X_scaled) if models.get("xgb") is not None else np.zeros(1)
        p_rf = models.get("rf").predict(X_scaled)
        p_lr = models.get("lr").predict(X_scaled)

        p = weights.get("xgb",0)*p_xgb + weights.get("rf",0)*p_rf + weights.get("lr",0)*p_lr
        p_val = float(p.ravel()[0])
        preds.append(p_val)
        pred_datetimes.append(str(dt))

        # append predicted value into recent list (it becomes the newest pm25) and pop oldest to keep length
        recent.append(p_val)
        if len(recent) > max_lag:
            recent.pop(0)

    return {"datetimes": pred_datetimes, "predictions": np.array(preds)}


# -----------------------
# Metrics helper
# -----------------------
def get_metrics():
    if METRICS_PATH.exists():
        try:
            with open(METRICS_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"error":"failed to read metrics"}
    return {"error":"model not trained"}
