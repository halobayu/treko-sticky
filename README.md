# Treko Sticky

Jendela kecil untuk satu artist Treko (Gambir Studio). Menampilkan task harian, progres, target, dan status — view only, tidak bisa mengubah apa pun.

- 🕐 Pending, ⭐ melebihi target, 👍 tepat waktu, ⚠️ miss
- Data diambil dari cPanel Treko, bukan dari Discord langsung
- Tidak ada token, password, atau data artist lain di app ini

## Cara pakai (artist)

1. Download installer (.msi atau .exe) dari [Releases](../../releases).
2. Install, buka app, tempel Data URL kamu sekali saja (dikasih lead).
3. Klik ↻ untuk refresh data.

## Build

Build Windows otomatis lewat GitHub Actions tiap push tag `v*` (lihat `.github/workflows/build-windows.yml`). Build lokal: jalankan `build.bat` di PC Windows (butuh Rust + Node.js).
