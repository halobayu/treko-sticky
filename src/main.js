// Treko Sticky v10.5 — single build untuk semua artist, view only.
// Dark theme sama seperti dashboard Treko (dark), flag Since/Day/Miss
// per task dari push (aturan hari tertutup yang sama seperti dashboard:
// miss baru valid setelah collect sore / hari lewat), footer disederhanakan
// jadi satu baris, ikon pin mono (bukan emoji warna).
// v10.4: tab "Hari ini" / "Minggu ini" — tab Hari ini = kartu utama
// seperti sebelumnya (tidak berubah), tab Minggu ini = rekap minggu
// kalender Senin–Jumat dari push. Tambahan v10.3: catatan hijau
// "Target naik X% → Y%" di kartu kalau target hari ini naik lalu
// tercapai (12 Nov 2026, Bayu) — badge kebanggaan artist.
// v10.4: emoji status di depan nama task (12 Nov 2026, Bayu): 🕐 pending,
// ⭐ progres melebihi target, 👍 selesai tepat waktu, ⚠️ masih jalan tapi
// sudah miss. Tanpa emoji = masih jalan, belum selesai dan belum miss.
// v10.5: tombol "Cek Update" (↓) di titlebar — update langsung tanpa
// signing key (keputusan Bayu 12 Nov 2026, "tool simple gini").
// App cek GitHub Releases terbaru (api.github.com), kalau ada versi baru
// download installer .exe (NSIS) ke cache, jalankan, lalu tutup app.
// TIDAK ada verifikasi signature (tanpa signing key) — update hanya dari
// repo publik halobayu/treko-sticky; installer tetap unsigned jadi
// SmartScreen Windows akan muncul seperti install manual.
// Pindah tab tidak fetch ulang: datanya sudah ikut di payload.
// Cara pakai baru (usulan Bayu 3 Nov 12:38 WIB, menggantikan 1 zip per artist):
// lead DM-kan Data URL per artist, artist tempel URL itu di app sekali saja,
// app simpan URL itu di localStorage perangkat itu, lalu fetch data live dari
// cPanel (data.php, CORS + no-store) setiap buka dan setiap klik refresh.
// Input juga menerima username saja (mis. alyaltidak) — app akan melengkapi
// jadi https://gambirstudio.com/treko/data.php?username=<username>.
// TIDAK ada token bot, password lead, atau API secret di sini.
// TIDAK ada lagi data artist terbundel di build ini, dan TIDAK ada demo —
// kalau URL belum diisi atau fetch gagal, app menampilkan layar setup /
// pesan error, bukan data orang lain atau data palsu.
// Refresh = ambil ulang data remote, BUKAN collect Discord.
// Collect tetap di InstaBox 10:00/17:30, push ke cPanel setelah collect.
const DATA_BASE = "https://gambirstudio.com/treko/data.php?username=";
const URL_KEY = "treko_data_url";
const CACHE_KEY = "treko_last_data";
const RELEASES_API = "https://api.github.com/repos/halobayu/treko-sticky/releases/latest";
const RELEASES_PAGE = "https://github.com/halobayu/treko-sticky/releases";

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function normalizeUrl(input) {
  const v = String(input || "").trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[A-Za-z0-9_]{1,32}$/.test(v)) return DATA_BASE + v;
  return null;
}

function getStoredUrl() {
  try { return localStorage.getItem(URL_KEY) || ""; } catch (e) { return ""; }
}

function showSetup(prefill) {
  const setup = document.getElementById("setup-view");
  const cardView = document.getElementById("card-view");
  const input = document.getElementById("input-url");
  const err = document.getElementById("setup-error");
  const cancel = document.getElementById("btn-cancel-setup");
  setup.hidden = false;
  cardView.hidden = true;
  document.getElementById("tabs").hidden = true;
  document.getElementById("week-view").hidden = true;
  document.getElementById("foot").hidden = true;
  err.hidden = true;
  err.textContent = "";
  input.value = prefill != null ? prefill : getStoredUrl();
  // Tombol kembali hanya kalau sudah ada data tersimpan / pernah tampil.
  cancel.hidden = !getStoredUrl();
  setTimeout(() => { try { input.focus(); input.select(); } catch (e) {} }, 0);
}

