@echo off
REM Treko Sticky — build lokal Windows (jalur yang dipilih Bayu 3 Nov 2026).
REM Jalankan file ini di PC Windows dengan cara: klik kanan > Run as administrator
REM TIDAK wajib, tapi disarankan supaya installer bisa ditulis tanpa masalah izin.
REM Prasyarat (sekali saja, sebelum pertama kali build):
REM   1. Rust stable: https://rustup.rs/  (pilih 64-bit, restart terminal setelah install)
REM   2. Node.js 20 LTS: https://nodejs.org/  (centang "Add to PATH")
REM   3. WebView2 Runtime: sudah bawaan Windows 10/11. Kalau belum ada, install dari Microsoft.
REM   4. Visual Studio Build Tools (C++): Tauri Windows butuh ini.
REM      Cara paling ringan: install "Visual Studio Build Tools 2022" lalu centang
REM      "Desktop development with C++" di installer-nya. Tanpa ini, cargo akan gagal link.
echo === Treko Sticky: cek tool ===
where cargo >nul 2>&1 || (echo [GAGAL] cargo tidak ditemukan. Install Rust dulu dari https://rustup.rs/ lalu buka terminal baru. & pause & exit /b 1)
where node >nul 2>&1 || (echo [GAGAL] node tidak ditemukan. Install Node.js 20 dulu. & pause & exit /b 1)
where npm >nul 2>&1 || (echo [GAGAL] npm tidak ditemukan. Install Node.js 20 dulu. & pause & exit /b 1)
cargo --version
node --version
echo.
echo === Install dependency JS (sekali, atau kalau package.json berubah) ===
call npm install
if errorlevel 1 (echo [GAGAL] npm install gagal. & pause & exit /b 1)
echo.
echo === Build Tauri (Windows .msi + .exe NSIS) ===
echo Ini bisa makan beberapa menit di build pertama (download crate Rust).
call npm run build
if errorlevel 1 (echo [GAGAL] npm run build gagal. Lihat pesan error di atas, biasanya: Build Tools C++ belum terinstall, atau Rust belum di PATH. & pause & exit /b 1)
echo.
echo === SELESAI ===
echo Installer ada di: src-tauri\target\release\bundle\
dir src-tauri\target\release\bundle\msi
dir src-tauri\target\release\bundle\nsis
echo.
echo Buka folder itu dengan Explorer untuk install di PC artist.
start "" "src-tauri\target\release\bundle"
pause
