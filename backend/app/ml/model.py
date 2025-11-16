# app/ml/model.py
"""
Updated model training / load / predict
- Saves and loads models/scalers/metrics based on city name.
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
    XGBRegressor = None

# paths
BASE_DIR = Path(__file__).resolve().parent
WEIGHTS_DIR = BASE_DIR / "weights"
WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)

# default ensemble weights (can be tuned)
ENSEMBLE_WEIGHTS = {"xgb": 0.5, "rf": 0.3, "lr": 0.2}
DEFAULT_LAGS = [1,2,3,6,12,24]


# -----------------------
# NEW: Helper for city-specific paths
# -----------------------
def get_model_paths(city: str):
    """Returns city-specific paths for model, scaler, and metrics."""
    city_slug = city.lower().replace(" ", "_")
    MODEL_PATH = WEIGHTS_DIR / f"ensemble_bundle_{city_slug}.joblib"
    METRICS_PATH = WEIGHTS_DIR / f"metrics_{city_slug}.json"
    # Note: Scaler is now inside the bundle, so no separate path needed
    return MODEL_PATH, METRICS_PATH


# -----------------------
# Training
# -----------------------
def train_model(city: str, df_pm25: pd.DataFrame, df_weather: pd.DataFrame, lags: list = None, horizon: int = 1) -> dict:
    """
    Train ensemble using lag features and weather/time features.
    Saves bundle (model+scaler) and metrics to city-specific files.
    """
    if lags is None:
        lags = DEFAULT_LAGS
    
    MODEL_PATH, METRICS_PATH = get_model_paths(city)

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
        raise ValueError(f"Not enough rows to train for {city} (need >=30 rows, got {n}).")

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
        ENSEMBLE_WEIGHTS["xgb"] = 0 # Adjust weight if xgb fails
        ENSEMBLE_WEIGHTS["rf"] = 0.6 # Re-balance
        ENSEMBLE_WEIGHTS["lr"] = 0.4

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

    # metrics on test set
    mae = float(mean_absolute_error(y_test, p_ensemble))
    rmse = float(np.sqrt(mean_squared_error(y_test, p_ensemble)))
    r2 = float(r2_score(y_test, p_ensemble))

    # residual stds
    res_xgb = (y_test - preds["xgb"]) if len(y_test)>0 else np.array([])
    res_rf = (y_test - preds["rf"]) if len(y_test)>0 else np.array([])
    res_lr = (y_test - preds["lr"]) if len(y_test)>0 else np.array([])
    stds = {
        "xgb": float(np.std(res_xgb, ddof=1)) if res_xgb.size>1 else 0.0,
        "rf": float(np.std(res_rf, ddof=1)) if res_rf.size>1 else 0.0,
        "lr": float(np.std(res_lr, ddof=1)) if res_lr.size>1 else 0.0
    }
    
    # ... (rf_tree_var calculation) ...
    try:
        tree_preds = np.vstack([t.predict(X_test_scaled) for t in rf.estimators_]) if hasattr(rf, "estimators_") else np.zeros((1, len(y_test)))
        per_sample_var = np.var(tree_preds, axis=0, ddof=1) if tree_preds.size>0 else np.array([0.0])
        mean_tree_var = float(np.mean(per_sample_var)) if per_sample_var.size>0 else 0.0
    except Exception:
        mean_tree_var = 0.0

    # Save bundle: models + scaler + meta
    bundle = {
        "models": {"xgb": models.get("xgb"), "rf": models["rf"], "lr": models["lr"]},
        "scaler": scaler, # Include scaler in bundle
        "feature_names": feature_names,
        "lags": lags,
        "horizon": horizon,
        "weights": ENSEMBLE_WEIGHTS,
        "trained_at": datetime.utcnow().isoformat()
    }

    try:
        joblib.dump(bundle, MODEL_PATH)
    except Exception as e:
        raise RuntimeError(f"Failed to save model bundle for {city}: {e}")

    # compute accuracy
    mean_y = float(np.mean(y_test)) if len(y_test)>0 else 0.0
    accuracy_percent = (1.0 - (mae / (mean_y + 1e-9))) * 100.0 if mean_y > 0 else 0.0
    accuracy_percent = max(0.0, min(100.0, accuracy_percent))

    metrics = {
        "status": "trained",
        "city": city,
        "rows": int(n),
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
def load_model(city: str):
    """
    Returns (bundle, scaler, metrics_dict) for a specific city.
    """
    MODEL_PATH, METRICS_PATH = get_model_paths(city)

    if not MODEL_PATH.exists():
        return None, None, None
    try:
        bundle = joblib.load(MODEL_PATH)
    except Exception as e:
        print(f"Failed to load model bundle for {city}: {e}")
        return None, None, None
        
    scaler = bundle.get("scaler")
    if scaler is None:
        print(f"Model bundle for {city} is missing scaler.")
        return None, None, None
        
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
    (No changes needed in this function's logic)
    """
    from app.utils.preprocess import _ensure_dt

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

    if last_history is None or last_history.empty:
        raise ValueError("last_history required for iterative predictions.")
        
    last_hist = last_history.copy()
    last_hist["datetime"] = pd.to_datetime(last_hist["datetime"])
    last_hist = last_hist.sort_values("datetime").reset_index(drop=True)

    max_lag = max(lags)
    recent = last_hist.tail(max_lag)["pm25"].tolist()
    if len(recent) < max_lag:
        pad_val = float(last_hist["pm25"].mean()) if not last_hist["pm25"].isna().all() else 0.0
        pad = [pad_val] * (max_lag - len(recent))
        recent = pad + recent

    preds = []
    pred_datetimes = []

    for idx, row in future.iterrows():
        feat = {}
        for lag in lags:
            val = recent[-lag] if lag <= len(recent) else recent[0]
            feat[f"pm25_lag_{lag}"] = float(val) if val is not None else 0.0

        dt = pd.to_datetime(row["datetime"])
        feat["hour"] = int(dt.hour)
        feat["day"] = int(dt.day)
        feat["month"] = int(dt.month)
        feat["weekday"] = int(dt.weekday())

        for col in feature_names:
            if col.startswith("pm25_lag_") or col in ["hour","day","month","weekday"]:
                continue
            feat[col] = float(row[col]) if col in row and not pd.isna(row[col]) else 0.0

        X_row = pd.DataFrame([feat], columns=feature_names)
        X_scaled = scaler.transform(X_row)

        p_xgb = models.get("xgb").predict(X_scaled) if models.get("xgb") is not None else np.zeros(1)
        p_rf = models.get("rf").predict(X_scaled)
        p_lr = models.get("lr").predict(X_scaled)

        p = weights.get("xgb",0)*p_xgb + weights.get("rf",0)*p_rf + weights.get("lr",0)*p_lr
        p_val = float(p.ravel()[0])
        preds.append(p_val)
        pred_datetimes.append(str(dt))

        recent.append(p_val)
        if len(recent) > max_lag:
            recent.pop(0)

    # Return result_df for compatibility with main.py
    result_df = future.copy()
    result_df['pm25_pred'] = preds
    
    return {"datetimes": pred_datetimes, "predictions": np.array(preds), "result_df": result_df}


# -----------------------
# Metrics helper
# -----------------------
def get_metrics(city: str):
    """Gets metrics for a specific city."""
    MODEL_PATH, METRICS_PATH = get_model_paths(city)
    
    if METRICS_PATH.exists():
        try:
            with open(METRICS_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"error":f"failed to read metrics for {city}"}
            
    return {"error":f"model not trained for {city}"}