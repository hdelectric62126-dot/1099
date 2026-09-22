@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py scripts\prepare_offline.py --zip
) else (
  python scripts\prepare_offline.py --zip
)
if errorlevel 1 (
  echo.
  echo Preparation failed. Read the message above.
  pause
  exit /b 1
)
echo.
echo Finished. The clean ZIP is one folder above this project.
pause
