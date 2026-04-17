import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

axios.defaults.baseURL = "http://localhost:5000";

// ─── URL Builders (matching original pattern from doc) ───────────────────────
const profileImgUrl = (img) => img ? `http://localhost:5000/image/account/${img}` : null;
const bookCoverUrl = (img) => {
  if (!img) return null;

  const value = String(img).trim();
  if (!value) return null;

  if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:")) return value;
  if (value.startsWith("/")) return `http://localhost:5000${value}`;
  if (value.startsWith("image/")) return `http://localhost:5000/${value}`;

  return `http://localhost:5000/image/book/${encodeURI(value)}`;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PALETTE = [
  ["#0f172a", "#1e3a5f"], ["#134e4a", "#0d9488"],
  ["#3b0764", "#7c3aed"], ["#450a0a", "#dc2626"],
  ["#1c1917", "#78350f"], ["#0c1445", "#1d4ed8"],
  ["#14532d", "#16a34a"], ["#1e1b4b", "#4338ca"],
];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pc = (s = "") => PALETTE[(s.charCodeAt(0) || 65) % PALETTE.length];
const fl = (s = "") => s.trim()?.[0]?.toUpperCase() || "?";
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtShort = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—";
const dLeft = (d) => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null;
const dim = (y, m) => new Date(y, m + 1, 0).getDate();

function getMaskedMobile(mobile) {
  if (!mobile) return "—";
  const str = String(mobile).trim();
  if (str.length <= 5) return "•••••";
  return str.slice(0, -5) + "•••••";
}

function byMonth(dates = []) {
  const m = {};
  dates.forEach(r => {
    const d = new Date(r), k = `${d.getFullYear()}-${d.getMonth()}`;
    if (!m[k]) m[k] = { year: d.getFullYear(), month: d.getMonth(), days: new Set() };
    m[k].days.add(d.getDate());
  });
  return Object.values(m).sort((a, b) => b.year - a.year || b.month - a.month).slice(0, 3);
}

// Last N days for attendance dots (like AttendanceDisplay)
function lastNDays(n, attendanceDates = []) {
  const set = new Set(attendanceDates.map(d => new Date(d).toDateString()));
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return { d, present: set.has(d.toDateString()) };
  });
}

