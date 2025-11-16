@echo off
title BreatheBetter Backend
echo ---------------------------------------------
echo   Starting BreatheBetter FastAPI Backend...
echo ---------------------------------------------
echo.

REM Navigate to backend folder
cd /d C:\Projects\BreatheBetter\backend

REM Activate virtual environment
call venv\Scripts\activate

echo Virtual environment activated.
echo.

REM Start FastAPI server
uvicorn app.main:app --reload --port 8000

echo.
echo Backend stopped.
pause
