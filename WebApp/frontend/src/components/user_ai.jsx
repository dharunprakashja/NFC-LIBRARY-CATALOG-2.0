import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../api";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const dLeft = (d) => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null;
const tStr = (d) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

// ── System prompt — USER-SCOPED, privacy-safe ─────────────────────────────────
function buildUserSystemPrompt(user, catalogue) {
  const now = new Date();
  const borrowed = user.borrowed_books || [];
  const attendance = user.attendance || [];
  const fine = user.total_fine || 0;

  // Build a due-status summary for each borrowed book
  const borrowedSummary = borrowed.length === 0
    ? "None currently"
    : borrowed.map(b => {
      const d = dLeft(b.due_date);
      const status = d === null ? "" : d < 0 ? `⚠ ${Math.abs(d)} days OVERDUE` : d === 0 ? "⚠ Due today" : d <= 3 ? `Due in ${d} days (soon)` : `Due ${fmt(b.due_date)}`;
      return `• "${b.title || b.book_id}" — ${status} | Fine so far: ₹${b.fine || 0}`;
    }).join("\n");

  // Attendance overview — last 30 days count
  const recentDays = attendance.filter(d => {
    const diff = (now - new Date(d)) / 86400000;
    return diff <= 30;
  }).length;

  // Catalogue summary (available books only — no borrowing records of others)
  const availableCatalogue = catalogue
    .filter(b => b.available_pieces > 0)
    .map(b => `• [${b.book_id}] "${b.title}" by ${b.author}${b.genre ? ` — ${b.genre}` : ""} (${b.available_pieces} cop${b.available_pieces === 1 ? "y" : "ies"} available)`)
    .join("\n");

  const unavailableCatalogue = catalogue
    .filter(b => b.available_pieces === 0)
    .map(b => `• "${b.title}" by ${b.author} — currently unavailable`)
    .join("\n");

  return `You are LUMI, a friendly personal library assistant for members of this NFC-enabled smart library. You are warm, encouraging, and helpful — like a knowledgeable friend who loves books.

═══════════════════════════════════════════════════════════
WHO YOU ARE TALKING TO
═══════════════════════════════════════════════════════════
Name:     ${user.name}
Department: ${user.department}
Roll No:    ${user.roll_no}
Member since: always been here :)

═══════════════════════════════════════════════════════════
THIS MEMBER'S PERSONAL DATA (only data visible to you)
═══════════════════════════════════════════════════════════

📚 CURRENTLY BORROWED BOOKS
${borrowedSummary}

💰 FINE STATUS
${fine === 0
      ? "No outstanding fines. Great job returning books on time!"
      : `Outstanding fine: ₹${fine}. Please return overdue books to reduce your fine.`
    }

📅 ATTENDANCE
Total days visited: ${user.no_of_days || 0}
Visits in last 30 days: ${recentDays}
${recentDays >= 20 ? "🏆 Excellent attendance! You're one of our most regular members." :
      recentDays >= 10 ? "👍 Good attendance this month!" :
        recentDays >= 5 ? "📖 Moderate visits this month — the library misses you!" :
          "💡 You haven't visited much lately — there are great books waiting!"}

═══════════════════════════════════════════════════════════
LIBRARY CATALOGUE (what you can help them find / borrow)
═══════════════════════════════════════════════════════════

✅ AVAILABLE NOW
${availableCatalogue || "All books are currently borrowed — check back soon!"}

❌ CURRENTLY UNAVAILABLE (can check back later)
${unavailableCatalogue || "All books are available!"}

═══════════════════════════════════════════════════════════
WHAT YOU CAN HELP WITH
═══════════════════════════════════════════════════════════
1. PERSONAL STATUS — answer questions about ${user.name.split(" ")[0]}'s own borrowed books, due dates, fines, attendance
2. BOOK RECOMMENDATIONS — suggest books from the AVAILABLE catalogue based on their interests, genres they mention, or books they've read before
3. DUE DATE REMINDERS — clearly explain which books are due soon or overdue and what they should do
4. FINE EXPLANATION — explain how fines work, what they owe, and how to clear it
5. CATALOGUE SEARCH — help them find if a specific book is available
6. READING MOTIVATION — encourage reading, suggest reading goals, celebrate their library visits

═══════════════════════════════════════════════════════════
STRICT PRIVACY RULES — NEVER VIOLATE THESE
═══════════════════════════════════════════════════════════
❌ NEVER reveal other members' names, roll numbers, borrowing history, or fines
❌ NEVER reveal total member count, system statistics, or admin-level data
❌ NEVER reveal how many total copies exist (total_pieces) — only say "available" or "not available"
❌ NEVER mention other members who have a book ("someone else has it") — just say it's currently unavailable
❌ NEVER reveal the library's internal book IDs (like BK001) in responses — use the book title only
❌ NEVER discuss admin routes, system architecture, NFC internals, or backend details
❌ NEVER reveal other members' attendance records or comparison data

✅ YOU ONLY know about: ${user.name.split(" ")[0]}'s own data + what books are available/unavailable

═══════════════════════════════════════════════════════════
TONE & STYLE
═══════════════════════════════════════════════════════════
• Address the user by their first name (${user.name.split(" ")[0]}) occasionally — feel personal
• Be warm, enthusiastic about books, and encouraging
• Keep responses concise — use bullet points for lists, bold for key info
• If they ask something outside library scope, kindly redirect: "I'm LUMI, your personal library buddy — I can help with your books, due dates, and reading recommendations!"
• If a book they want isn't available, suggest a similar available book from the catalogue if possible
• Celebrate good behaviour — no fines, regular attendance, returning books early
• Gently remind about overdue books without being pushy`;
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function MD({ text }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {text.split("\n").map((line, i) => {
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
          <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", marginBottom: 2 }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#1a1a2e", flexShrink: 0, marginTop: 7 }} />
            <span style={{ fontSize: 12.5, color: "#444", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: fmt(line.replace(/^[•\-*] /, "")) }} />
          </div>
        );
        if (/^\d+\. (.+)/.test(line)) return (
          <div key={i} style={{ fontSize: 12.5, color: "#444", lineHeight: 1.6, marginBottom: 2 }} dangerouslySetInnerHTML={{ __html: fmt(line) }} />
        );
        if (line.trim() === "") return <div key={i} style={{ height: 4 }} />;
        return <div key={i} style={{ fontSize: 12.5, color: "#333", lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: fmt(line) }} />;
      })}
    </div>
  );
}

