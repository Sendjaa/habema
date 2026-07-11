@echo off
:: HABEMA Setup (Windows)
:: Auto-install + buat .env.local

:: Cek apakah udah di-extract
if exist "project\package.json" (
    cd /d project
    goto run_setup
)

:: Extract ZIP (jika dijalankan dari ZIP)
echo [INFO] Mengekstrak file...
powershell -command "$shell = New-Object -ComObject Shell.Application; $zip = $shell.NameSpace('%~dp0'); $dest = $shell.NameSpace('%~dp0project'); $zip.Items() | %% { $dest.CopyHere($_, 0x10) }" >nul 2>&1
timeout /t 3 >nul

if not exist "project\package.json" (
    echo [ERROR] Gagal mengekstrak. Extract manual dulu.
    pause
    exit /b 1
)

:run_setup
cd /d project
cls
echo ============================================
echo HABEMA Setup
echo ============================================
echo.

:: Cek Node.js
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Node.js belum terinstall!
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

:: Install dependencies
echo [1/3] Menginstall dependencies...
npm install
if %errorLevel% neq 0 (
    echo [ERROR] Install gagal!
    pause
    exit /b 1
)

:: Buat .env.local dari template
if not exist ".env.local" (
    if exist ".env.local.example" (
        echo [2/3] Menyalin .env.local.example...
        copy .env.local.example .env.local >nul
        echo [INFO] File .env.local udah dibuat.
    )
)

echo.
echo [SUKSES] Setup selesai!
echo.
echo ============================================
echo PETUNJUK SELANJUTNYA:
echo ============================================
echo 1. Buka file .env.local di Notepad
echo 2. Isi 5 kunci API (dari Supabase & Midtrans)
echo 3. Jalankan: npm run dev
echo 4. Buka http://localhost:3000 di browser
echo.
echo Panduan lengkap: ..\SETUP_GUIDE_NON_IT.md
echo.
pause