# app/utils/report_utils.py
import io
import pandas as pd
import numpy as np
from datetime import datetime

# 🔥 CRITICAL: Force non-interactive backend for server use
import matplotlib
matplotlib.use('Agg') 

from matplotlib.backends.backend_pdf import PdfPages
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch

# --- STYLING CONSTANTS ---
COLOR_PRIMARY = "#4F46E5"    # Indigo
COLOR_SECONDARY = "#6B7280"  # Gray
COLOR_ACCENT_1 = "#10B981"   # Emerald
COLOR_ACCENT_2 = "#F59E0B"   # Amber
COLOR_ACCENT_3 = "#EF4444"   # Rose
BG_COLOR = "#F9FAFB"

def draw_header(ax, city, date_str):
    """Draws header on the provided axes."""
    rect = patches.Rectangle((0, 0.88), 1, 0.12, transform=ax.transAxes, facecolor=COLOR_PRIMARY, clip_on=False, zorder=0)
    ax.add_patch(rect)
    
    ax.text(0.05, 0.94, f"Air Quality Report: {city}", 
            fontsize=22, weight='bold', color='white', ha='left', va='center', transform=ax.transAxes)
    
    ax.text(0.05, 0.90, f"Generated on {date_str} • BreatheBetter AI", 
            fontsize=10, color='white', alpha=0.9, ha='left', va='center', transform=ax.transAxes)

def draw_kpi_card(ax, x, y, width, height, title, value, unit="", color=COLOR_PRIMARY):
    """Draws a stylized stat card."""
    rect = FancyBboxPatch(
        (x, y), width, height,
        boxstyle="round,pad=0.0,rounding_size=0.02", 
        facecolor='white',
        edgecolor='#E5E7EB',
        linewidth=1.0,
        zorder=1,
        transform=ax.transAxes
    )
    ax.add_patch(rect)
    
    stripe_h = 0.013
    stripe = patches.Rectangle((x, y + height - stripe_h), width, stripe_h, 
                               facecolor=color, zorder=2, transform=ax.transAxes)
    ax.add_patch(stripe)
    
    ax.text(x + 0.015, y + height - 0.03, title, fontsize=7, color=COLOR_SECONDARY, weight='bold', transform=ax.transAxes)
    ax.text(x + 0.015, y + 0.035, f"{value} {unit}", fontsize=12, color='#111827', weight='bold', transform=ax.transAxes)

