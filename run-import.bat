@echo off
cd /d C:\Users\sdcot\funeraria-system
echo Starting at %date% %time% > import-output.txt
"C:\Program Files\nodejs\node.exe" --max-old-space-size=2048 import-neon.js >> import-output.txt 2>&1
echo Finished at %date% %time% >> import-output.txt
