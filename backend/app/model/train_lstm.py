# backend/app/model/train_lstm.py
import numpy as np
import pandas as pd
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from sklearn.preprocessing import MinMaxScaler
import os
from ..utils.data_utils import load_sample_data

def create_sequences(values, seq_len):
    X, y = [], []
    for i in range(len(values) - seq_len):
        X.append(values[i:i+seq_len])
        y.append(values[i+seq_len])
    return np.array(X), np.array(y)

def train(seq_len=24, epochs=20, batch=32):
    df = load_sample_data()
    series = df['pm25'].values.reshape(-1,1)
    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(series)
    X, y = create_sequences(scaled.flatten(), seq_len)
    X = X.reshape((X.shape[0], X.shape[1], 1))
    # split
    split = int(0.8 * len(X))
    X_train, X_val = X[:split], X[split:]
    y_train, y_val = y[:split], y[split:]
    model = Sequential([
        LSTM(64, input_shape=(seq_len,1), return_sequences=False),
        Dense(32, activation='relu'),
        Dense(1)
    ])
    model.compile(optimizer='adam', loss='mse')
    os.makedirs(os.path.join(os.path.dirname(__file__), "weights"), exist_ok=True)
    ckpt = os.path.join(os.path.dirname(__file__), "weights", "lstm_best.h5")
    model.fit(X_train, y_train, validation_data=(X_val, y_val), epochs=epochs,
              batch_size=batch, callbacks=[EarlyStopping(patience=5), ModelCheckpoint(ckpt, save_best_only=True)])
    model.save(os.path.join(os.path.dirname(__file__), "weights", "lstm_final.h5"))
    print("Model trained & saved:", ckpt)

if __name__ == "__main__":
    train()
