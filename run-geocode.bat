@echo off
cd /d C:\Users\sdcot\funeraria-system
echo Starting geocode at %date% %time% > geocode-output.txt
"C:\Program Files\nodejs\node.exe" geocode-all.js >> geocode-output.txt 2>&1
echo Finished at %date% %time% >> geocode-output.txt
