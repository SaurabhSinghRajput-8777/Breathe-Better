# app/utils/report_utils.py
import io
import json
from datetime import datetime
import pandas as pd
from matplotlib.backends.backend_pdf import PdfPages
import matplotlib.pyplot as plt

# Produce a PDF (bytes) containing:
# - Title + timestamp
# - Metrics JSON (nicely formatted)
# - Time-series plot (pm25 vs datetime)
# - Small table of last N rows
def generate_pdf_report(city: str, df_history: pd.DataFrame, metrics: dict, days: int = 7) -> bytes:
    """
    Returns PDF bytes for a summary report.
    Expects df_history with columns: datetime (pd.Timestamp) and pm25 (numeric).
    """
    buffer = io.BytesIO()

    # Ensure datetime dtype
    if df_history is None or df_history.empty:
        df = pd.DataFrame(columns=["datetime", "pm25"])
    else:
        df = df_history.copy()
        df["datetime"] = pd.to_datetime(df["datetime"])

    # Create PDF via matplotlib PdfPages
    with PdfPages(buffer) as pdf:
        # --- Page 1: Title + metrics ---
        fig, ax = plt.subplots(figsize=(8.27, 11.69))  # A4 portrait
        ax.axis("off")

        title = f"BreatheBetter — City Report: {city}"
        ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

        ax.text(0.5, 0.94, title, ha="center", va="center", fontsize=18, weight="bold")
        ax.text(0.5, 0.90, f"Generated: {ts}", ha="center", va="center", fontsize=9)

        # Metrics block (pretty-printed)
        metrics_text = json.dumps(metrics, indent=2) if metrics else '{"error":"no metrics"}'
        # split into lines and draw
        lines = metrics_text.splitlines()
        y = 0.80
        ax.text(0.02, y, "Model Metrics:", ha="left", va="top", fontsize=11, weight="bold")
        y -= 0.02
        max_lines = 28
        for i, line in enumerate(lines[:max_lines]):
            ax.text(0.02, y, line, ha="left", va="top", fontsize=8, family="monospace")
            y -= 0.025

        if len(lines) > max_lines:
            ax.text(0.02, y, "... (truncated)", ha="left", va="top", fontsize=8)

        pdf.savefig(fig, bbox_inches="tight")
        plt.close(fig)

        # --- Page 2: Time-series plot ---
        if not df.empty:
            fig2, ax2 = plt.subplots(figsize=(11.69, 6))  # wide page for time series
            ax2.plot(df["datetime"], df["pm25"])
            ax2.set_title(f"PM2.5 (last {days} days) — {city}")
            ax2.set_xlabel("Datetime")
            ax2.set_ylabel("PM2.5 (µg/m³)")
            ax2.grid(True, linestyle="--", linewidth=0.4)
            plt.xticks(rotation=30)
            pdf.savefig(fig2, bbox_inches="tight")
            plt.close(fig2)
        else:
            fig2, ax2 = plt.subplots(figsize=(8.27, 4.5))
            ax2.axis("off")
            ax2.text(0.5, 0.5, "No historical PM2.5 data available to plot.", ha="center", va="center")
            pdf.savefig(fig2, bbox_inches="tight")
            plt.close(fig2)

        # --- Page 3: Last N rows table ---
        last_n = 24 if len(df) >= 24 else len(df)
        if last_n > 0:
            subset = df.tail(last_n).copy()
            subset["datetime"] = subset["datetime"].dt.strftime("%Y-%m-%d %H:%M")
            fig3, ax3 = plt.subplots(figsize=(8.27, 11.69))
            ax3.axis("off")
            ax3.set_title(f"Last {last_n} hours — PM2.5", fontsize=12)
            # render table
            table = ax3.table(cellText=subset.values, colLabels=subset.columns, loc="center", cellLoc="center")
            table.auto_set_font_size(False)
            table.set_fontsize(8)
            table.scale(1, 1.1)
            pdf.savefig(fig3, bbox_inches="tight")
            plt.close(fig3)
        else:
            fig3, ax3 = plt.subplots(figsize=(8.27, 4.5))
            ax3.axis("off")
            ax3.text(0.5, 0.5, "No historical rows to show.", ha="center", va="center")
            pdf.savefig(fig3, bbox_inches="tight")
            plt.close(fig3)

    # Seek to start and return bytes
    buffer.seek(0)
    return buffer.getvalue()