def generate_pdf_report(city: str, df_history: pd.DataFrame, metrics: dict, days: int = 7) -> bytes:
    try:
        buffer = io.BytesIO()

        # 1. Prepare Data
        if df_history is None or df_history.empty:
            df = pd.DataFrame(columns=["datetime", "pm25"])
        else:
            df = df_history.copy()
            df["pm25"] = pd.to_numeric(df["pm25"], errors='coerce')
            df["datetime"] = pd.to_datetime(df["datetime"])
            df = df.dropna(subset=["pm25", "datetime"]).sort_values("datetime")
        
        if not metrics: metrics = {}
        acc = metrics.get("accuracy_percent", 0)
        mae = metrics.get("MAE", 0)
        rmse = metrics.get("RMSE", 0)
        r2 = metrics.get("R2_score", 0)
        
        with PdfPages(buffer) as pdf:
            # ==============================
            # PAGE 1: DASHBOARD
            # ==============================
            fig = plt.figure(figsize=(8.27, 11.69))
            fig.patch.set_facecolor(BG_COLOR)
            
            ax_canvas = fig.add_axes([0, 0, 1, 1], zorder=0)
            ax_canvas.axis('off')
            
            now_str = datetime.utcnow().strftime("%B %d, %Y")
            draw_header(ax_canvas, city, now_str)
            
            avg_pm = df["pm25"].mean() if not df.empty else 0
            peak_pm = df["pm25"].max() if not df.empty else 0
            
            # KPI Cards
            card_y, card_h, card_w, gap, start_x = 0.75, 0.09, 0.28, 0.04, 0.06
            draw_kpi_card(ax_canvas, start_x, card_y, card_w, card_h, "MODEL ACCURACY", f"{acc}%", "", color=COLOR_ACCENT_1)
            draw_kpi_card(ax_canvas, start_x + card_w + gap, card_y, card_w, card_h, f"{days}-DAY AVERAGE", f"{avg_pm:.1f}", "µg/m³", color=COLOR_PRIMARY)
            draw_kpi_card(ax_canvas, start_x + (card_w + gap)*2, card_y, card_w, card_h, "PEAK LEVEL", f"{peak_pm:.1f}", "µg/m³", color=COLOR_ACCENT_3)
            
            # Charts
            gs = gridspec.GridSpec(2, 1, height_ratios=[1.2, 0.8], figure=fig)
            gs.update(left=0.08, right=0.92, top=0.70, bottom=0.05, hspace=0.35)
            
            # Trend
            ax1 = fig.add_subplot(gs[0])
            ax1.set_facecolor('white')
            if not df.empty:
                ax1.plot(df["datetime"], df["pm25"], color=COLOR_PRIMARY, linewidth=1.5)
                ax1.fill_between(df["datetime"], df["pm25"], color=COLOR_PRIMARY, alpha=0.1)
                ax1.axhline(y=60, color=COLOR_ACCENT_2, linestyle="--", linewidth=1, label="Standard (60)")
                ax1.set_title(f"Hourly Pollution Trend (Last {days} Days)", loc='left', fontsize=10, weight='bold', color='#374151', pad=10)
                ax1.set_ylabel("PM2.5 (µg/m³)", fontsize=8)
                ax1.grid(True, linestyle=':', alpha=0.6)
                plt.setp(ax1.get_xticklabels(), rotation=0, fontsize=7)
            else:
                ax1.text(0.5, 0.5, "No Data", ha='center')
                ax1.axis('off')

            # Bottom Row
            gs_bottom = gridspec.GridSpecFromSubplotSpec(1, 2, subplot_spec=gs[1], wspace=0.25)
            ax2 = fig.add_subplot(gs_bottom[0])
            ax2.set_facecolor('white')
            if not df.empty and len(df) > 1:
                ax2.hist(df["pm25"], bins=15, color=COLOR_ACCENT_1, alpha=0.7, edgecolor='white')
                ax2.set_title("Pollution Distribution", loc='left', fontsize=9, weight='bold', color='#374151')
                ax2.set_xlabel("PM2.5 Value", fontsize=7)
                ax2.grid(axis='y', linestyle=':', alpha=0.5)
                ax2.spines['top'].set_visible(False)
                ax2.spines['right'].set_visible(False)
                ax2.tick_params(labelsize=7)
            else:
                ax2.axis('off')

            ax3 = fig.add_subplot(gs_bottom[1])
            ax3.axis('off')
            ax3.set_title("AI Performance Metrics", loc='left', fontsize=9, weight='bold', color='#374151', pad=10)
            stats_data = [["MAE", f"{mae:.2f}"], ["RMSE", f"{rmse:.2f}"], ["R² Score", f"{r2:.4f}"], ["Rows", f"{metrics.get('rows', 'N/A')}"]]
            tbl_stats = ax3.table(cellText=stats_data, loc='center', cellLoc='left', edges='horizontal')
            tbl_stats.auto_set_font_size(False)
            tbl_stats.set_fontsize(8)
            tbl_stats.scale(1, 1.8)
            for key, cell in tbl_stats.get_celld().items():
                cell.set_linewidth(0)
                if key[1] == 1: cell.set_text_props(weight='bold', ha='right')

            pdf.savefig(fig)
            plt.close()

            # ==============================
            # PAGE 2: DATA TABLE (Smart Logic)
            # ==============================
            if not df.empty:
                fig2 = plt.figure(figsize=(8.27, 11.69))
                fig2.patch.set_facecolor(BG_COLOR)
                
                ax_canvas2 = fig2.add_axes([0, 0, 1, 1], zorder=0)
                ax_canvas2.axis('off')
                draw_header(ax_canvas2, city, now_str)
                
                ax_tbl = fig2.add_subplot(111)
                ax_tbl.axis('off')
                
                def get_cat(x):
                    if x <= 30: return "Good"
                    if x <= 60: return "Moderate"
                    if x <= 90: return "Poor"
                    if x <= 120: return "Unhealthy"
                    return "Severe"

                # 🔥 SMART LOGIC:
                # If days > 2, show DAILY SUMMARY (Avg, Peak, Min).
                # Else, show HOURLY LOG.
                if days > 2:
                    ax_canvas2.text(0.05, 0.83, "Daily Summary Table", fontsize=14, weight='bold', color='#374151')
                    
                    # Resample to Daily
                    df_daily = df.set_index('datetime').resample('D')['pm25'].agg(['mean', 'max', 'min']).reset_index()
                    df_daily = df_daily.sort_values("datetime", ascending=False).dropna()
                    
                    df_daily["Date"] = df_daily["datetime"].dt.strftime("%Y-%m-%d")
                    df_daily["Avg"] = df_daily["mean"].round(1).astype(str)
                    df_daily["Peak"] = df_daily["max"].round(1).astype(str)
                    df_daily["Min"] = df_daily["min"].round(1).astype(str)
                    df_daily["Status"] = df_daily["mean"].apply(get_cat)
                    
                    table_data = df_daily[["Date", "Avg", "Peak", "Min", "Status"]].values.tolist()
                    col_labels = ["Date", "Avg PM2.5", "Peak", "Min", "Status"]
                    col_widths = [0.2, 0.2, 0.2, 0.2, 0.2]
                    
                else:
                    ax_canvas2.text(0.05, 0.83, "Hourly Data Log (Last 40 Hours)", fontsize=14, weight='bold', color='#374151')
                    
                    subset = df.tail(40).sort_values("datetime", ascending=False).copy()
                    subset["Date"] = subset["datetime"].dt.strftime("%Y-%m-%d")
                    subset["Time"] = subset["datetime"].dt.strftime("%H:%M")
                    subset["Value"] = subset["pm25"].round(1).astype(str)
                    subset["Category"] = subset["pm25"].apply(get_cat)
                    
                    table_data = subset[["Date", "Time", "Value", "Category"]].values.tolist()
                    col_labels = ["Date", "Time", "PM2.5", "Category"]
                    col_widths = [0.25, 0.15, 0.3, 0.3]

                # Draw Table
                tbl = ax_tbl.table(
                    cellText=table_data, 
                    colLabels=col_labels, 
                    colWidths=col_widths,
                    loc='center', 
                    cellLoc='center', 
                    bbox=[0.08, 0.05, 0.84, 0.75]
                )
                
                tbl.auto_set_font_size(False)
                tbl.set_fontsize(9)
                
                for (row, col), cell in tbl.get_celld().items():
                    cell.set_edgecolor('#E5E7EB')
                    cell.set_linewidth(0.5)
                    if row == 0:
                        cell.set_text_props(weight='bold', color='white')
                        cell.set_facecolor(COLOR_PRIMARY)
                        cell.set_height(0.035)
                    else:
                        cell.set_height(0.025)
                        if row % 2 == 0:
                            cell.set_facecolor('white')
                        else:
                            cell.set_facecolor('#F9FAFB')

                pdf.savefig(fig2)
                plt.close()

        buffer.seek(0)
        return buffer.getvalue()

    except Exception as e:
        print(f"❌ PDF ERROR: {str(e)}")
        raise e