function showCard() {
  document.getElementById("setup-view").hidden = true;
  document.getElementById("card-view").hidden = false;
  document.getElementById("tabs").hidden = false;
  document.getElementById("foot").hidden = false;
  switchTab("today");
}

// Pindah tab: hanya ganti tampilan, tidak fetch ulang. Tab default
// selalu Hari ini setiap app dibuka / data dimuat ulang.
function switchTab(tab) {
  const isWeek = tab === "week";
  document.getElementById("card-view").hidden = isWeek;
  document.getElementById("week-view").hidden = !isWeek;
  const tToday = document.getElementById("tab-today");
  const tWeek = document.getElementById("tab-week");
  tToday.classList.toggle("active", !isWeek);
  tWeek.classList.toggle("active", isWeek);
  tToday.setAttribute("aria-selected", String(!isWeek));
  tWeek.setAttribute("aria-selected", String(isWeek));
}

// Status emoji per task (12 Nov 2026, Bayu):
// 🕐 pending, ⭐ progres melebihi target, 👍 selesai tepat waktu
// (progres = target), ⚠️ masih jalan tapi sudah miss. Tanpa emoji =
// masih jalan, belum selesai dan belum miss. Pending paling utama,
// lalu selesai (⭐/👍), baru miss — task yang sudah selesai hari ini
// tidak lagi ⚠️ walau sempat miss kemarin (miss-nya tetap tampil di
// flagline Since/Age/Miss).
function statusEmoji(t) {
  if (t.pending) return "🕐";
  if (t.progress != null && t.target != null && t.progress > t.target) return "⭐";
  if (t.progress != null && t.target != null && t.progress >= t.target) return "👍";
  if (t.miss) return "⚠️";
  return "";
}

function render(data) {
  const head = document.getElementById("acard-head");
  const nameEl = document.getElementById("artist-name");
  const countEl = document.getElementById("task-count");
  const body = document.getElementById("acard-body");
  const foot = document.getElementById("foot");
  head.style.background = data.header_color || "#EAB308";
  nameEl.textContent = data.artist || data.username || "—";
  const tasks = data.tasks || [];
  const done = tasks.filter(t => t.target != null && t.progress != null && t.progress >= t.target).length;
  countEl.textContent = `Task ${done}/${tasks.length}`;
  if (!tasks.length) {
    body.innerHTML = `<p class="meta">Belum ada task hari ini.</p>`;
  } else {
    const pill = data.reported_at
      ? `<div class="tstamp-pill"><span>◷</span><span>${esc(data.reported_at)}</span></div>`
      : "";
    body.innerHTML = tasks.map(t => {
      const prog = t.progress ?? 0;
      const targ = t.target;
      let bar = "";
      if (targ != null) {
        const gap = prog < targ ? Math.min(targ, 100) - prog : 0;
        bar = `<div class="barrow"><div class="bar"><div class="bar-prog" style="width:${Math.min(prog, 100)}%"></div><div class="bar-gap" style="left:${Math.min(prog, 100)}%;width:${gap}%"></div></div><span class="targetpct">${targ}%</span></div>`;
      } else {
        bar = `<div class="barrow"><div class="bar"><div class="bar-prog" style="width:${Math.min(prog, 100)}%"></div></div></div>`;
      }
      const flag = (t.since && t.age)
        ? `<p class="flagline"><span>Since : ${esc(t.since)}</span><span>${t.age} Day</span>${t.miss ? `<span class="miss">Miss ${t.miss} Day</span>` : ""}</p>`
        : "";
      const pend = t.pending ? `<p class="pendingline">PENDING${t.pending_note ? ` • ${esc(t.pending_note)}` : ""}</p>` : "";
      const raise = t.raise ? `<p class="raiseline">${esc(t.raise)}</p>` : "";
      const emo = statusEmoji(t);
      return `${pill}<div class="taskcard"><p class="tname">${emo ? emo + " " : ""}${esc(t.name)}</p>${pend}${raise}<div class="tprog">${prog}%</div>${bar}${flag}</div>`;
    }).join("");
  }
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const src = data._source || "live";
  const srcLabel = { live: "live", cache: "cache" }[src] || src;
  foot.textContent = `Terakhir update: ${data.collected_at || "—"} • Sumber: ${srcLabel} • Reload terakhir: ${hhmm}`;
  renderWeek(data);
}

