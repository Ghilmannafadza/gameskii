@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js belum terpasang. Unduh di https://nodejs.org lalu jalankan file ini lagi. & pause & exit /b 1)
if not exist node_modules (echo Memasang dependensi... & call npm install || (pause & exit /b 1))
start "" http://localhost:3000
call npm run dev
pause
