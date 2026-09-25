@echo off
chcp 65001 >nul
echo ========================================================
echo   ระบบ CSI BME PTP + Activity ^& Coaching Dashboard
echo ========================================================
echo.

if not exist node_modules (
    echo [1/2] กำลังติดตั้ง Dependencies (สำหรับการเปิดใช้งานครั้งแรก)...
    call npm install
    if errorlevel 1 (
        echo [ERROR] ติดตั้ง dependencies ไม่สำเร็จ กรุณาติดตั้ง Node.js
        pause
        exit /b 1
    )
)

echo [2/2] กำลังเริ่มรันเซิร์ฟเวอร์...
echo เปิดเบราว์เซอร์ไปที่: http://localhost:3000
echo.
call npm run dev
pause