function weekLine(t, cls) {
  const pct = t.progress == null
    ? "(belum mulai)"
    : `${t.progress}%${t.target != null ? ` / ${t.target}%` : ""}`;
  const miss = (cls === "ongoing" && t.miss) ? ` • <span class="wmiss">miss ${t.miss} hari</span>` : "";
  const note = t.note ? ` (${esc(t.note)})` : "";
  // Untuk Masih jalan, end = hari terakhir dilapor: tampilkan sebagai
  // "mulai X, terakhir Y" kalau rentangnya lebih dari satu hari.
  let dates = "";
  if (t.start) {
    if (cls === "ongoing" && t.end && t.end !== t.start) {
      dates = ` • <span class="wdate">mulai ${esc(t.start)}, terakhir ${esc(t.end)}</span>`;
    } else {
      dates = ` • <span class="wdate">${esc(t.start)}${t.end && t.end !== t.start ? `–${esc(t.end)}` : ""}</span>`;
    }
  }
  return `<p class="wline ${cls}">${esc(t.name)} ${pct}${note}${dates}${miss}</p>`;
}

function renderWeek(data) {
  const head = document.getElementById("wcard-head");
  const countEl = document.getElementById("week-count");
  const body = document.getElementById("week-body");
  head.style.background = data.header_color || "#EAB308";
  const w = data.weekly;
  if (!w) {
    countEl.textContent = "Selesai 0/0";
    body.innerHTML = `<p class="meta">Data minggu ini belum tersedia, klik ↻ untuk muat ulang.</p>`;
    return;
  }
  const done = w.done || [];
  const ongoing = w.ongoing || [];
  const pending = w.pending || [];
  const total = done.length + ongoing.length + pending.length;
  countEl.textContent = `Selesai ${done.length}/${total}`;
  let html = w.label ? `<p class="meta">${esc(w.label)}</p>` : "";
  if (done.length) {
    html += `<div class="wgroup"><p class="wlabel">Selesai</p>${done.map(t => weekLine(t, "ok")).join("")}</div>`;
  }
  if (ongoing.length) {
    html += `<div class="wgroup"><p class="wlabel">Masih jalan</p>${ongoing.map(t => weekLine(t, "ongoing")).join("")}</div>`;
  }
  if (pending.length) {
    html += `<div class="wgroup"><p class="wlabel">Pending</p>${pending.map(t => weekLine(t, "warn")).join("")}</div>`;
  }
  if (!total) {
    html += `<p class="meta">Belum ada tugas minggu ini.</p>`;
  }
  body.innerHTML = html;
}

