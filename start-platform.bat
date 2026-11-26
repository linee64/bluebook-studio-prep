@echo off
cd /d "%~dp0"
echo Starting Bluebook Studio (SAT Verbal Practice)...
start "" http://localhost:5173
npm run dev -- --port 5173

