@echo off
setlocal

set "PROJECT_REF=koslfxkbmcnbgtcyshmh"

if "%~1"=="" goto :usage
if "%~2"=="" goto :usage

set "TURSO_DATABASE_URL=%~1"
set "TURSO_AUTH_TOKEN=%~2"

where npx.cmd >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] npx.cmd est introuvable. Verifie que Node.js est bien installe.
  exit /b 1
)

echo.
echo [1/3] Connexion Supabase CLI...
call npx.cmd supabase login
if errorlevel 1 (
  echo [ERREUR] La connexion Supabase a echoue.
  exit /b 1
)

echo.
echo [2/3] Enregistrement des secrets Turso sur le projet Supabase...
call npx.cmd supabase secrets set TURSO_DATABASE_URL=%TURSO_DATABASE_URL% TURSO_AUTH_TOKEN=%TURSO_AUTH_TOKEN% --project-ref %PROJECT_REF%
if errorlevel 1 (
  echo [ERREUR] Impossible d'enregistrer les secrets Turso.
  exit /b 1
)

echo.
echo [3/3] Deploiement de la fonction turso-cdc...
call npx.cmd supabase functions deploy turso-cdc --project-ref %PROJECT_REF%
if errorlevel 1 (
  echo [ERREUR] Le deploiement de la fonction a echoue.
  exit /b 1
)

echo.
echo [OK] Turso CDC est configure sur Supabase.
echo [OK] Tu peux maintenant ouvrir le portail et tester un enregistrement CDC.
exit /b 0

:usage
echo Usage:
echo   deploy-turso-cdc.cmd "libsql://ta-base.turso.io" "ton_token_turso"
echo.
echo Exemple:
echo   deploy-turso-cdc.cmd "libsql://outils-game-design-zcinez.aws-eu-west-1.turso.io" "NOUVEAU_TOKEN"
exit /b 1