// ---- Auto-update (v10.5, tanpa signing key) ----
// Alur: cek GitHub Releases terbaru → bandingkan versi → kalau ada yang
// baru, download installer .exe (NSIS) ke cache app → jalankan → tutup app.
// Installer unsigned: SmartScreen Windows muncul seperti install manual.
// Kalau API plugin Tauri tidak tersedia (mode web / build lama), fallback:
// buka halaman Releases di browser supaya artist download manual.
// Versi app dibaca dari Tauri (tauri.conf.json); tag GitHub "v10.6"
// dinormalisasi jadi "10.6" lalu dibandingkan sebagai semver.
function cmpVer(a, b) {
  const pa = String(a || "0").split(".").map(n => parseInt(n, 10) || 0);
  const pb = String(b || "0").split(".").map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

function setUpdateStatus(msg) {
  const foot = document.getElementById("foot");
  if (foot) foot.textContent = msg;
}

async function getCurrentVersion() {
  try {
    const app = window.__TAURI__ && window.__TAURI__.app;
    if (app && app.getVersion) return await app.getVersion();
  } catch (e) {}
  return "0.1.0";
}

async function checkForUpdate() {
  const btn = document.getElementById("btn-update");
  btn.disabled = true;
  btn.classList.add("spinning");
  setUpdateStatus("Mengecek update…");
  try {
    const current = await getCurrentVersion();
    const res = await fetch(RELEASES_API, { cache: "no-store" });
    if (!res.ok) throw new Error("GitHub tidak ok: " + res.status);
    const rel = await res.json();
    const latestTag = String(rel.tag_name || "");
    const latest = latestTag.replace(/^v/i, "");
    if (!latest || cmpVer(latest, current) <= 0) {
      setUpdateStatus(`Sudah versi terbaru (v${current})`);
      return;
    }
    // Cari installer NSIS .exe di asset release terbaru.
    const exe = (rel.assets || []).find(a => /\.exe$/i.test(a.name || ""));
    if (!exe || !exe.browser_download_url) throw new Error("installer .exe tidak ditemukan di release");
    setUpdateStatus(`Update v${latest} ditemukan, mengunduh…`);
    // Download installer sebagai bytes.
    const dl = await fetch(exe.browser_download_url, { cache: "no-store" });
    if (!dl.ok) throw new Error("download gagal: " + dl.status);
    const buf = new Uint8Array(await dl.arrayBuffer());
    // Tulis ke cache app, lalu jalankan. Butuh plugin fs + opener + process.
    const T = window.__TAURI__;
    if (!T || !T.fs || !T.opener || !T.path) throw new Error("plugin update tidak tersedia di build ini");
    const cacheDir = await T.path.appCacheDir();
    const fname = exe.name || `treko-sticky-${latest}-setup.exe`;
    const fullPath = await T.path.join(cacheDir, fname);
    // writeFile: path absolut + bytes. baseDir tidak perlu kalau path absolut.
    if (T.fs.writeFile) {
      await T.fs.writeFile(fullPath, buf);
    } else if (T.fs.write) {
      await T.fs.write(fullPath, buf);
    } else {
      throw new Error("fs.writeFile tidak tersedia");
    }
    setUpdateStatus(`Menginstal v${latest}… app akan tertutup.`);
    // Jalankan installer, beri jeda supaya proses sempat jalan, lalu tutup app.
    await T.opener.open(fullPath);
    setTimeout(async () => {
      try {
        if (T.process && T.process.exit) await T.process.exit(0);
        const w = T.window;
        if (w && w.getCurrentWindow) await w.getCurrentWindow().close();
        else window.close();
      } catch (e) {}
    }, 1200);
  } catch (e) {
    // Gagal apa pun: jangan diam — beri tahu artist + arahkan ke Releases.
    setUpdateStatus(`Update gagal (${e && e.message ? e.message : e}). Download manual: ${RELEASES_PAGE}`);
    try {
      const T = window.__TAURI__;
      if (T && T.opener && T.opener.open) await T.opener.open(RELEASES_PAGE);
      else window.open(RELEASES_PAGE, "_blank");
    } catch (e2) {}
  } finally {
    btn.disabled = false;
    btn.classList.remove("spinning");
  }
}

async function load() {
  const btn = document.getElementById("btn-refresh");
  const foot = document.getElementById("foot");
  const url = getStoredUrl();
  if (!url) { showSetup(""); return; }
  showCard();
  btn.disabled = true;
  btn.classList.add("spinning");
  if (foot) foot.textContent = "Memuat ulang…";
  try {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("remote tidak ok: " + res.status);
      const data = await res.json();
      if (!data || !Array.isArray(data.tasks)) throw new Error("remote tidak valid");
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) {}
      render({ ...data, _source: "live" });
      return;
    } catch (e) { /* jatuh ke cache di bawah */ }
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        if (data && Array.isArray(data.tasks)) { render({ ...data, _source: "cache" }); return; }
      }
    } catch (e) {}
    // Gagal total: tampilkan pesan error, JANGAN demo / data orang lain.
    const body = document.getElementById("acard-body");
    body.innerHTML = `<p class="meta">Data tidak bisa dimuat. Klik ↻ lagi atau ⚙ untuk ganti URL.</p>`;
    if (foot) foot.textContent = "Data gagal dimuat";
  } finally {
    btn.disabled = false;
    btn.classList.remove("spinning");
  }
}