// ── Quick prompts personalised to common user needs ───────────────────────────
const QUICK = [
  { icon: "📖", label: "What books do I have?" },
  { icon: "⏰", label: "Any books due soon?" },
  { icon: "💰", label: "Do I owe any fines?" },
  { icon: "🎯", label: "Recommend me a book" },
  { icon: "📅", label: "My attendance summary" },
  { icon: "🔍", label: "Is a specific book available?" },
];

// ── CSS — matches app light theme (Inter, #1a1a2e, white cards) ───────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  /* ── FAB ── */
  .lumi-fab {
    position: fixed;
    bottom: 28px; right: 28px;
    width: 54px; height: 54px;
    border-radius: 16px;
    background: linear-gradient(135deg, #134e4a, #0f766e);
    border: none; cursor: pointer;
    z-index: 1200;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    box-shadow: 0 4px 20px rgba(15,118,110,0.4), 0 1px 4px rgba(15,118,110,0.2);
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease, border-radius 0.2s;
    animation: lumiIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
    overflow: hidden;
  }
  @keyframes lumiIn {
    from{opacity:0;transform:scale(0.4) translateY(20px)}
    to  {opacity:1;transform:scale(1) translateY(0)}
  }
  .lumi-fab:hover {
    transform: scale(1.08) translateY(-2px);
    box-shadow: 0 8px 30px rgba(15,118,110,0.5);
    border-radius: 18px;
  }
  .lumi-fab.open { transform: scale(0.92) rotate(10deg); box-shadow: 0 2px 10px rgba(15,118,110,0.2); }
  .lumi-fab::after { content:''; position:absolute; inset:0; background:rgba(255,255,255,0.12); opacity:0; transition:opacity 0.15s; border-radius:inherit; }
  .lumi-fab:active::after { opacity:1; }

  .lumi-fab-icon  { font-size:22px; line-height:1; }
  .lumi-fab-label { font-family:'Inter',sans-serif; font-size:8px; font-weight:700; color:rgba(255,255,255,0.8); letter-spacing:0.1em; text-transform:uppercase; margin-top:1px; }

  .lumi-unread {
    position:absolute; top:-3px; right:-3px;
    width:13px; height:13px; border-radius:50%;
    background:#e11d48; border:2px solid #fff;
    animation:lumiDot 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes lumiDot{from{transform:scale(0)}to{transform:scale(1)}}

  .lumi-tip {
    position:fixed; bottom:92px; right:28px;
    background:#134e4a; color:#fff;
    font-family:'Inter',sans-serif; font-size:11.5px; font-weight:500;
    padding:8px 14px; border-radius:12px; white-space:nowrap;
    pointer-events:none; z-index:1199;
    box-shadow:0 4px 20px rgba(15,118,110,0.3);
    animation:tipIn 0.3s ease both, tipOut 0.3s ease 3.8s both;
  }
  @keyframes tipIn  {from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes tipOut {from{opacity:1}to{opacity:0}}
  .lumi-tip::after { content:''; position:absolute; bottom:-5px; right:18px; width:10px; height:10px; background:#134e4a; transform:rotate(45deg); border-radius:2px; }

  /* ── Dialog ── */
  .lumi-dialog {
    position:fixed; bottom:94px; right:28px;
    width:420px; height:580px;
    background:#fff; border:1px solid #e8e8e8; border-radius:22px;
    display:flex; flex-direction:column; overflow:hidden;
    z-index:1200;
    box-shadow: 0 24px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(15,118,110,0.06);
    font-family:'Inter',sans-serif;
    transform-origin:bottom right;
    animation:lumiDialogIn 0.38s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes lumiDialogIn {
    from{opacity:0;transform:scale(0.85) translateY(20px)}
    to  {opacity:1;transform:scale(1) translateY(0)}
  }

  /* ── Header ── */
  .lumi-head {
    display:flex; align-items:center; gap:12px;
    padding:16px 18px 14px;
    background:#fff; border-bottom:1px solid #f2f2f2;
    flex-shrink:0; position:relative; overflow:hidden;
  }
  /* dot-grid texture */
  .lumi-head::before {
    content:''; position:absolute; inset:0;
    background-image:radial-gradient(circle,#d1fae5 1px,transparent 1px);
    background-size:16px 16px; opacity:0.6; pointer-events:none;
  }
  /* teal glow orb */
  .lumi-head::after {
    content:''; position:absolute; top:-30px; right:-20px;
    width:120px; height:120px; border-radius:50%;
    background:radial-gradient(circle,rgba(15,118,110,0.1) 0%,transparent 70%);
    pointer-events:none;
  }
  .lumi-head-logo {
    position:relative; z-index:1;
    width:38px; height:38px; border-radius:12px;
    background:linear-gradient(135deg,#134e4a,#0f766e);
    display:flex; align-items:center; justify-content:center;
    font-size:18px; flex-shrink:0;
    box-shadow:0 3px 12px rgba(15,118,110,0.3);
    transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  .lumi-head-logo:hover{transform:scale(1.1) rotate(-5deg);}
  .lumi-head-text{flex:1;position:relative;z-index:1;}
  .lumi-head-name{font-size:14px;font-weight:700;color:#111;letter-spacing:-0.01em;}
  .lumi-head-for {font-size:10px;color:#0f766e;font-weight:600;margin-top:1px;}
  .lumi-online{display:flex;align-items:center;gap:5px;font-size:10px;color:#16a34a;font-weight:600;}
  .lumi-online-dot{width:6px;height:6px;border-radius:50%;background:#16a34a;animation:lOnline 2s ease infinite;}
  @keyframes lOnline{0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,0.4)}50%{box-shadow:0 0 0 4px rgba(22,163,74,0)}}

  .lumi-head-btn {
    position:relative;z-index:1;
    width:28px;height:28px;border-radius:8px;
    background:transparent;border:1px solid #ebebeb;
    color:#aaa;cursor:pointer;font-size:13px;
    display:flex;align-items:center;justify-content:center;
    transition:all 0.15s;margin-left:4px;font-family:'Inter',sans-serif;
  }
  .lumi-head-btn:hover{background:#f5f5f5;color:#333;border-color:#ddd;}
  .lumi-head-btn svg{width:12px;height:12px;}

  /* ── Personal stat strip ── */
  .lumi-stats{
    display:flex;
    border-bottom:1px solid #f2f2f2;
    flex-shrink:0;
    background:#f9fffe;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .lumi-stats::-webkit-scrollbar { display: none; }
  .lumi-stat-cell{
    flex:1;padding:9px 8px;text-align:center;
    border-right:1px solid #f0f0f0;cursor:default;
    transition:background 0.15s;
    min-width: 62px;
  }
  .lumi-stat-cell:last-child{border-right:none;}
  .lumi-stat-cell:hover{background:#f0fffe;}
  .lumi-stat-val{font-size:14px;font-weight:700;color:#111;line-height:1;}
  .lumi-stat-lbl{font-size:8.5px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:0.07em;margin-top:2px;}
  .lumi-stat-val.warn  {color:#ca8a04;}
  .lumi-stat-val.danger{color:#e11d48;}
  .lumi-stat-val.ok    {color:#16a34a;}

  /* ── Messages ── */
  .lumi-msgs{flex:1;overflow-y:auto;padding:16px 14px 8px;display:flex;flex-direction:column;scrollbar-width:thin;scrollbar-color:#ebebeb transparent;}
  .lumi-msgs::-webkit-scrollbar{width:3px;}
  .lumi-msgs::-webkit-scrollbar-thumb{background:#ebebeb;border-radius:3px;}

  /* Welcome */
  .lumi-welcome{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:10px;animation:lWin 0.4s ease;}
  @keyframes lWin{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  .lumi-wicon{width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,#134e4a,#0f766e);display:flex;align-items:center;justify-content:center;font-size:30px;box-shadow:0 6px 24px rgba(15,118,110,0.25);animation:lFloat 3s ease infinite;}
  @keyframes lFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  .lumi-wtitle{font-size:15px;font-weight:700;color:#111;text-align:center;}
  .lumi-wname {font-size:13px;font-weight:700;color:#0f766e;text-align:center;}
  .lumi-wsub  {font-size:11.5px;color:#aaa;text-align:center;line-height:1.6;max-width:270px;}
  .lumi-quick {display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:2px;}
  .lumi-qchip {
    background:#f0fffe;border:1px solid #ccfbf1;border-radius:100px;
    padding:6px 12px;font-size:11px;font-weight:500;color:#0f766e;
    cursor:pointer;display:flex;align-items:center;gap:5px;
    font-family:'Inter',sans-serif;transition:all 0.18s;
  }
  .lumi-qchip:hover{background:#134e4a;color:#fff;border-color:#134e4a;transform:translateY(-2px);box-shadow:0 4px 12px rgba(19,78,74,0.25);}

  /* Message rows */
  .lumi-row{display:flex;gap:9px;margin-bottom:14px;animation:lMsgIn 0.28s cubic-bezier(0.22,1,0.36,1);}
  @keyframes lMsgIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
  .lumi-row.user{flex-direction:row-reverse;}

  .lumi-av{width:28px;height:28px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;margin-top:2px;}
  .lumi-av.ai  {background:linear-gradient(135deg,#134e4a,#0f766e);}
  .lumi-av.user{background:#f0f0f5;font-size:11px;font-weight:700;color:#888;}

  .lumi-bbl{max-width:84%;padding:11px 14px;border-radius:16px;transition:transform 0.15s;}
  .lumi-bbl:hover{transform:translateY(-1px);}
  .lumi-bbl.ai  {background:#f7fffe;border:1px solid #ccfbf1;border-bottom-left-radius:4px;}
  .lumi-bbl.user{background:linear-gradient(135deg,#134e4a,#0f766e);color:#fff;border-bottom-right-radius:4px;font-size:12.5px;line-height:1.65;}
  .lumi-ts{font-size:9.5px;color:#ccc;margin-top:4px;}
  .lumi-row.user .lumi-ts{text-align:right;}

  /* Fine alert bubble — shown when user has overdue */
  .lumi-alert{
    display:flex;align-items:center;gap:10px;
    background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;
    padding:10px 13px;margin:0 14px 10px;flex-shrink:0;
    animation:lWin 0.3s ease;
  }
  .lumi-alert-icon{font-size:18px;flex-shrink:0;}
  .lumi-alert-text{font-size:11.5px;color:#c2410c;font-weight:500;line-height:1.5;}

  /* Typing indicator */
  .lumi-typing-row{display:flex;gap:9px;margin-bottom:14px;animation:lMsgIn 0.28s ease;}
  .lumi-typing-bbl{background:#f7fffe;border:1px solid #ccfbf1;border-radius:16px;border-bottom-left-radius:4px;padding:12px 16px;display:flex;align-items:center;gap:4px;}
  .lumi-tdot{width:5px;height:5px;border-radius:50%;background:#0f766e;animation:lBounce 0.9s ease infinite;}
  .lumi-tdot:nth-child(2){animation-delay:.15s}
  .lumi-tdot:nth-child(3){animation-delay:.3s}
  @keyframes lBounce{0%,60%,100%{transform:translateY(0);opacity:0.4}30%{transform:translateY(-5px);opacity:1}}

  /* Input */
  .lumi-input-area{padding:10px 12px 14px;background:#fff;border-top:1px solid #f2f2f2;flex-shrink:0;}
  .lumi-input-row{display:flex;gap:8px;align-items:flex-end;}
  .lumi-input-wrap{
    flex:1;background:#f7fffe;border:1.5px solid #ccfbf1;border-radius:14px;
    padding:9px 13px;transition:border-color 0.2s,box-shadow 0.2s,background 0.2s;display:flex;align-items:flex-end;
  }
  .lumi-input-wrap:focus-within{border-color:#0f766e;background:#fff;box-shadow:0 0 0 3px rgba(15,118,110,0.1);}
  .lumi-ta{flex:1;background:transparent;border:none;outline:none;color:#111;font-family:'Inter',sans-serif;font-size:12.5px;line-height:1.5;resize:none;max-height:80px;min-height:18px;scrollbar-width:none;}
  .lumi-ta::-webkit-scrollbar{display:none;}
  .lumi-ta::placeholder{color:#aaa;}
  .lumi-send-btn{
    width:36px;height:36px;border-radius:11px;
    background:linear-gradient(135deg,#134e4a,#0f766e);
    border:none;cursor:pointer;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 3px 12px rgba(15,118,110,0.35);
    transition:transform 0.2s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.2s,opacity 0.15s;
  }
  .lumi-send-btn:hover:not(:disabled){transform:scale(1.12) translateY(-1px);box-shadow:0 6px 18px rgba(15,118,110,0.45);}
  .lumi-send-btn:active{transform:scale(0.95);}
  .lumi-send-btn:disabled{opacity:0.35;cursor:not-allowed;}
  .lumi-send-btn svg{width:14px;height:14px;color:#fff;}
  .lumi-hint{font-size:9.5px;color:#ddd;text-align:center;margin-top:7px;font-family:'Inter',sans-serif;}

  /* Loading */
  .lumi-dbl{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#bbb;font-size:12px;}
  .lumi-spin{width:26px;height:26px;border:2px solid #f0f0f0;border-top-color:#0f766e;border-radius:50%;animation:lSpin 0.7s linear infinite;}
  @keyframes lSpin{to{transform:rotate(360deg)}}
  .lumi-err{margin:0 12px 8px;background:#fff1f2;border:1px solid #fecdd3;border-radius:10px;padding:8px 12px;font-size:11px;color:#e11d48;display:flex;gap:6px;align-items:center;flex-shrink:0;}

  /* ── RESPONSIVE MOBILE ADJUSTMENTS ── */
  @media (max-width: 600px) {
    .lumi-fab {
      bottom: 16px; right: 16px;
    }
    .lumi-tip {
      bottom: 80px; right: 16px;
    }
    .lumi-dialog {
      bottom: 0; right: 0; left: 0; top: 0;
      width: 100%; height: 100dvh;
      border-radius: 0;
      animation: lumiDialogInMobile 0.3s cubic-bezier(0.22,1,0.36,1) both;
    }
    @keyframes lumiDialogInMobile {
      from { opacity: 0; transform: translateY(100%); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .lumi-head {
      padding: 14px 16px;
    }
    .lumi-stats {
      justify-content: flex-start;
    }
    .lumi-stat-cell {
      min-width: 65px;
      padding: 8px 6px;
    }
    .lumi-stat-val { font-size: 13px; }
    .lumi-stat-lbl { font-size: 8px; }
    .lumi-input-area {
      padding: 8px 12px 12px;
    }
    .lumi-bbl {
      max-width: 90%;
    }
  }
`;

// ── Component ─────────────────────────────────────────────────────────────────
export default function UserARIABubble() {
  const [open, setOpen] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [unread, setUnread] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [catalogue, setCatalogue] = useState([]);

  const chatRef = useRef(null);
  const taRef = useRef(null);
  const sysRef = useRef("");

  // Hide tooltip after 4s
  useEffect(() => {
    const t = setTimeout(() => setShowTip(false), 4000);
    return () => clearTimeout(t);
  }, []);

  // Load this user's own data + public catalogue
  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const rollNo = sessionStorage.getItem("roll_no");
      const [userRes, catRes] = await Promise.all([
        api.get(`/account/${rollNo}`),   // user's own profile only
        api.get("/book"),                // public catalogue
      ]);
      const u = userRes.data.account || userRes.data;
      const b = catRes.data.books || [];
      setUser(u);
      setCatalogue(b);
      sysRef.current = buildUserSystemPrompt(u, b);
    } catch {
      setError("Couldn't load your library data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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
      const res = await api.post("/user_ai/chat", {
        userMessage: msg,
        history,
        systemPrompt: sysRef.current,
      });
      const { reply, history: h2 } = res.data;
      setHistory(h2);
      setMessages(p => [...p, { role: "ai", content: reply, time: new Date() }]);
      if (!open) setUnread(true);
    } catch (e) {
      setError(e?.response?.data?.message || "Request failed. Try again.");
    } finally {
      setSending(false);
    }
  };

  const handleOpen = () => { setOpen(o => !o); setUnread(false); setShowTip(false); };

  // Derived personal stats
  const borrowed = user?.borrowed_books || [];
  const fine = user?.total_fine || 0;
  const daysVisited = user?.no_of_days || 0;
  const hasOverdue = borrowed.some(b => { const d = dLeft(b.due_date); return d !== null && d < 0; });
  const dueSoon = borrowed.filter(b => { const d = dLeft(b.due_date); return d !== null && d >= 0 && d <= 3; }).length;
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <>
      <style>{css}</style>

      {/* Tooltip */}
      {showTip && !open && (
        <div className="lumi-tip">📖 Hi {firstName}! Ask me about your books ✦</div>
      )}

      {/* FAB */}
      <button className={`lumi-fab ${open ? "open" : ""}`} onClick={handleOpen} title="LUMI — Your Library Assistant">
        <div className="lumi-fab-icon">{open ? "✕" : "📖"}</div>
        {!open && <div className="lumi-fab-label">LUMI</div>}
        {unread && !open && <div className="lumi-unread" />}
      </button>

      {/* Dialog */}
      {open && (
        <div className="lumi-dialog">

          {/* Header */}
          <div className="lumi-head">
            <div className="lumi-head-logo">📖</div>
            <div className="lumi-head-text">
              <div className="lumi-head-name">LUMI — Your Library Buddy</div>
              <div className="lumi-online">
                <span className="lumi-online-dot" />
                Personal assistant · Your data only
              </div>
            </div>
            <button className="lumi-head-btn" title="Refresh" onClick={loadData}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
              </svg>
            </button>
            <button className="lumi-head-btn" onClick={handleOpen}>✕</button>
          </div>

          {/* Personal stat strip */}
          {!loading && user && (
            <div className="lumi-stats">
              {[
                { v: borrowed.length, l: "Borrowed", c: borrowed.length > 0 ? "warn" : "ok" },
                { v: dueSoon, l: "Due Soon", c: dueSoon > 0 ? "warn" : "ok" },
                { v: hasOverdue ? "Yes" : "No", l: "Overdue", c: hasOverdue ? "danger" : "ok" },
                { v: `₹${fine}`, l: "Fine", c: fine > 0 ? "danger" : "ok" },
                { v: daysVisited, l: "Visits", c: "" },
              ].map(({ v, l, c }) => (
                <div key={l} className="lumi-stat-cell">
                  <div className={`lumi-stat-val ${c}`}>{v}</div>
                  <div className="lumi-stat-lbl">{l}</div>
                </div>
              ))}
            </div>
          )}

          {/* Overdue alert banner */}
          {!loading && hasOverdue && (
            <div className="lumi-alert">
              <div className="lumi-alert-icon">⚠️</div>
              <div className="lumi-alert-text">
                You have <strong>overdue books</strong>. Please return them to avoid additional fines.
              </div>
            </div>
          )}

          {error && <div className="lumi-err">⚠️ {error}</div>}

          {/* Messages */}
          <div className="lumi-msgs" ref={chatRef}>
            {loading ? (
              <div className="lumi-dbl">
                <div className="lumi-spin" />
                <span>Loading your library data…</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="lumi-welcome">
                <div className="lumi-wicon">📖</div>
                <div className="lumi-wtitle">Hey {firstName}! 👋</div>
                <div className="lumi-wname">I'm LUMI, your personal library assistant</div>
                <div className="lumi-wsub">
                  {borrowed.length > 0
                    ? `You have ${borrowed.length} book${borrowed.length > 1 ? "s" : ""} borrowed${fine > 0 ? ` and ₹${fine} in fines` : ""}. Ask me anything!`
                    : "You have no books borrowed right now. Want a recommendation?"}
                </div>
                <div className="lumi-quick">
                  {QUICK.map((q, i) => (
                    <button key={i} className="lumi-qchip" onClick={() => send(q.label)}>
                      <span>{q.icon}</span>{q.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`lumi-row ${msg.role === "user" ? "user" : ""}`}>
                  <div className={`lumi-av ${msg.role}`}>
                    {msg.role === "ai" ? "📖" : firstName[0].toUpperCase()}
                  </div>
                  <div style={{ maxWidth: "84%" }}>
                    <div className={`lumi-bbl ${msg.role}`}>
                      {msg.role === "ai" ? <MD text={msg.content} /> : msg.content}
                    </div>
                    <div className="lumi-ts">{tStr(msg.time)}</div>
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="lumi-typing-row">
                <div className="lumi-av ai">📖</div>
                <div className="lumi-typing-bbl">
                  <div className="lumi-tdot" /><div className="lumi-tdot" /><div className="lumi-tdot" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="lumi-input-area">
            <div className="lumi-input-row">
              <div className="lumi-input-wrap">
                <textarea
                  ref={taRef}
                  className="lumi-ta"
                  placeholder={`Ask me about your books, ${firstName}…`}
                  value={input} rows={1}
                  disabled={sending || loading}
                  onChange={e => { setInput(e.target.value); resize(e.target); }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                />
              </div>
              <button
                className="lumi-send-btn"
                onClick={() => send(input)}
                disabled={!input.trim() || sending || loading}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <div className="lumi-hint">Enter to send · Your data stays private</div>
          </div>

        </div>
      )}
    </>
  );
}