@echo off
echo Installing requirements...
pip install pyinstaller Pillow psutil requests

echo.
echo Compiling StaffWatch Agent to EXE...
pyinstaller --noconsole --onefile --clean --name StaffWatchAgent --version-file version.txt agent.py

echo.
echo ========================================================
echo DONE! 
echo Your standalone executable is located at: 
echo e:\xampp new\htdocs\staffwatch\agent\dist\StaffWatchAgent.exe
echo ========================================================
pause
