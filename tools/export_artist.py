#!/usr/bin/env python3
"""Export satu artist dari snapshot Treko menjadi artist.json untuk Sticky.

Pakai (di mesin lead / InstaBox, BUKAN di PC artist):
  python3 export_artist.py snapshot.json cn_novan_cn artist.json

Output hanya berisi artist itu saja: nama, warna header, reported_at,
collected_at, dan task-tasknya (nama, progress, target, pending).
Tidak ada data artist lain, tidak ada statistik tim, tidak ada token,
tidak ada password. File artist.json inilah yang dibaca Tauri Sticky
(frontend fetch artist.json di folder yang sama).

Nama task di output pakai spasi (underscore diubah jadi spasi) untuk
tampilan, tapi pencocokan progress vs target dilakukan di sini dengan
normalisasi yang sama seperti collector (huruf kecil, _ -> spasi).
"""
import json
import re
import sys

HEADER_COLORS = {
    "alyaltidak": "#EAB308",
    "mojyamera": "#A9A9D1",
    "asiparahm": "#8FD0A8",
    "cn_novan_cn": "#7FB3D5",
}
PALETTE = ["#EAB308", "#A9A9D1", "#8FD0A8", "#7FB3D5", "#F4A261", "#F9A8D4", "#93C5FD", "#FDE68A", "#A7F3D0", "#FCA5A5", "#C4B5FD", "#FDBA74"]


def norm(name):
    return re.sub(r"\s+", " ", (name or "").lower().replace("_", " ")).strip()


def parse_task_list(text):
    """'Task 50%; Task2 20%' -> [(name, pct), ...]. Format sama dengan collector."""
    out = []
    for part in (text or "-").split(";"):
        part = part.strip()
        if not part or part == "-":
            continue
        m = re.match(r"^(.*?)\s*\(?\s*(\d+)\s*%\s*\)?\s*$", part)
        if m:
            out.append((m.group(1).strip(), int(m.group(2))))
    return out


def header_color(author):
    if author in HEADER_COLORS:
        return HEADER_COLORS[author]
    h = sum((i + 1) * ord(c) for i, c in enumerate(author or "?"))
    return PALETTE[h % len(PALETTE)]


def main():
    if len(sys.argv) != 4:
        print("Pakai: python3 export_artist.py snapshot.json <username> artist.json")
        return 2
    snap_path, author, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
    with open(snap_path, encoding="utf-8") as f:
        snap = json.load(f)
    row = None
    for r in snap.get("reported", []):
        if r.get("author") == author:
            row = r
            break
    if row is None:
        print(f"Artist {author} tidak ada di snapshot {snap_path} (belum lapor hari ini?).")
        return 1
    prog = dict((norm(n), (n, p)) for n, p in parse_task_list(row.get("progress", "-")))
    targ = dict((norm(n), (n, p)) for n, p in parse_task_list(row.get("target", "-")))
    pend = {}
    for part in (row.get("pending", "-") or "-").split(";"):
        part = part.strip()
        if not part or part == "-":
            continue
        m = re.match(r"^(.*?)\s+(\d+)\s*%\s*(?:\((.*)\))?\s*$", part)
        if m:
            pend[norm(m.group(1))] = (m.group(1).strip(), int(m.group(2)), m.group(3) or "")
    tasks = []
    for key in list(targ.keys()) + [k for k in prog.keys() if k not in targ]:
        pname, pval = prog.get(key, (targ.get(key, (key, None))[0], None))
        _, tval = targ.get(key, (pname, None))
        display = (pname or key).replace("_", " ")
        task = {"name": display, "progress": pval if pval is not None else 0, "target": tval}
        if key in pend:
            task["pending"] = True
            if pend[key][2]:
                task["pending_note"] = pend[key][2]
        tasks.append(task)
    reported_at = (row.get("reported_at_wib") or "").replace(" WIB", "").strip()
    out = {
        "artist": row.get("display_name") or author,
        "username": author,
        "header_color": header_color(author),
        "reported_at": reported_at,
        "collected_at": snap.get("collected_at_wib", ""),
        "tasks": tasks,
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"artist.json ditulis untuk {author}: {len(tasks)} task")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