// ─── True infinite carousel via requestAnimationFrame ─────────────────────────
function InfiniteCarousel({ items, onSelect }) {
  const trackRef = useRef(null);
  const posRef = useRef(0);
  const rafRef = useRef(null);
  const paused = useRef(false);
  const unit = useRef(0);

  const tripled = [...items, ...items, ...items];

  useEffect(() => {
    if (!trackRef.current || !items.length) return;
    const track = trackRef.current;
    const init = () => {
      unit.current = track.scrollWidth / 3;
      posRef.current = unit.current;
      track.style.transform = `translateX(-${posRef.current}px)`;
      const step = () => {
        if (!paused.current) {
          posRef.current += 0.45;
          if (posRef.current >= unit.current * 2) posRef.current -= unit.current;
          track.style.transform = `translateX(-${posRef.current}px)`;
        }
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    };
    const tid = setTimeout(init, 80);
    return () => { clearTimeout(tid); cancelAnimationFrame(rafRef.current); };
  }, [items]);

  return (
    <div
      style={{ overflow: "hidden", position: "relative", padding: "2px 0 20px" }}
      onMouseEnter={() => paused.current = true}
      onMouseLeave={() => paused.current = false}
    >
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 48, zIndex: 2, pointerEvents: "none",
        background: "linear-gradient(to right,#f7f6f3,transparent)"
      }} />
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: 48, zIndex: 2, pointerEvents: "none",
        background: "linear-gradient(to left,#f7f6f3,transparent)"
      }} />
      <div ref={trackRef}
        style={{ display: "flex", gap: 12, padding: "0 20px", width: "max-content", willChange: "transform" }}
      >
        {tripled.map((book, i) => {
          const [t1, t2] = pc(book.title);
          const cover = bookCoverUrl(book.cover_image);
          return (
            <div key={`${book.book_id}-${i}`} className="udc-tile" onClick={() => onSelect(book)}>
              <div className="udc-tile-img" style={{ background: `linear-gradient(160deg,${t1},${t2})` }}>
                {cover
                  ? <img src={cover} alt={book.title} onError={e => { e.currentTarget.style.display = "none"; }} />
                  : <span className="udc-tile-ltr">{fl(book.title)}</span>
                }
                <span className={`udc-dot ${book.available_pieces > 0 ? "avail" : "out"}`} />
              </div>
              <div className="udc-tile-body">
                <div className="udc-tile-name">{book.title}</div>
                <div className="udc-tile-auth">{book.author}</div>
                {book.genre && <span className="udc-tile-genre">{book.genre}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

  :root {
    --ink: #111118;
    --ink2: #4a4a5a;
    --ink3: #9898a8;
    --paper: #f7f6f3;
    --card: #ffffff;
    --border: #e8e7e2;
    --border2: #f0efe9;
    --hero: #0f0f1a;
    --accent: #6366f1;
    --accent2: #818cf8;
    --green: #22c55e;
    --red: #ef4444;
    --amber: #f59e0b;
    --r: 16px;
    --r2: 12px;
  }

  .udc { font-family:'DM Sans',sans-serif; background:var(--paper); min-height:100vh; color:var(--ink); }

  /* ══ HERO — busts out of AppBar's padding:24px 20px ══ */
  .udc-hero {
    margin:-24px -20px 0;
    background: var(--hero);
    position:relative; overflow:hidden;
  }

  /* multi-layer atmospheric background */
  .udc-hero-bg {
    position:absolute; inset:0; pointer-events:none;
    background:
      radial-gradient(ellipse 70% 80% at 100% 0%, rgba(99,102,241,0.18) 0%, transparent 60%),
      radial-gradient(ellipse 50% 60% at 0% 100%, rgba(34,197,94,0.10) 0%, transparent 60%),
      radial-gradient(ellipse 40% 50% at 50% 50%, rgba(129,140,248,0.07) 0%, transparent 70%);
  }
  /* subtle dot grid */
  .udc-hero-grid {
    position:absolute; inset:0; pointer-events:none;
    background-image: radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px);
    background-size: 24px 24px;
  }

  .udc-hero-inner { position:relative; z-index:1; padding:32px 22px 28px; }

  /* ─ Profile row ─ */
  .udc-profile-row { display:flex; align-items:flex-start; gap:18px; margin-bottom:28px; }

  /* Passport-style photo — same concept as AttendanceDisplay's PassportPhoto */
  .udc-passport-wrap { position:relative; flex-shrink:0; }

  .udc-passport {
    width:72px; height:90px; /* 35:45 ratio */
    border-radius:14px; overflow:hidden;
    border:2px solid rgba(255,255,255,0.14);
    box-shadow:
      0 8px 32px rgba(0,0,0,0.5),
      0 0 0 1px rgba(255,255,255,0.06),
      inset 0 1px 0 rgba(255,255,255,0.1);
    display:flex; align-items:center; justify-content:center;
    font-family: 'Inter', sans-serif; ; font-size:28px; font-weight:800; color:#fff;
    cursor:default;
    transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease;
    position:relative;
  }
  .udc-passport:hover {
    transform:scale(1.07) rotate(-2deg);
    box-shadow:0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .udc-passport img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center top; display:block; }
  .udc-passport-ltr { position:relative; z-index:1; }

  /* online pulse */
  .udc-pulse {
    position:absolute; bottom:-3px; right:-3px;
    width:14px; height:14px; border-radius:50%;
    background:var(--green); border:2.5px solid var(--hero);
    animation:udcPulse 2.5s ease infinite;
  }
  @keyframes udcPulse {
    0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)}
    50%    {box-shadow:0 0 0 5px rgba(34,197,94,0)}
  }

  .udc-identity { padding-top:4px; }
  .udc-greeting { font-size:10px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:rgba(255,255,255,0.35); margin-bottom:5px; }
  .udc-name     { font-family: 'Inter', sans-serif; ; font-size:22px; font-weight:800; color:#fff; line-height:1.1; margin-bottom:5px; }
  .udc-sub      { font-size:12px; color:rgba(255,255,255,0.38); display:flex; align-items:center; gap:6px; }
  .udc-sub-sep  { width:3px; height:3px; border-radius:50%; background:rgba(255,255,255,0.2); }

  /* ─ Stat strip ─ */
  .udc-stats {
    display:grid; grid-template-columns:repeat(3,1fr);
    gap:1px; background:rgba(255,255,255,0.06);
    border-radius:var(--r2); overflow:hidden;
  }
  .udc-stat { background:rgba(255,255,255,0.03); padding:14px 10px; text-align:center; cursor:default; transition:background .15s; }
  .udc-stat:hover { background:rgba(255,255,255,0.06); }
  .udc-stat-n { font-family: 'Inter', sans-serif; ; font-size:22px; font-weight:700; color:#fff; line-height:1; }
  .udc-stat-n.warn   { color:#fbbf24; }
  .udc-stat-n.danger { color:#f87171; }
  .udc-stat-n.good   { color:#34d399; }
  .udc-stat-l { font-size:9px; font-weight:600; text-transform:uppercase; letter-spacing:.09em; color:rgba(255,255,255,0.28); margin-top:5px; }

  /* ══ BODY ══ */
  .udc-body { padding:20px 20px 56px; }

  /* Section head */
  .udc-sh { display:flex; align-items:center; justify-content:space-between; margin:24px 0 12px; }
  .udc-sh-t { font-family: 'Inter', sans-serif; ; font-size:14px; font-weight:700; color:var(--ink); }
  .udc-sh-b { font-size:11px; color:var(--ink3); }

  /* ── Fine card (sits in normal flow, NEVER overlaps hero) ── */
  .udc-fine {
    border-radius:var(--r); padding:16px 18px;
    display:flex; align-items:center; gap:14px;
    position:relative; overflow:hidden;
    box-shadow:0 4px 20px rgba(0,0,0,0.12);
  }
  .udc-fine.ok  { background:linear-gradient(135deg,#052e16 0%,#166534 100%); }
  .udc-fine.bad { background:linear-gradient(135deg,#450a0a 0%,#991b1b 100%); }
  .udc-fine::after {
    content:''; position:absolute; right:-30px; top:-30px;
    width:120px; height:120px; border-radius:50%;
    background:rgba(255,255,255,0.06); pointer-events:none;
  }
  .udc-fine-icon {
    width:44px; height:44px; border-radius:12px;
    background:rgba(255,255,255,0.15);
    display:flex; align-items:center; justify-content:center; flex-shrink:0; z-index:1;
  }
  .udc-fine-icon svg { width:22px; height:22px; color:#fff; }
  .udc-fine-text { z-index:1; }
  .udc-fine-label { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:.1em; color:rgba(255,255,255,0.55); margin-bottom:3px; }
  .udc-fine-val   { font-family: 'Inter', sans-serif; ; font-size:26px; font-weight:800; color:#fff; line-height:1; }

  /* ── 2×2 overview ── */
  .udc-ov { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .udc-ov-box {
    background:var(--card); border:1px solid var(--border);
    border-radius:var(--r); padding:16px;
    transition:box-shadow .2s,transform .2s;
  }
  .udc-ov-box:hover { box-shadow:0 6px 24px rgba(0,0,0,0.07); transform:translateY(-2px); }
  .udc-ov-ico { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center; margin-bottom:10px; }
  .udc-ov-ico svg { width:15px; height:15px; }
  .udc-ov-n { font-family: 'Inter', sans-serif; ; font-size:21px; font-weight:700; color:var(--ink); line-height:1; }
  .udc-ov-l { font-size:11px; color:var(--ink3); margin-top:3px; }

  .udc-mobile-container { cursor: help; }
  .udc-mobile-masked { display: inline; letter-spacing: 0.5px; }
  .udc-mobile-visible { display: none; }
  .udc-mobile-container:hover .udc-mobile-masked { display: none; }
  .udc-mobile-container:hover .udc-mobile-visible { display: inline; }

  /* ── Borrowed books ── */
  .udc-list { background:var(--card); border:1px solid var(--border); border-radius:var(--r); overflow:hidden; }

  @keyframes slideIn {
    from{opacity:0;transform:translateX(-14px)}
    to  {opacity:1;transform:translateX(0)}
  }

  .udc-brow {
    display:flex; align-items:center; gap:14px;
    padding:14px 16px; border-bottom:1px solid var(--border2);
    cursor:default; position:relative;
    transition:background .18s;
    animation:slideIn .3s cubic-bezier(.22,1,.36,1) both;
  }
  .udc-brow:last-child { border-bottom:none; }
  .udc-brow:hover { background:#fafaf8; }

  /* animated left accent */
  .udc-brow::before {
    content:''; position:absolute; left:0; top:10px; bottom:10px;
    width:3px; border-radius:0 3px 3px 0;
    background:linear-gradient(180deg,var(--accent),var(--accent2));
    transform:scaleY(0); transform-origin:center;
    transition:transform .22s cubic-bezier(.22,1,.36,1);
  }
  .udc-brow:hover::before { transform:scaleY(1); }
  .udc-brow:hover .udc-brow-cover { transform:scale(1.08) rotate(-2.5deg); box-shadow:5px 6px 20px rgba(0,0,0,.25); }
  .udc-brow:hover .udc-brow-title { color:var(--accent); }

  /* Book spine */
  .udc-brow-cover {
    width:44px; height:60px; border-radius:8px; flex-shrink:0; position:relative;
    display:flex; align-items:center; justify-content:center;
    font-family: 'Inter', sans-serif; ; font-size:18px; font-weight:800; color:#fff;
    box-shadow:3px 4px 12px rgba(0,0,0,.22); overflow:hidden;
    transition:transform .28s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease;
  }
  .udc-brow-cover img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
  .udc-brow-cover-ltr { position:relative; z-index:1; }

  .udc-brow-info { flex:1; min-width:0; }
  .udc-brow-title { font-size:13px; font-weight:600; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px; transition:color .18s; }
  .udc-brow-auth  { font-size:11px; color:var(--ink3); margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

  .udc-due { display:inline-flex; align-items:center; gap:3px; font-size:10px; font-weight:700; padding:2px 8px; border-radius:100px; }
  .udc-due svg  { width:9px; height:9px; }
  .udc-due.over { background:#fff1f2; color:#e11d48; border:1px solid #fecdd3; }
  .udc-due.soon { background:#fefce8; color:#ca8a04; border:1px solid #fef08a; }
  .udc-due.ok   { background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; }

  .udc-brow-fine { font-size:12px; font-weight:700; color:#e11d48; flex-shrink:0; }

  /* ══ ATTENDANCE — profile image style with hover (from AttendanceDisplay) ══ */
  .udc-attend { background:var(--card); border:1px solid var(--border); border-radius:var(--r); overflow:hidden; }

  /* Month section */
  .udc-at-month { padding:16px 18px 14px; border-bottom:1px solid var(--border2); }
  .udc-at-month:last-child { border-bottom:none; }
  .udc-at-month-name { font-size:10px; font-weight:700; color:var(--ink3); text-transform:uppercase; letter-spacing:.1em; margin-bottom:10px; }
  .udc-at-days { display:flex; flex-wrap:wrap; gap:5px; }

  /* Day cell — passport-like rounded square with hover transform */
  .udc-at-day {
    width:28px; height:28px; border-radius:7px;
    display:flex; align-items:center; justify-content:center;
    font-size:10px; font-weight:600; color:var(--ink3);
    background:var(--paper); cursor:default;
    transition:transform .15s cubic-bezier(.34,1.56,.64,1), background .15s, color .15s, box-shadow .15s;
  }
  .udc-at-day:hover { transform:scale(1.25); }
  .udc-at-day.p {
    background:var(--hero); color:#fff; font-weight:700;
    box-shadow:0 2px 8px rgba(15,15,26,0.35);
  }
  .udc-at-day.p:hover {
    background:var(--accent); box-shadow:0 4px 14px rgba(99,102,241,0.45);
  }
  .udc-at-day.t {
    outline:2px solid var(--accent); outline-offset:1px; color:var(--accent);
  }
  .udc-at-day.p.t { color:#fff; outline-color:rgba(255,255,255,.5); }

  /* Recent 14-day dot strip (like AttendanceDisplay AttendanceDots) */
  .udc-at-strip {
    padding:14px 18px 16px;
    border-top:1px solid var(--border2);
  }
  .udc-at-strip-label {
    font-size:10px; font-weight:600; color:var(--ink3);
    text-transform:uppercase; letter-spacing:.09em; margin-bottom:9px;
  }
  .udc-at-strip-dots { display:flex; gap:5px; }
  .udc-at-sdot {
    width:24px; height:24px; border-radius:6px;
    display:flex; align-items:center; justify-content:center;
    font-size:9px; font-weight:600;
    cursor:default;
    transition:transform .15s cubic-bezier(.34,1.56,.64,1);
  }
  .udc-at-sdot:hover { transform:scale(1.3); }
  .udc-at-sdot.p { background:var(--hero); color:#fff; box-shadow:0 2px 6px rgba(15,15,26,.3); }
  .udc-at-sdot.a { background:var(--paper); color:var(--ink3); }

  /* ══ Catalogue ══ */
  .udc-cat { background:var(--card); border:1px solid var(--border); border-radius:var(--r); overflow:hidden; padding-top:4px; }

  .udc-tile {
    width:150px; flex-shrink:0;
    background:#f5f5f2; border:1px solid var(--border);
    border-radius:12px; overflow:hidden; cursor:pointer;
    transition:transform .2s,box-shadow .2s,border-color .15s;
  }
  .udc-tile:hover { transform:translateY(-6px); box-shadow:0 14px 36px rgba(0,0,0,.12); border-color:#ccc; }

  .udc-tile-img {
    height:112px; position:relative;
    display:flex; align-items:center; justify-content:center;
    font-family: 'Inter', sans-serif; ; font-size:36px; font-weight:800; color:#fff; overflow:hidden;
  }
  .udc-tile-img img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
  .udc-tile-ltr { position:relative; z-index:1; }

  .udc-dot {
    position:absolute; top:7px; right:7px; z-index:2;
    width:8px; height:8px; border-radius:50%;
    border:1.5px solid rgba(255,255,255,.7);
  }
  .udc-dot.avail { background:#4ade80; }
  .udc-dot.out   { background:#f87171; }

  .udc-tile-body { padding:10px 12px 13px; }
  .udc-tile-name  { font-size:12px; font-weight:600; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .udc-tile-auth  { font-size:10px; color:var(--ink3); margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .udc-tile-genre { display:inline-block; margin-top:5px; font-size:9px; font-weight:700; padding:2px 7px; border-radius:100px; background:#ececec; color:#888; }

  /* ══ Book detail bottom sheet ══ */
  .udc-backdrop {
    position:fixed; inset:0;
    background:rgba(0,0,0,0.45); backdrop-filter:blur(6px);
    z-index:700; display:flex; align-items:flex-end; justify-content:center;
    animation:bdIn .2s ease;
  }
  @keyframes bdIn{from{opacity:0}to{opacity:1}}

  .udc-sheet {
    background:#fff; width:100%; max-width:480px;
    border-radius:22px 22px 0 0;
    max-height:90vh; overflow-y:auto;
    scrollbar-width:none; -ms-overflow-style:none;
    box-shadow:0 -14px 60px rgba(0,0,0,.2);
    animation:shIn .32s cubic-bezier(.22,1,.36,1);
  }
  .udc-sheet::-webkit-scrollbar{display:none}
  @keyframes shIn{from{transform:translateY(48px);opacity:0}to{transform:translateY(0);opacity:1}}

  .udc-sheet-pill{width:36px;height:4px;border-radius:2px;background:#ddd;margin:12px auto 0;}

  .udc-sheet-hero {
    height:200px; position:relative;
    display:flex; align-items:center; justify-content:center;
    font-family: 'Inter', sans-serif; ; font-size:72px; font-weight:800; color:#fff;
    overflow:hidden; margin:12px 16px 0; border-radius:14px;
  }
  .udc-sheet-hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}
  .udc-sheet-hero-ltr{position:relative;z-index:1;}

  .udc-sheet-x {
    position:absolute;top:10px;right:10px;z-index:3;
    width:30px;height:30px;border-radius:50%;
    background:rgba(0,0,0,.32);border:none;cursor:pointer;
    display:flex;align-items:center;justify-content:center;color:#fff;
    transition:background .15s;
  }
  .udc-sheet-x:hover{background:rgba(0,0,0,.55);}

  .udc-sheet-body{padding:18px 20px 40px;}
  .udc-sheet-title {font-family: 'Inter', sans-serif; ;font-size:22px;font-weight:800;color:#111;margin-bottom:3px;}
  .udc-sheet-author{font-size:13px;color:#888;margin-bottom:14px;}

  .udc-sheet-tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;}
  .udc-sheet-tag{font-size:11px;font-weight:700;padding:4px 11px;border-radius:100px;}
  .udc-sheet-tag.genre{background:#f0f0f0;color:#555;}
  .udc-sheet-tag.avail{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;}
  .udc-sheet-tag.none {background:#fff1f2;color:#e11d48;border:1px solid #fecdd3;}

  .udc-sheet-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:18px;}
  .udc-sheet-stat{background:#f7f7f7;border:1px solid #eee;border-radius:11px;padding:11px;text-align:center;}
  .udc-sheet-stat-n{font-family: 'Inter', sans-serif; ;font-size:20px;font-weight:700;color:#111;}
  .udc-sheet-stat-k{font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:.06em;margin-top:2px;}

  .udc-sheet-sub{font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#bbb;margin-bottom:9px;}
  .udc-sheet-brow{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:#f8f8f8;border:1px solid #eee;border-radius:10px;margin-bottom:7px;font-size:12px;}
  .udc-sheet-brow-r{font-weight:700;color:#111;}
  .udc-sheet-brow-d{font-size:11px;color:#aaa;}

  /* ── Utils ── */
  .udc-empty{padding:28px;text-align:center;color:#ccc;font-size:13px;}
  .udc-loader{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:14px;color:#aaa;font-size:14px;}
  .udc-spin{width:30px;height:30px;border:3px solid #e8e8e8;border-top-color:#0f0f1a;border-radius:50%;animation:spin .7s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}
`;

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ico = {
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  Alert: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  Book: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>,
  Lib: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>,
  Phone: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8 9a16 16 0 0 0 6 6l.36-.81a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
  Trend: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
  X: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
};

// ─── Due pill ─────────────────────────────────────────────────────────────────
function DuePill({ d }) {
  const n = dLeft(d);
  if (n === null) return null;
  if (n < 0) return <span className="udc-due over"><Ico.Clock /> {Math.abs(n)}d overdue</span>;
  if (n <= 3) return <span className="udc-due soon"><Ico.Clock /> Due in {n}d</span>;
  return <span className="udc-due ok"  ><Ico.Clock /> Due {fmtShort(d)}</span>;
}

// ─── Book detail sheet ────────────────────────────────────────────────────────
function BookSheet({ book, onClose }) {
  if (!book) return null;
  const [c1, c2] = pc(book.title || "");
  const cover = bookCoverUrl(book.cover_image);
  return (
    <div className="udc-backdrop" onClick={onClose}>
      <div className="udc-sheet" onClick={e => e.stopPropagation()}>
        <div className="udc-sheet-pill" />
        <div className="udc-sheet-hero" style={{ background: `linear-gradient(160deg,${c1},${c2})` }}>
          {cover
            ? <img src={cover} alt={book.title} onError={e => { e.currentTarget.style.display = "none"; }} />
            : <span className="udc-sheet-hero-ltr">{fl(book.title)}</span>
          }
          <button className="udc-sheet-x" onClick={onClose}><Ico.X /></button>
        </div>
        <div className="udc-sheet-body">
          <div className="udc-sheet-title">{book.title}</div>
          <div className="udc-sheet-author">by {book.author}</div>
          <div className="udc-sheet-tags">
            {book.genre && <span className="udc-sheet-tag genre">{book.genre}</span>}
            {book.available_pieces > 0
              ? <span className="udc-sheet-tag avail">{book.available_pieces} Available</span>
              : <span className="udc-sheet-tag none">Unavailable</span>}
          </div>
          <div className="udc-sheet-stats">
            {[["Total", book.total_pieces], ["Available", book.available_pieces], ["Borrowed", (book.borrowed_by || []).length]].map(([k, v]) => (
              <div key={k} className="udc-sheet-stat">
                <div className="udc-sheet-stat-n">{v ?? "—"}</div>
                <div className="udc-sheet-stat-k">{k}</div>
              </div>
            ))}
          </div>
          {(book.borrowed_by || []).length > 0 && <>
            <div className="udc-sheet-sub">Currently Borrowed By</div>
            {book.borrowed_by.map((b, i) => {
              const n = dLeft(b.due_date);
              return (
                <div key={i} className="udc-sheet-brow">
                  <span className="udc-sheet-brow-r">{b.roll_no}</span>
                  <span className="udc-sheet-brow-d" style={{ color: n < 0 ? "#e11d48" : n <= 3 ? "#ca8a04" : "#aaa" }}>
                    {n < 0 ? `${Math.abs(n)}d overdue` : `Due ${fmt(b.due_date)}`}
                  </span>
                </div>
              );
            })}
          </>}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const [account, setAccount] = useState(null);
  const [books, setBooks] = useState([]);
  const [bookMap, setBookMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const rollNo = sessionStorage.getItem("roll_no");

  useEffect(() => {
    if (!rollNo) { setError("No session found."); setLoading(false); return; }
    Promise.all([axios.get(`/account/${rollNo}`), axios.get("/book")])
      .then(([ar, br]) => {
        const acc = ar.data.account || ar.data;
        const bks = br.data.books || [];
        const map = {}; bks.forEach(b => { map[b.book_id] = b; });
        setAccount(acc); setBooks(bks); setBookMap(map);
      })
      .catch(e => setError(e?.response?.data?.message || "Failed to load."))
      .finally(() => setLoading(false));
  }, [rollNo]);

  if (loading) return <><style>{css}</style><div className="udc"><div className="udc-loader"><div className="udc-spin" />Loading your dashboard…</div></div></>;
  if (error || !account) return <><style>{css}</style><div className="udc"><div className="udc-loader">{error || "Account not found."}</div></div></>;

  const [c1, c2] = pc(account.name);
  const borrowed = account.borrowed_books || [];
  const attend = account.attendance || [];
  const fine = account.total_fine ?? 0;
  const calMos = byMonth(attend);
  const dots14 = lastNDays(14, attend);

  // Profile image URL — using same pattern as AttendanceDisplay PassportPhoto
  const profSrc = account.profile_image ? profileImgUrl(account.profile_image) : null;

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <style>{css}</style>
      <div className="udc">

        {/* ══ HERO — bleeds past AppBar padding ══ */}
        <div className="udc-hero">
          <div className="udc-hero-bg" />
          <div className="udc-hero-grid" />
          <div className="udc-hero-inner">

            {/* Profile */}
            <div className="udc-profile-row">
              <div className="udc-passport-wrap">
                {/* Passport-style photo (35:45 → 72:90px), same as AttendanceDisplay */}
                <div
                  className="udc-passport"
                  style={{ background: profSrc ? "#1a1a2e" : `linear-gradient(135deg,${c1},${c2})` }}
                >
                  {profSrc
                    ? <img src={profSrc} alt={account.name}
                      onError={e => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.closest(".udc-passport").style.background = `linear-gradient(135deg,${c1},${c2})`;
                      }} />
                    : <span className="udc-passport-ltr">{fl(account.name)}</span>
                  }
                </div>
                <span className="udc-pulse" />
              </div>
              <div className="udc-identity">
                <div className="udc-greeting">{greet}</div>
                <div className="udc-name">{account.name?.toUpperCase()}</div>
                <div className="udc-sub">
                  <span>{account.department}</span>
                  <span className="udc-sub-sep" />
                  <span>{account.roll_no}</span>
                </div>
              </div>
            </div>

            {/* Stat strip */}
            <div className="udc-stats">
              <div className="udc-stat">
                <div className={`udc-stat-n ${borrowed.length > 0 ? "warn" : "good"}`}>{borrowed.length}</div>
                <div className="udc-stat-l">Borrowed</div>
              </div>
              <div className="udc-stat">
                <div className="udc-stat-n">{attend.length}</div>
                <div className="udc-stat-l">Present</div>
              </div>
              <div className="udc-stat">
                <div className={`udc-stat-n ${fine > 0 ? "danger" : "good"}`}>₹{fine}</div>
                <div className="udc-stat-l">Fine</div>
              </div>
            </div>

          </div>
        </div>

        {/* ══ BODY — starts in normal flow, ZERO overlap possible ══ */}
        <div className="udc-body">

          {/* Fine card */}
          <div className={`udc-fine ${fine > 0 ? "bad" : "ok"}`}>
            <div className="udc-fine-icon">{fine > 0 ? <Ico.Alert /> : <Ico.Check />}</div>
            <div className="udc-fine-text">
              <div className="udc-fine-label">{fine > 0 ? "Outstanding Fine" : "Fine Status"}</div>
              <div className="udc-fine-val">{fine > 0 ? `₹${fine} due` : "All Clear ✓"}</div>
            </div>
          </div>

          {/* Overview */}
          <div className="udc-sh"><span className="udc-sh-t">Overview</span></div>
          <div className="udc-ov">
            {[
              { ico: <Ico.Trend />, bg: "#f0fdf4", ic: "#16a34a", v: account.no_of_days ?? 0, l: "Days Attended" },
              { ico: <Ico.Phone />, bg: "#fdf4ff", ic: "#9333ea", v: account.mobile, l: "Mobile", sm: true, mobile: true },
              { ico: <Ico.Lib />, bg: "#fffbeb", ic: "#d97706", v: books.length, l: "Library Books" },
              { ico: <Ico.Book />, bg: "#eff6ff", ic: "#2563eb", v: books.filter(b => b.available_pieces > 0).length, l: "Available Now" },
            ].map(({ ico, bg, ic, v, l, sm, mobile }) => (
              <div key={l} className="udc-ov-box">
                <div className="udc-ov-ico" style={{ background: bg }}>
                  <span style={{ color: ic, display: "flex" }}>{ico}</span>
                </div>
                <div className="udc-ov-n" style={sm ? { fontSize: 13, marginTop: 3 } : {}}>
                  {mobile && v ? (
                    <span className="udc-mobile-container" title="Hover to reveal full number">
                      <span className="udc-mobile-masked">{getMaskedMobile(v)}</span>
                      <span className="udc-mobile-visible">{v}</span>
                    </span>
                  ) : (
                    v || "—"
                  )}
                </div>
                <div className="udc-ov-l">{l}</div>
              </div>
            ))}
          </div>

          {/* Borrowed books — uses bookMap[book_id] to get title/author/genre/cover */}
          <div className="udc-sh">
            <span className="udc-sh-t">My Borrowed Books</span>
            <span className="udc-sh-b">{borrowed.length} book{borrowed.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="udc-list">
            {borrowed.length === 0
              ? <div className="udc-empty">No books currently borrowed.</div>
              : borrowed.map((bk, i) => {
                // Fetch full details from bookMap via book_id
                const full = bookMap[bk.book_id] || {};
                const title = full.title || bk.title || bk.book_id;
                const auth = full.author || bk.author || "";
                const cover = bookCoverUrl(full.cover_image || bk.cover_image);
                const [b1, b2] = pc(title);
                return (
                  <div key={bk.book_id || i} className="udc-brow" style={{ animationDelay: `${i * .08}s` }}>
                    <div className="udc-brow-cover" style={{ background: `linear-gradient(135deg,${b1},${b2})` }}>
                      {cover
                        ? <img src={cover} alt={title} onError={e => { e.currentTarget.style.display = "none"; }} />
                        : <span className="udc-brow-cover-ltr">{fl(title)}</span>
                      }
                    </div>
                    <div className="udc-brow-info">
                      <div className="udc-brow-title">{title}</div>
                      {auth && <div className="udc-brow-auth">by {auth}</div>}
                      <DuePill d={bk.due_date} />
                    </div>
                    {bk.fine > 0 && <div className="udc-brow-fine">₹{bk.fine}</div>}
                  </div>
                );
              })
            }
          </div>

          {/* Attendance — styled like AttendanceDisplay with profile-image-inspired hover */}
          <div className="udc-sh">
            <span className="udc-sh-t">Attendance</span>
            <span className="udc-sh-b">{attend.length} days</span>
          </div>
          <div className="udc-attend">
            {calMos.length === 0
              ? <div className="udc-empty">No attendance records yet.</div>
              : calMos.map(({ year, month, days }) => {
                const total = dim(year, month), now = new Date();
                return (
                  <div key={`${year}-${month}`} className="udc-at-month">
                    <div className="udc-at-month-name">{MONTHS[month]} {year}</div>
                    <div className="udc-at-days">
                      {Array.from({ length: total }, (_, i) => i + 1).map(day => {
                        const p = days.has(day);
                        const t = now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
                        return (
                          <div key={day}
                            className={`udc-at-day${p ? " p" : ""}${t ? " t" : ""}`}
                            title={`${MONTHS[month]} ${day}${p ? " — Present" : ""}`}
                          >{day}</div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            }
            {/* 14-day recent strip, same concept as AttendanceDisplay AttendanceDots */}
            {dots14.length > 0 && (
              <div className="udc-at-strip">
                <div className="udc-at-strip-label">Last 14 days</div>
                <div className="udc-at-strip-dots">
                  {dots14.map(({ d, present }, i) => (
                    <div key={i}
                      className={`udc-at-sdot ${present ? "p" : "a"}`}
                      title={`${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}${present ? " — Present" : ""}`}
                    >{d.getDate()}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Library catalogue */}
          <div className="udc-sh">
            <span className="udc-sh-t">Library Catalogue</span>
            <span className="udc-sh-b">{books.length} books</span>
          </div>
          {books.length === 0
            ? <div className="udc-list"><div className="udc-empty">No books in library.</div></div>
            : <div className="udc-cat">
              <InfiniteCarousel items={books} onSelect={setSelected} />
            </div>
          }

        </div>

        {selected && <BookSheet book={selected} onClose={() => setSelected(null)} />}
      </div>
    </>
  );
}