# AetherFlow IQ - Local Development Bootstrapper with ngrok
Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "     BOOTSTRAPPING AETHERFLOW IQ MVP SYSTEM WITH NGROK   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verify MySQL and Initialize Database Schema
Write-Host "[1/4] Verifying database connection and seeding tables..." -ForegroundColor Green
& "backend/.venv/Scripts/python.exe" backend/setup_db.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "[-] Database initialization failed!" -ForegroundColor Red
    Write-Host "    Ensure MySQL is running locally on port 3306." -ForegroundColor Yellow
    exit 1
}

# 2. Boot FastAPI in a separate process
Write-Host "[2/4] Launching FastAPI backend server on port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

# 3. Build frontend and Boot React Preview Server in a separate process
Write-Host "[3/4] Building production frontend assets..." -ForegroundColor Green
cd frontend
npm run build
cd ..

Write-Host "[3/4] Launching Vite React production preview server on port 5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run preview"

# Wait a couple of seconds for Vite to spin up
Start-Sleep -Seconds 3

# 4. Launch ngrok on the frontend port (5173) in this console
Write-Host "[4/4] Starting ngrok tunnel on port 5173..." -ForegroundColor Green
Write-Host "----------------------------------------------------------" -ForegroundColor Yellow
Write-Host "Opening public ngrok tunnel. When it starts:" -ForegroundColor Yellow
Write-Host "1. Copy the public https://*.ngrok-free.app URL from the screen." -ForegroundColor Yellow
Write-Host "2. Open that URL in your browser." -ForegroundColor Yellow
Write-Host "3. Click 'Visit Site' on the ngrok interstitial warning page." -ForegroundColor Yellow
Write-Host "----------------------------------------------------------" -ForegroundColor Yellow

# Run ngrok
ngrok http 5173
