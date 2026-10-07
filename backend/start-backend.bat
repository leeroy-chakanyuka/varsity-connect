@echo off
REM double-click to run the backend with a visible log window.
REM uses your local mysql (varsity_connect) and allows the lan frontend.
title varsity-connect backend
cd /d "%~dp0"
set CORS_ALLOWED_ORIGINS=http://localhost:5173,http://10.113.54.249:5173
java -jar target\varsity-connect-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev
pause
