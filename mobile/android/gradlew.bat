@echo off
setlocal
set "APP_DIR=%~dp0"
if not exist "%APP_DIR%gradle\wrapper\gradle-wrapper.jar" (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%APP_DIR%..\scripts\bootstrap-gradle.ps1"
    if errorlevel 1 exit /b 1
)
set "JAVA_EXE=java.exe"
if defined JAVA_HOME set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
"%JAVA_EXE%" -classpath "%APP_DIR%gradle\wrapper\gradle-wrapper.jar" org.gradle.wrapper.GradleWrapperMain %*
exit /b %ERRORLEVEL%
