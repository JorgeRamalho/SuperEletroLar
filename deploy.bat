@echo off
echo ============================================
echo   Trampolim - Deploy Script
echo ============================================
echo.

echo [1/4] Instalando dependencias...
call npm run install:all
if errorlevel 1 goto error

echo.
echo [2/4] Build de producao (React)...
call npm run build
if errorlevel 1 goto error

echo.
echo [3/4] Iniciando servidor de producao...
echo.
echo   Site HTML:  http://localhost:4000
echo   React App:  http://localhost:4000/app
echo   API Health: http://localhost:4000/api/health
echo.
set NODE_ENV=production
node backend/server.js
goto end

:error
echo.
echo ERRO no deploy. Verifique os logs acima.
exit /b 1

:end
