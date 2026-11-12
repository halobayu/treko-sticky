# Treko Sticky (Tauri, view only, tanpa always-on-top)

Sticky note untuk satu artist Treko. Jendela biasa (bukan overlay di atas
aplikasi lain), hanya menampilkan, tidak bisa mengubah apa pun.

## Batasan yang dijaga (keputusan 3 Nov 2026)

- Hanya nama dan task artist itu sendiri. Tidak ada artist lain, tidak ada
  statistik tim, tidak ada leaderboard.
- Tidak ada tombol lead (Archive/Rename) di app ini.
- Tidak ada token bot Discord, password dashboard lead, atau API secret di
  dalam app ini. App hanya membaca `data.php?username=...` di cPanel.
- Refresh di app = ambil ulang data dari cPanel saja, BUKAN collect Discord.
  Collect tetap lewat cron 10:00/17:30/21:00 dan tombol UPDATE di dashboard
  lead, push ke cPanel otomatis setelah collect.
- Window: `alwaysOnTop: false` di `src-tauri/tauri.conf.json`, sesuai
  jawaban Bayu: PC semua Windows, tidak perlu terus di atas, cuma view saja.

## Isi proyek

- `src/` — frontend: `index.html`, `styles.css`, `main.js` (v10: dark
  theme sama seperti dashboard, header warna per nama, taskcard, bar
  hijau = progress, abu = sisa sampai target, label target kanan,
  flag Since/Age/Miss per task dari push, footer satu baris).
- `src-tauri/` — backend Rust Tauri v2 minimal, window 380x680, frameless
  (titlebar kustom bisa di-drag), resizable, tanpa always-on-top
  (tombol pin di titlebar untuk nyalakan sementara, default mati).
- `tools/export_artist.py` — helper parsing task (dipakai push_artist.py
  di InstaBox untuk membaca snapshot/history).
- `.github/workflows/build-windows.yml` — build Windows otomatis di GitHub
  Actions, tanpa perlu install Rust di PC kantor.

## Cara coba UI-nya sekarang (tanpa build)

Buka `src/index.html` di browser. Tanpa Data URL tersimpan, app
menampilkan layar setup (isi Data URL / username sekali saja).

## Cara dapat data (artist)

Lead DM-kan Data URL per artist (mis. `https://gambirstudio.com/treko/data.php?username=alyaltidak`),
artist tempel URL itu (atau username saja) di app sekali saja. App simpan
di localStorage perangkat itu, lalu fetch data live dari cPanel setiap buka
dan setiap klik refresh. Data selalu baru dari push otomatis setelah collect
(10:00/17:30/21:00). Tidak ada data artist yang terbundel di build ini.

## Cara dapat installer (artist)

Download dari halaman **Releases** repo ini (mis. v10.4): ada `.msi` dan
`.exe` (NSIS). Install seperti app biasa. Installer unsigned akan kena
peringatan SmartScreen Windows — klik "More info" lalu "Run anyway" untuk
installer internal Gambir. Data URL yang sudah tersimpan di perangkat
kemungkinan besar ikut terbawa saat update; kalau ternyata minta isi ulang,
tempel lagi URL yang sama.

## Cara build Windows .exe (2 jalur)

### Jalur A — GitHub Actions + Release (JALUR YANG DIPILIH, 12 Nov 2026)

1. Push ke branch `main` repo ini (atau push tag `v*`, mis. `v10.4`).
2. Workflow "Build Treko Sticky (Windows)" jalan otomatis di Actions.
3. Kalau push-nya tag `v*`, workflow otomatis membuat **Release** dengan
   installer `.msi` dan `.exe` terlampir — artist download dari sana.
   Push biasa ke `main` hanya menghasilkan artifact (tanpa Release).

### Jalur B — Build lokal di PC Windows (cadangan)

1. Install sekali saja di PC Windows itu:
   - Rust stable dari https://rustup.rs/ (64-bit, restart terminal setelah install)
   - Node.js 20 LTS dari https://nodejs.org/ (centang "Add to PATH")
   - Visual Studio Build Tools 2022, centang "Desktop development with C++"
     (wajib untuk Tauri Windows, tanpa ini cargo gagal link)
   - WebView2 Runtime: sudah bawaan Windows 10/11.
2. Extract zip proyek ini ke folder, misal `C:\treko-sticky\`.
3. Data artist untuk tes pertama: salin hasil export ke `src/artist.json`,
2. Extract zip proyek ini ke folder, misal `C:\treko-sticky\`.
3. Jalankan `build.bat` (klik dua kali, atau klik kanan > Run as administrator).
   Script ini cek cargo/node/npm, lalu `npm install`, lalu `npm run build`.
4. Installer ada di `src-tauri\target\release\bundle\` (folder `.msi` dan
   `.nsis`), dan script otomatis membuka folder itu di Explorer.
5. Catatan: `src-tauri/icons/icon.ico` sudah dibuat dari logo Treko di
   proyek ini, jadi tidak perlu lagi menjalankan `npx tauri icon` sebelum
   build pertama. Kalau mau ganti logo, jalankan itu lagi.
6. Installer unsigned akan kena peringatan SmartScreen — klik "More info"
   lalu "Run anyway" untuk installer internal Gambir.

## Kenapa .exe tidak dibangun di VM Muse

VM Muse ini Linux, tanpa Rust dan tanpa toolchain Windows/WebView2.
Build Tauri Windows harus dari runner Windows (GitHub Actions) atau PC
Windows langsung, seperti di atas. Frontend-nya sudah diverifikasi di sini
dengan data demo dan data export (lihat tes di bawah).

## Tes yang sudah dilakukan di VM

- `python3 -m py_compile` / validasi JSON untuk `tauri.conf.json` dan
  `package.json`.
- `tools/export_artist.py` dites dengan snapshot contoh: NovanCN
  (Modelling Cafe props 100%/100%) menghasilkan `artist.json` 1 artist
  saja, tanpa data artist lain.
- Frontend `main.js` dites logikanya dengan data demo: Task 0/2 untuk
  Alya, bar 50% + gap 30% ke 80%, pill 09:28 per task.
