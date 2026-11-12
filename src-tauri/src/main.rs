// Treko Sticky — Tauri v2, view only.
// Sengaja TANPA always-on-top permanen: window ini jendela biasa,
// bukan overlay di atas Photoshop/Blender. Always-on-top hanya lewat
// tombol pin 📌 di titlebar (v9.3), bisa dinyalakan/dimatikan kapan saja.
// Tray DIBATALKAN 3 Nov 2026 (keputusan Bayu): tidak ada tray icon,
// tidak ada menu tray, tombol × menutup app seperti biasa (v8).
// Tidak ada backend yang memanggil Discord, tidak ada token di sini.
// Data dibaca frontend dari cPanel (data.php) lewat Data URL yang
// dimasukkan artist, atau dari cache terakhir.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
