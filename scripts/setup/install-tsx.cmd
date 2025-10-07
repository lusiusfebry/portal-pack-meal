@echo off
setlocal enabledelayedexpansion

REM Bebang Pack Meal Portal — Install missing tsx devDependency (Windows CMD)
REM Run this script from repository root: c:\project-it\portal-pack-meal

echo [Task] Checking tsx existence in backend\node_modules\.bin
if exist "backend\node_modules\.bin\tsx.cmd" (
  echo [OK] tsx found at backend\node_modules\.bin\tsx.cmd
  goto verify
) else (
  echo [MISS] tsx not found. Installing as devDependency in backend workspace...
  npm i -D -w backend tsx
  if errorlevel 1 (
    echo [ERROR] npm install failed. Please check npm logs.
    exit /b 1
  )
)

:verify
echo [Task] Verifying tsx installation
npm exec -w backend tsx --version
if errorlevel 1 (
  echo [ERROR] tsx verification failed.
  exit /b 1
) else (
  echo [SUCCESS] tsx is installed and verified.
)

echo.
echo Next steps to run development server:
echo   1) Backend only: npm run -w backend start:dev
echo   2) Full monorepo (backend + frontend): npm run dev
echo.
echo Tip: If you see Node deprecation warnings, you can set:
echo   set NODE_OPTIONS=--no-deprecation ^&^& npm run dev
echo Or:
echo   set NODE_NO_WARNINGS=1 ^&^& npm run dev

endlocal
exit /b 0