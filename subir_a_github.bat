@echo off

REM Script para automatizar el proceso de subir cambios a GitHub
REM Nota: Las carpetas "1.construcción", "2.especificación", "3.clarificación" y "4.plan"
REM están excluidas en .gitignore y NO serán sincronizadas con GitHub

git --version >nul 2>&1
if errorlevel 1 (
	echo Git no encontrado. Instalá Git y volvé a intentarlo.
	pause
	exit /b 1
)

for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURRENT_BRANCH=%%b"
if "%CURRENT_BRANCH%"=="" set "CURRENT_BRANCH=main"

echo Rama actual: %CURRENT_BRANCH%
set /p targetBranch=Ingresá la rama a pushear (enter para usar %CURRENT_BRANCH%):
if "%targetBranch%"=="" set "targetBranch=%CURRENT_BRANCH%"

echo Agregando cambios...
git add .

set "CHANGES="
for /f "delims=" %%c in ('git status --porcelain') do set "CHANGES=1"
if not defined CHANGES (
	echo No hay cambios para commitear.
	pause
	exit /b 0
)

echo Ingrese el mensaje del commit (enter para usar "Actualización"):
set /p commitMessage=
if "%commitMessage%"=="" set "commitMessage=Actualización"

git commit -m "%commitMessage%"
if errorlevel 1 (
	echo Commit falló o no hubo cambios que commitear.
	pause
	exit /b 1
)

echo Subiendo a origin/%targetBranch%...
git push origin %targetBranch%
if errorlevel 1 (
	echo Push falló. Verificá la conexión remota y permisos.
	pause
	exit /b 1
)

echo Cambios subidos exitosamente a GitHub.
pause
exit /b 0