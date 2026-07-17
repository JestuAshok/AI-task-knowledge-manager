# AetherFlow IQ - Local Development Bootstrapper
Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "          BOOTSTRAPPING AETHERFLOW IQ MVP SYSTEM          " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verify MySQL and Initialize Database Schema
Write-Host "[1/3] Verifying database connection and seeding tables..." -ForegroundColor Green
& "backend/.venv/Scripts/python.exe" backend/setup_db.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "[-] Database initialization failed!" -ForegroundColor Red
    Write-Host "    Ensure MySQL is running locally on port 3306." -ForegroundColor Yellow
    exit 1
}

# 2. Boot FastAPI in a separate process
Write-Host "[2/3] Launching FastAPI backend server on port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

# 3. Boot React in a separate process
Write-Host "[3/3] Launching Vite React frontend client on port 5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Services bootstrapped successfully!" -ForegroundColor Cyan
Write-Host "   - FastAPI Swagger UI: http://127.0.0.1:8000/docs" -ForegroundColor Gray
Write-Host "   - React Frontend:     http://127.0.0.1:5173" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan
