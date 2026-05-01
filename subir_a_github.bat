@echo off

REM Script para automatizar el proceso de subir cambios a GitHub

REM Agregar todos los cambios al área de preparación
git add .

REM Crear un commit con un mensaje predeterminado
echo Ingrese el mensaje del commit:
set /p commitMessage=
git commit -m "%commitMessage%"

REM Subir los cambios al repositorio remoto
git push

echo Cambios subidos exitosamente a GitHub.