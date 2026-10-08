@echo off
REM varsity connect launcher, backend + frontend in two windows.
REM double-click this from the repo root. needs java 21, maven, node, mysql.

setlocal
cd /d "%~dp0"

where java >nul 2>nul
if errorlevel 1 (
  echo [varsity] java not found, install java 21 first.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo [varsity] node not found, install node 22 first.
  pause
  exit /b 1
)

if not exist "backend\target\varsity-connect-0.0.1-SNAPSHOT.jar" (
  echo [varsity] building backend, one moment...
  cd backend
  call mvn -o package -DskipTests -q
  if errorlevel 1 (
    echo [varsity] offline build failed, retrying online...
    call mvn package -DskipTests -q
  )
  cd /d "%~dp0"
)

if not exist "frontend\node_modules" (
  echo [varsity] installing frontend, one moment...
  cd frontend
  call npm install
  cd /d "%~dp0"
)

echo [varsity] starting backend on http://localhost:8080 ...
start "varsity-connect-backend" cmd /k "cd /d "%~dp0backend" && set SPRING_PROFILES_ACTIVE=dev && java -jar target\varsity-connect-0.0.1-SNAPSHOT.jar"

echo [varsity] starting frontend on http://localhost:5173 ...
start "varsity-connect-frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --port 5173"

echo.
echo backend health: http://localhost:8080/actuator/health
echo frontend:       http://localhost:5173
echo demo buyer:     demo@cput.ac.za / password123
echo demo seller:    marketdemo@cput.ac.za / password123
echo.
echo give the backend about a minute, then open the frontend.
endlocal