document.getElementById("btn-refresh").addEventListener("click", load);
document.getElementById("btn-update").addEventListener("click", checkForUpdate);
document.getElementById("tab-today").addEventListener("click", () => switchTab("today"));
document.getElementById("tab-week").addEventListener("click", () => switchTab("week"));
document.getElementById("btn-settings").addEventListener("click", () => showSetup());
document.getElementById("btn-save-url").addEventListener("click", () => {
  const input = document.getElementById("input-url");
  const err = document.getElementById("setup-error");
  const url = normalizeUrl(input.value);
  if (!url) {
    err.textContent = "URL / username tidak valid.";
    err.hidden = false;
    return;
  }
  try { localStorage.setItem(URL_KEY, url); } catch (e) {}
  err.hidden = true;
  load();
});
document.getElementById("input-url").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("btn-save-url").click();
});
document.getElementById("btn-cancel-setup").addEventListener("click", () => {
  showCard();
  load();
});
// v10.1: tombol minimize (—) di titlebar, di antara pin dan ×.
// Izinnya sudah ada di capabilities (core:window:allow-minimize), jadi
// tidak perlu ubah Rust/capabilities. Di mode web (bukan Tauri) tombol
// ini tidak melakukan apa-apa, tidak menutup app.
document.getElementById("btn-minimize").addEventListener("click", async () => {
  try {
    const w = window.__TAURI__ && window.__TAURI__.window;
    if (w && w.getCurrentWindow) { await w.getCurrentWindow().minimize(); return; }
    if (w && w.getCurrent) { await w.getCurrent().minimize(); return; }
    if (w && w.appWindow) { await w.appWindow.minimize(); return; }
  } catch (e) { /* mode web: abaikan */ }
});

document.getElementById("btn-close").addEventListener("click", async () => {
  // v9.3: tray DIBATALKAN, × = tutup app seperti biasa (v8).
  try {
    const w = window.__TAURI__ && window.__TAURI__.window;
    if (w && w.getCurrentWindow) { await w.getCurrentWindow().close(); return; }
    if (w && w.getCurrent) { await w.getCurrent().close(); return; }
    if (w && w.appWindow) { await w.appWindow.close(); return; }
    window.close();
  } catch (e) { /* mode web: abaikan */ }
});

// v10: tombol pin (ikon SVG mono, bukan emoji warna) = toggle
// always-on-top, default MATI (sesuai keputusan awal: Sticky itu view
// biasa, bukan overlay). Kalau nyala, tombol jadi highlighted dan
// title-nya berubah, klik lagi untuk mati.
let alwaysOnTop = false;
document.getElementById("btn-pin").addEventListener("click", async () => {
  const btn = document.getElementById("btn-pin");
  alwaysOnTop = !alwaysOnTop;
  try {
    const w = window.__TAURI__ && window.__TAURI__.window;
    if (w && w.getCurrentWindow) { await w.getCurrentWindow().setAlwaysOnTop(alwaysOnTop); }
    else if (w && w.getCurrent) { await w.getCurrent().setAlwaysOnTop(alwaysOnTop); }
    else if (w && w.appWindow) { await w.appWindow.setAlwaysOnTop(alwaysOnTop); }
  } catch (e) { alwaysOnTop = !alwaysOnTop; /* gagal, kembalikan state */ return; }
  btn.classList.toggle("active", alwaysOnTop);
  btn.setAttribute("aria-pressed", String(alwaysOnTop));
  btn.title = alwaysOnTop ? "Selalu di atas: nyala (klik untuk matikan)" : "Selalu di atas: mati (klik untuk nyalakan)";
});
load();
