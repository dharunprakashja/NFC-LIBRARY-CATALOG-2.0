import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../api";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const dLeft = (d) => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null;
const tStr = (d) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

function buildSystemPrompt(books, members) {
  const now = new Date();
  const totalCopies = books.reduce((s, b) => s + (b.total_pieces || 0), 0);
  const availableCopies = books.reduce((s, b) => s + (b.available_pieces || 0), 0);
  const genres = [...new Set(books.map(b => b.genre).filter(Boolean))];
  const mostBorrowed = [...books].sort((a, b) => (b.borrowed_by?.length || 0) - (a.borrowed_by?.length || 0)).slice(0, 5);
  const totalFineAmt = members.reduce((s, m) => s + (m.total_fine || 0), 0);
  const overdueBorrowers = members.filter(m => (m.borrowed_books || []).some(bk => { const n = dLeft(bk.due_date); return n !== null && n < 0; }));
  const depts = [...new Set(members.map(m => m.department).filter(Boolean))];
  const highAttend = [...members].sort((a, b) => (b.no_of_days || 0) - (a.no_of_days || 0)).slice(0, 5);
  const bookCatalogue = books.map(b => `• [${b.book_id}] "${b.title}" by ${b.author}${b.genre ? ` (${b.genre})` : ""} — ${b.available_pieces}/${b.total_pieces} available`).join("\n");
  const memberRoster = members.map(m => `• ${m.name} [${m.roll_no}] | ${m.department} | ${(m.borrowed_books || []).length} books | Fine: ₹${m.total_fine || 0}` + ((m.borrowed_books || []).length > 0 ? ` | ${m.borrowed_books.map(bk => `"${bk.title || bk.book_id}" due ${fmt(bk.due_date)}`).join(", ")}` : "")).join("\n");
  const overdueDetails = overdueBorrowers.flatMap(m => m.borrowed_books.filter(bk => { const n = dLeft(bk.due_date); return n !== null && n < 0; }).map(bk => `• ${m.name} [${m.roll_no}] — "${bk.title || bk.book_id}" ${Math.abs(dLeft(bk.due_date))}d overdue`)).join("\n");

  return `You are ARIA (Advanced Reading & Intelligence Assistant), the AI librarian for this NFC-based smart library. You are helpful, concise and warm. Only answer library-related questions.

LIVE SNAPSHOT — ${now.toLocaleString("en-IN")}
Books: ${books.length} titles · ${totalCopies} copies · ${availableCopies} available
Members: ${members.length} · Borrowing: ${members.filter(m => (m.borrowed_books || []).length > 0).length} · Fines: ₹${totalFineAmt} · Overdue: ${overdueBorrowers.length}
Genres: ${genres.join(", ") || "None"} · Departments: ${depts.join(", ") || "None"}
Top borrowed: ${mostBorrowed.map((b, i) => `${i + 1}."${b.title}"(${b.borrowed_by?.length || 0}x)`).join(", ")}
Top attendance: ${highAttend.map((m, i) => `${i + 1}.${m.name}(${m.no_of_days || 0}d)`).join(", ")}
Overdue:\n${overdueDetails || "None"}
Books:\n${bookCatalogue || "None"}
Members:\n${memberRoster || "None"}

Decline off-topic questions with: "I'm ARIA, your library assistant — I only answer library questions." Be concise and use bullet points.`;
}

// ── Inline markdown renderer ───────────────────────────────────────────────────
function MD({ text }) {
  const lines = text.split("\n");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {lines.map((line, i) => {
        const fmt = (t) => t
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.+?)\*/g, "<em>$1</em>")
          .replace(/`(.+?)`/g, `<code style="background:#f0f0f5;color:#1a1a2e;padding:1px 5px;border-radius:4px;font-size:11px;font-family:monospace">$1</code>`);

        if (/^###? (.+)/.test(line)) return (
          <div key={i} style={{ fontSize: 10, fontWeight: 700, color: "#1a1a2e", textTransform: "uppercase", letterSpacing: "0.1em", margin: "8px 0 2px", paddingBottom: 4, borderBottom: "1px solid #f0f0f0" }}>
            {line.replace(/^###? /, "")}
          </div>
        );
        if (/^---+$/.test(line.trim())) return <div key={i} style={{ height: 1, background: "#f0f0f0", margin: "6px 0" }} />;
        if (/^[•\-*] (.+)/.test(line)) return (
          <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#1a1a2e", flexShrink: 0, marginTop: 7 }} />
            <span style={{ fontSize: 12.5, color: "#444", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: fmt(line.replace(/^[•\-*] /, "")) }} />
          </div>
        );
        if (/^\d+\. (.+)/.test(line)) return (
          <div key={i} style={{ fontSize: 12.5, color: "#444", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: fmt(line) }} />
        );
        if (line.trim() === "") return <div key={i} style={{ height: 4 }} />;
        return <div key={i} style={{ fontSize: 12.5, color: "#333", lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: fmt(line) }} />;
      })}
    </div>
  );
}

const QUICK = [
  { icon: "📊", label: "Library status" },
  { icon: "⚠️", label: "Overdue books" },
  { icon: "💰", label: "Outstanding fines" },
  { icon: "📚", label: "Popular books" },
  { icon: "👥", label: "Active members" },
  { icon: "📉", label: "Low stock" },
];

// ── CSS ───────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  /* ── FAB ── */
  .aria-fab {
    position: fixed;
    bottom: 28px; right: 28px;
    width: 54px; height: 54px;
    border-radius: 16px;
    background: #1a1a2e;
    border: none;
    cursor: pointer;
    z-index: 1200;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 20px rgba(26,26,46,0.35), 0 1px 4px rgba(26,26,46,0.2);
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1),
                box-shadow 0.2s ease,
                border-radius 0.2s ease;
    animation: fabEntry 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
    overflow: hidden;
  }
  @keyframes fabEntry {
    from { opacity:0; transform:scale(0.4) translateY(20px); }
    to   { opacity:1; transform:scale(1)   translateY(0); }
  }
  .aria-fab:hover {
    transform: scale(1.08) translateY(-2px);
    box-shadow: 0 8px 32px rgba(26,26,46,0.45), 0 2px 8px rgba(26,26,46,0.25);
    border-radius: 18px;
  }
  .aria-fab.open {
    transform: scale(0.93) rotate(8deg);
    box-shadow: 0 2px 10px rgba(26,26,46,0.2);
  }
  .aria-fab-inner {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    transition: transform 0.3s ease, opacity 0.2s ease;
  }
  .aria-fab-label {
    font-family: 'Inter', sans-serif;
    font-size: 8px; font-weight: 700;
    color: rgba(255,255,255,0.7);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-top: 1px;
  }
  .aria-fab-icon { font-size: 22px; line-height: 1; }

  /* Ripple on click */
  .aria-fab::after {
    content: '';
    position: absolute; inset: 0;
    border-radius: inherit;
    background: rgba(255,255,255,0.15);
    opacity: 0;
    transition: opacity 0.15s;
  }
  .aria-fab:active::after { opacity: 1; }

  /* Unread dot */
  .aria-unread {
    position: absolute; top: -3px; right: -3px;
    width: 13px; height: 13px;
    border-radius: 50%; background: #ef4444;
    border: 2px solid #fff;
    animation: dotIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes dotIn { from{transform:scale(0)} to{transform:scale(1)} }

  /* Tooltip */
  .aria-tip {
    position: fixed;
    bottom: 92px; right: 28px;
    background: #1a1a2e;
    color: #fff;
    font-family: 'Inter', sans-serif;
    font-size: 11.5px; font-weight: 500;
    padding: 8px 14px; border-radius: 12px;
    white-space: nowrap; pointer-events: none;
    z-index: 1199;
    box-shadow: 0 4px 20px rgba(26,26,46,0.25);
    animation: tipIn 0.3s ease both, tipOut 0.3s ease 3.8s both;
  }
  @keyframes tipIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes tipOut { from{opacity:1} to{opacity:0} }
  .aria-tip::after {
    content:''; position:absolute; bottom:-5px; right:18px;
    width:10px; height:10px; background:#1a1a2e;
    transform:rotate(45deg); border-radius:2px;
  }

  /* ── Dialog ── */
  .aria-dialog {
    position: fixed;
    bottom: 94px; right: 28px;
    width: 420px; height: 580px;
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 22px;
    display: flex; flex-direction: column;
    overflow: hidden;
    z-index: 1200;
    box-shadow:
      0 24px 80px rgba(0,0,0,0.13),
      0 8px 24px rgba(0,0,0,0.07),
      0 0 0 1px rgba(26,26,46,0.05);
    font-family: 'Inter', sans-serif;
    transform-origin: bottom right;
    animation: dialogIn 0.38s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes dialogIn {
    from { opacity:0; transform:scale(0.85) translateY(20px); }
    to   { opacity:1; transform:scale(1)    translateY(0); }
  }

  /* ── Dialog header ── */
  .aria-head {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 18px 14px;
    background: #fff;
    border-bottom: 1px solid #f2f2f2;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
  }
  /* Subtle dot-grid texture in header */
  .aria-head::before {
    content:'';
    position:absolute; inset:0;
    background-image: radial-gradient(circle, #e8e8f0 1px, transparent 1px);
    background-size: 16px 16px;
    opacity: 0.5;
    pointer-events: none;
  }
  /* Radial glow orb */
  .aria-head::after {
    content:'';
    position:absolute; top:-30px; right:-20px;
    width:120px; height:120px;
    border-radius:50%;
    background:radial-gradient(circle,rgba(26,26,46,0.08) 0%,transparent 70%);
    pointer-events:none;
  }

  .aria-head-logo {
    position: relative; z-index: 1;
    width: 38px; height: 38px; border-radius: 12px;
    background: #1a1a2e;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
    box-shadow: 0 3px 12px rgba(26,26,46,0.25);
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  .aria-head-logo:hover { transform: scale(1.1) rotate(-5deg); }

  .aria-head-text { flex:1; position:relative; z-index:1; }
  .aria-head-name {
    font-size: 14px; font-weight: 700; color: #111;
    letter-spacing: -0.01em;
  }
  .aria-online {
    display: flex; align-items: center; gap: 5px;
    font-size: 10px; color: #16a34a; font-weight: 600;
    margin-top: 1px;
  }
  .aria-online-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #16a34a;
    animation: onlinePulse 2s ease infinite;
  }
  @keyframes onlinePulse {
    0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,0.4)}
    50%    {box-shadow:0 0 0 4px rgba(22,163,74,0)}
  }

  .aria-head-btn {
    position: relative; z-index: 1;
    width: 28px; height: 28px; border-radius: 8px;
    background: transparent; border: 1px solid #ebebeb;
    color: #aaa; cursor: pointer; font-size: 13px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; font-family: 'Inter', sans-serif;
    margin-left: 4px;
  }
  .aria-head-btn:hover { background: #f5f5f5; color: #333; border-color: #ddd; }
  .aria-head-btn svg { width: 12px; height: 12px; }

  /* ── Stats strip ── */
  .aria-stats {
    display: flex;
    border-bottom: 1px solid #f2f2f2;
    flex-shrink: 0; overflow-x: auto;
    scrollbar-width: none;
    background: #fafafa;
  }
  .aria-stats::-webkit-scrollbar { display:none; }
  .aria-stat-cell {
    flex: 1; min-width: 62px;
    padding: 9px 8px; text-align: center;
    border-right: 1px solid #f0f0f0;
    cursor: default;
    transition: background 0.15s;
  }
  .aria-stat-cell:last-child { border-right: none; }
  .aria-stat-cell:hover { background: #f0f0f5; }
  .aria-stat-val { font-size: 14px; font-weight: 700; color: #111; line-height: 1; }
  .aria-stat-lbl { font-size: 8.5px; font-weight: 600; color: #bbb; text-transform: uppercase; letter-spacing: 0.07em; margin-top: 2px; }
  .aria-stat-val.warn   { color: #ca8a04; }
  .aria-stat-val.danger { color: #e11d48; }
  .aria-stat-val.ok     { color: #16a34a; }

  /* ── Messages ── */
  .aria-msgs {
    flex: 1; overflow-y: auto; padding: 16px 14px 8px;
    display: flex; flex-direction: column; gap: 0;
    scrollbar-width: thin; scrollbar-color: #ebebeb transparent;
  }
  .aria-msgs::-webkit-scrollbar { width: 3px; }
  .aria-msgs::-webkit-scrollbar-thumb { background: #ebebeb; border-radius: 3px; }

  /* Welcome */
  .aria-welcome {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 14px;
    padding: 10px;
    animation: wIn 0.4s ease;
  }
  @keyframes wIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .aria-wicon {
    width: 64px; height: 64px; border-radius: 20px;
    background: #1a1a2e;
    display: flex; align-items: center; justify-content: center;
    font-size: 30px;
    box-shadow: 0 6px 24px rgba(26,26,46,0.2);
    animation: float 3s ease infinite;
  }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  .aria-wtitle { font-size: 15px; font-weight: 700; color: #111; text-align: center; }
  .aria-wsub   { font-size: 11.5px; color: #aaa; text-align: center; line-height: 1.6; max-width: 260px; }
  .aria-quick  { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-top: 2px; }
  .aria-qchip {
    background: #f5f5f7; border: 1px solid #ebebeb; border-radius: 100px;
    padding: 6px 12px; font-size: 11px; font-weight: 500; color: #555;
    cursor: pointer; display: flex; align-items: center; gap: 5px;
    font-family: 'Inter', sans-serif;
    transition: all 0.18s;
  }
  .aria-qchip:hover {
    background: #1a1a2e; color: #fff; border-color: #1a1a2e;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(26,26,46,0.2);
  }

  /* Message row */
  .aria-row {
    display: flex; gap: 9px; margin-bottom: 14px;
    animation: mIn 0.28s cubic-bezier(0.22,1,0.36,1);
  }
  @keyframes mIn { from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:translateY(0)} }
  .aria-row.user { flex-direction: row-reverse; }

  .aria-av {
    width: 28px; height: 28px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; flex-shrink: 0; margin-top: 2px;
  }
  .aria-av.ai   { background: #1a1a2e; }
  .aria-av.user { background: #f0f0f5; font-size: 11px; font-weight: 700; color: #888; }

  .aria-bbl {
    max-width: 84%;
    padding: 11px 14px; border-radius: 16px;
    transition: transform 0.15s ease;
  }
  .aria-bbl:hover { transform: translateY(-1px); }
  .aria-bbl.ai {
    background: #f7f7f9; border: 1px solid #ebebeb;
    border-bottom-left-radius: 4px;
  }
  .aria-bbl.user {
    background: #1a1a2e; color: #fff;
    border-bottom-right-radius: 4px;
    font-size: 12.5px; line-height: 1.65;
  }
  .aria-ts { font-size: 9.5px; color: #ccc; margin-top: 4px; }
  .aria-row.user .aria-ts { text-align: right; }

  /* Typing indicator */
  .aria-typing-row { display:flex; gap:9px; margin-bottom:14px; animation:mIn 0.28s ease; }
  .aria-typing-bbl {
    background: #f7f7f9; border: 1px solid #ebebeb;
    border-radius: 16px; border-bottom-left-radius: 4px;
    padding: 12px 16px; display: flex; align-items: center; gap: 4px;
  }
  .aria-tdot {
    width: 5px; height: 5px; border-radius: 50%; background: #ccc;
    animation: tBounce 0.9s ease infinite;
  }
  .aria-tdot:nth-child(2){animation-delay:.15s}
  .aria-tdot:nth-child(3){animation-delay:.3s}
  @keyframes tBounce {
    0%,60%,100%{transform:translateY(0);opacity:0.5}
    30%         {transform:translateY(-5px);opacity:1}
  }

  /* ── Generative UI cards (for structured responses) ── */
  .aria-card {
    background: #fff; border: 1px solid #ebebeb;
    border-radius: 12px; padding: 12px 14px; margin: 6px 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    transition: box-shadow 0.2s, transform 0.2s;
  }
  .aria-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    transform: translateY(-1px);
  }

  /* ── Input area ── */
  .aria-input-area {
    padding: 10px 12px 14px;
    background: #fff;
    border-top: 1px solid #f2f2f2;
    flex-shrink: 0;
  }
  .aria-input-row {
    display: flex; gap: 8px; align-items: flex-end;
  }
  .aria-input-wrap {
    flex: 1;
    background: #f7f7f9; border: 1.5px solid #ebebeb; border-radius: 14px;
    padding: 9px 13px;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    display: flex; align-items: flex-end;
  }
  .aria-input-wrap:focus-within {
    border-color: #1a1a2e;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(26,26,46,0.08);
  }
  .aria-ta {
    flex: 1; background: transparent; border: none; outline: none;
    color: #111; font-family: 'Inter', sans-serif;
    font-size: 12.5px; line-height: 1.5; resize: none;
    max-height: 80px; min-height: 18px; scrollbar-width: none;
  }
  .aria-ta::-webkit-scrollbar { display:none; }
  .aria-ta::placeholder { color: #ccc; }
  .aria-send-btn {
    width: 36px; height: 36px; border-radius: 11px;
    background: #1a1a2e; border: none; cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 3px 12px rgba(26,26,46,0.3);
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1),
                box-shadow 0.2s ease,
                opacity 0.15s;
  }
  .aria-send-btn:hover:not(:disabled) {
    transform: scale(1.12) translateY(-1px);
    box-shadow: 0 6px 18px rgba(26,26,46,0.4);
  }
  .aria-send-btn:active { transform: scale(0.95); }
  .aria-send-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .aria-send-btn svg { width: 14px; height: 14px; color: #fff; }

  .aria-hint {
    font-size: 9.5px; color: #ddd; text-align: center; margin-top: 7px;
    font-family: 'Inter', sans-serif;
  }

  /* Loading */
  .aria-dbl {
    flex:1; display:flex; flex-direction:column;
    align-items:center; justify-content:center; gap:10px; color:#bbb; font-size:12px;
  }
  .aria-spin {
    width:26px; height:26px; border:2px solid #f0f0f0;
    border-top-color:#1a1a2e; border-radius:50%;
    animation:spin 0.7s linear infinite;
  }
  @keyframes spin{to{transform:rotate(360deg)}}

  /* Error */
  .aria-err {
    margin:0 12px 8px; background:#fff1f2; border:1px solid #fecdd3;
    border-radius:10px; padding:8px 12px; font-size:11px; color:#e11d48;
    display:flex; gap:6px; align-items:center; flex-shrink:0;
  }

  /* Sync spinning */
  .aria-sync-spin { animation: spin 0.7s linear infinite; }
`;

export default function ARIABubble() {
  const [open, setOpen] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [unread, setUnread] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);

  const chatRef = useRef(null);
  const taRef = useRef(null);
  const sysRef = useRef("");

  // hide tooltip after 4s
  useEffect(() => {
    const t = setTimeout(() => setShowTip(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const loadDB = useCallback(async (isSync = false) => {
    if (isSync) setSyncing(true); else setDbLoading(true);
    setError(null);
    try {
      const [bRes, mRes] = await Promise.all([
        api.get("/book"),
        api.get("/account"),
      ]);
      const b = bRes.data.books || [];
      const m = mRes.data.accounts || mRes.data.members || [];
      setBooks(b); setMembers(m);
      sysRef.current = buildSystemPrompt(b, m);
      if (isSync) {
        setMessages(p => [...p, {
          role: "ai",
          content: `**Database synced ✓**\n${b.length} books · ${m.length} members — all up to date.`,
          time: new Date()
        }]);
      }
    } catch {
      setError("Cannot reach library database.");
    } finally {
      setDbLoading(false); setSyncing(false);
    }
  }, []);

  useEffect(() => { loadDB(); }, [loadDB]);

  useEffect(() => {
    if (chatRef.current)
      chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const resize = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 80) + "px";
  };

  const send = async (text) => {
    const msg = text.trim();
    if (!msg || sending) return;
    setInput(""); if (taRef.current) taRef.current.style.height = "auto";
    setError(null);
    setMessages(p => [...p, { role: "user", content: msg, time: new Date() }]);
    setSending(true);
    try {
      const res = await api.post("/admin_ai/chat", {
        userMessage: msg, history, systemPrompt: sysRef.current,
      });
      const { reply, history: h2 } = res.data;
      setHistory(h2);
      setMessages(p => [...p, { role: "ai", content: reply, time: new Date() }]);
      if (!open) setUnread(true);
    } catch (e) {
      setError(e?.response?.data?.message || "AI request failed.");
    } finally {
      setSending(false);
    }
  };

  const handleOpen = () => { setOpen(o => !o); setUnread(false); setShowTip(false); };

  // Stats
  const totalFine = members.reduce((s, m) => s + (m.total_fine || 0), 0);
  const overdue = members.filter(m => (m.borrowed_books || []).some(bk => { const n = dLeft(bk.due_date); return n !== null && n < 0; })).length;
  const activeBorrow = members.filter(m => (m.borrowed_books || []).length > 0).length;
  const available = books.reduce((s, b) => s + (b.available_pieces || 0), 0);

  return (
    <>
      <style>{css}</style>

      {/* Tooltip */}
      {showTip && !open && (
        <div className="aria-tip">Ask ARIA about your library ✦</div>
      )}

      {/* FAB */}
      <button className={`aria-fab ${open ? "open" : ""}`} onClick={handleOpen}>
        <div className="aria-fab-inner">
          <div className="aria-fab-icon">{open ? "✕" : "📚"}</div>
          {!open && <div className="aria-fab-label">ARIA</div>}
        </div>
        {unread && !open && <div className="aria-unread" />}
      </button>

      {/* Dialog */}
      {open && (
        <div className="aria-dialog">

          {/* Header */}
          <div className="aria-head">
            <div className="aria-head-logo">📚</div>
            <div className="aria-head-text">
              <div className="aria-head-name">ARIA — Library AI</div>
              <div className="aria-online">
                <span className="aria-online-dot" />
                Live database · Admin only
              </div>
            </div>
            <button
              className="aria-head-btn"
              title="Sync database"
              onClick={() => loadDB(true)}
              disabled={syncing}
            >
              <svg className={syncing ? "aria-sync-spin" : ""} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
              </svg>
            </button>
            <button className="aria-head-btn" onClick={handleOpen}>✕</button>
          </div>

          {/* Stats strip */}
          {!dbLoading && (
            <div className="aria-stats">
              {[
                { v: books.length, l: "Books", c: "" },
                { v: members.length, l: "Members", c: "" },
                { v: activeBorrow, l: "Active", c: activeBorrow > 0 ? "warn" : "" },
                { v: overdue, l: "Overdue", c: overdue > 0 ? "danger" : "ok" },
                { v: `₹${totalFine}`, l: "Fines", c: totalFine > 0 ? "danger" : "ok" },
                { v: available, l: "Avail.", c: "ok" },
              ].map(({ v, l, c }) => (
                <div key={l} className="aria-stat-cell">
                  <div className={`aria-stat-val ${c}`}>{v}</div>
                  <div className="aria-stat-lbl">{l}</div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && <div className="aria-err">⚠️ {error}</div>}

          {/* Messages */}
          <div className="aria-msgs" ref={chatRef}>
            {dbLoading ? (
              <div className="aria-dbl">
                <div className="aria-spin" />
                <span>Connecting to database…</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="aria-welcome">
                <div className="aria-wicon">📚</div>
                <div className="aria-wtitle">Hi Admin, I'm ARIA</div>
                <div className="aria-wsub">
                  Your AI library assistant with live data access. Ask me about books, members, fines, or recommendations.
                </div>
                <div className="aria-quick">
                  {QUICK.map((q, i) => (
                    <button key={i} className="aria-qchip" onClick={() => send(q.label)}>
                      <span>{q.icon}</span>{q.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`aria-row ${msg.role === "user" ? "user" : ""}`}>
                  <div className={`aria-av ${msg.role}`}>
                    {msg.role === "ai" ? "📚" : "A"}
                  </div>
                  <div style={{ maxWidth: "84%" }}>
                    <div className={`aria-bbl ${msg.role}`}>
                      {msg.role === "ai"
                        ? <MD text={msg.content} />
                        : msg.content
                      }
                    </div>
                    <div className="aria-ts">{tStr(msg.time)}</div>
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="aria-typing-row">
                <div className="aria-av ai">📚</div>
                <div className="aria-typing-bbl">
                  <div className="aria-tdot" /><div className="aria-tdot" /><div className="aria-tdot" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="aria-input-area">
            <div className="aria-input-row">
              <div className="aria-input-wrap">
                <textarea
                  ref={taRef}
                  className="aria-ta"
                  placeholder="Ask anything about your library…"
                  value={input}
                  rows={1}
                  disabled={sending || dbLoading}
                  onChange={e => { setInput(e.target.value); resize(e.target); }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                />
              </div>
              <button
                className="aria-send-btn"
                onClick={() => send(input)}
                disabled={!input.trim() || sending || dbLoading}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <div className="aria-hint">Enter to send · Shift+Enter for new line</div>
          </div>

        </div>
      )}
    </>
  );
}