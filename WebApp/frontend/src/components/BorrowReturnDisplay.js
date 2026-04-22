import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { useLocation } from "react-router-dom";
import BooksGrid from "./BooksGrid";
import { api, SOCKET_URL, accountImageUrl, bookImageUrl } from "../api";

const socket = io(SOCKET_URL);

// ── URL helpers ───────────────────────────────────────────────────────────────
const profileImgUrl = (img) => accountImageUrl(img);
const bookCoverUrl = (img) => {
  return bookImageUrl(img);
};

// ── Color palette ─────────────────────────────────────────────────────────────
const COLORS = [
  ["#1a1a2e", "#16213e"], ["#134e4a", "#0f766e"],
  ["#1e3a5f", "#1d4ed8"], ["#4c1d95", "#7c3aed"],
  ["#831843", "#be185d"], ["#7c2d12", "#c2410c"],
  ["#14532d", "#15803d"], ["#1c3a5e", "#0369a1"],
];
const avatarColor = (name) => COLORS[(name?.charCodeAt(0) || 65) % COLORS.length];
const firstLetter = (name) => name?.trim()?.[0]?.toUpperCase() || "?";
const passportH = (w) => Math.round(w * (45 / 35));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function getMaskedMobile(mobile) {
  if (!mobile) return "";
  const str = String(mobile).trim();
  if (str.length <= 5) return "•••••";
  return str.slice(0, -5) + "•••••";
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .br-root { font-family: 'Inter', sans-serif; }

  /* ── Outer card ── */
  .br-card {
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 18px;
    padding: 20px 22px;
    margin-bottom: 28px;
    box-shadow: 0 2px 14px rgba(0,0,0,0.06);
    transition: box-shadow 0.25s ease, transform 0.25s ease;
  }
  .br-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.10); transform: translateY(-2px); }

  /* ── Header ── */
  .br-card-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 18px;
  }
  .br-card-title {
    font-size: 11px; font-weight: 600; color: #aaa;
    letter-spacing: 0.1em; text-transform: uppercase;
    display: flex; align-items: center; gap: 7px;
  }
  .br-card-title svg { width: 14px; height: 14px; color: #1a1a2e; }

  .br-action-badge {
    font-size: 11px; font-weight: 700; padding: 4px 13px;
    border-radius: 100px; letter-spacing: 0.05em; text-transform: uppercase;
    animation: brBadgePop 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes brBadgePop { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
  .br-action-badge.borrow { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
  .br-action-badge.return { background: #fdf4ff; color: #9333ea; border: 1px solid #e9d5ff; }

  .br-status-note {
    font-size: 11px;
    font-weight: 600;
    padding: 8px 10px;
    border-radius: 10px;
    margin-bottom: 12px;
    border: 1px solid;
  }
  .br-status-note.info {
    color: #1d4ed8;
    background: #eff6ff;
    border-color: #bfdbfe;
  }
  .br-status-note.error {
    color: #b91c1c;
    background: #fef2f2;
    border-color: #fecaca;
  }

  /* ── Idle ── */
  .br-idle { display:flex; flex-direction:column; align-items:center; padding:32px 0 20px; gap:12px; }
  .br-idle-icon { width:62px; height:62px; background:#f5f5f7; border-radius:50%; display:flex; align-items:center; justify-content:center; }
  .br-idle-icon svg { width:28px; height:28px; color:#ccc; }
  .br-idle-text { font-size:13px; color:#bbb; }
  .br-pulse-bar { width:100%; height:2px; background:#f0f0f0; border-radius:100px; overflow:hidden; margin-top:12px; }
  .br-pulse-bar-inner { height:100%; width:35%; background:linear-gradient(90deg,#1a1a2e,#4a4a8a); border-radius:100px; animation:brPulse 1.6s ease-in-out infinite; }
  @keyframes brPulse { 0%{transform:translateX(-100%)} 100%{transform:translateX(380%)} }

  /* ── Two-column result layout ── */
  .br-result {
    display: grid;
    grid-template-columns: auto 1px 1fr;
    gap: 0 22px;
    align-items: flex-start;
    animation: brReveal 0.38s cubic-bezier(0.22,1,0.36,1);
  }
  @keyframes brReveal {
    from { opacity:0; transform:translateY(14px) scale(0.98); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  .br-vdivider { width:1px; background:#f0f0f0; border-radius:1px; align-self:stretch; }

  /* ── LEFT: passport photo + identity ── */
  .br-left { display:flex; gap:16px; align-items:flex-start; }

  .br-passport {
    border-radius: 10px; overflow: hidden; flex-shrink: 0;
    border: 2px solid #e4e4e8;
    box-shadow: 0 4px 20px rgba(0,0,0,0.13), 0 0 0 4px rgba(255,255,255,0.9);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; color: #fff;
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
  }
  .br-card:hover .br-passport {
    transform: scale(1.04) rotate(-1deg);
    box-shadow: 0 8px 28px rgba(0,0,0,0.18), 0 0 0 5px rgba(255,255,255,0.95);
  }
  .br-passport img { width:100%; height:100%; object-fit:cover; object-position:center top; display:block; }

  .br-identity { display:flex; flex-direction:column; padding-top:3px; }
  .br-name { font-size:17px; font-weight:700; color:#111; line-height:1.2; margin-bottom:4px; }
  .br-dept { font-size:12px; color:#888; margin-bottom:2px; }
  .br-roll { font-size:11px; color:#bbb; font-weight:500; margin-bottom:14px; }

  .br-mobile-container { cursor: help; }
  .br-mobile-masked { display: inline; letter-spacing: 0.5px; }
  .br-mobile-visible { display: none; }
  .br-mobile-container:hover .br-mobile-masked { display: none; }
  .br-mobile-container:hover .br-mobile-visible { display: inline; }

  /* Books out stat */
  .br-stat-chip {
    display: inline-flex; align-items: center; gap: 6px;
    background: #f7f7f9; border: 1px solid #eeeef2;
    border-radius: 9px; padding: 7px 11px;
    font-size: 12px; font-weight: 600; color: #555;
    width: fit-content; margin-bottom: 10px;
    transition: background 0.15s, transform 0.15s;
    cursor: default;
  }
  .br-stat-chip:hover { background: #ededf5; transform: translateY(-1px); }
  .br-stat-chip span { font-size: 15px; font-weight: 700; color: #111; }

  /* End session button */
  .br-end-btn {
    padding: 9px 18px;
    border: none; border-radius: 10px;
    background: #1a1a2e; color: #fff;
    font-size: 12px; font-weight: 600;
    font-family: 'Inter', sans-serif; cursor: pointer;
    transition: opacity 0.15s, transform 0.12s, box-shadow 0.15s;
    width: 100%;
  }
  .br-end-btn:hover:not(:disabled) { opacity: 0.85; box-shadow: 0 4px 12px rgba(26,26,46,0.3); }
  .br-end-btn:active { transform: scale(0.98); }
  .br-end-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  /* ── RIGHT: books list ── */
  .br-right { display:flex; flex-direction:column; gap:12px; min-width:0; }

  .br-books-label {
    font-size: 10px; font-weight: 600; color: #bbb;
    text-transform: uppercase; letter-spacing: 0.09em;
  }

  /* Book row */
  .br-book-row {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 13px;
    background: #fafafa; border: 1px solid #f0f0f0; border-radius: 12px;
    transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
    animation: brBookIn 0.35s cubic-bezier(0.22,1,0.36,1) both;
    position: relative; overflow: hidden;
  }
  @keyframes brBookIn {
    from { opacity:0; transform:translateX(16px); }
    to   { opacity:1; transform:translateX(0); }
  }
  .br-book-row::before {
    content: '';
    position: absolute; left:0; top:8px; bottom:8px; width:3px;
    border-radius:2px; background:var(--br-accent,#1a1a2e);
    transform: scaleY(0); transform-origin:center;
    transition: transform 0.2s ease;
  }
  .br-book-row:hover { background: #f4f4f8; transform: translateX(4px); box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
  .br-book-row:hover::before { transform: scaleY(1); }

  /* Book cover — passport ratio 35:45 */
  .br-book-cover {
    border-radius: 6px; overflow: hidden; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; color: #fff;
    box-shadow: 2px 3px 10px rgba(0,0,0,0.18);
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .br-book-row:hover .br-book-cover {
    transform: scale(1.06) rotate(-1.5deg);
    box-shadow: 3px 5px 16px rgba(0,0,0,0.25);
  }
  .br-book-cover img { width:100%; height:100%; object-fit:cover; object-position:center top; display:block; }

  .br-book-meta { flex:1; min-width:0; }
  .br-book-title  { font-size:13px; font-weight:600; color:#111; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px; }
  .br-book-author { font-size:11px; color:#888; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .br-book-avail  { font-size:10px; color:#aaa; margin-top:2px; }

  .br-book-genre {
    font-size:10px; font-weight:600; background:#f0f0f5; color:#777;
    padding:3px 9px; border-radius:100px; flex-shrink:0; white-space:nowrap;
  }

  /* Empty state */
  .br-no-books {
    text-align:center; padding:20px 0; color:#ccc; font-size:13px;
    border: 1.5px dashed #eeeef2; border-radius: 12px;
  }

  /* Message */
  .br-message { font-size:12px; color:#888; text-align:center; }

  /* ── Toast ── */
  .br-toast {
    position:fixed; bottom:24px; left:50%;
    transform:translateX(-50%);
    background:#1a1a2e; color:#fff;
    font-size:13px; font-weight:500;
    padding:10px 22px; border-radius:100px;
    box-shadow:0 8px 24px rgba(0,0,0,0.2);
    z-index:999; white-space:nowrap;
    animation:brToastIn 0.25s ease;
  }
  @keyframes brToastIn {
    from{opacity:0;transform:translateX(-50%) translateY(10px)}
    to  {opacity:1;transform:translateX(-50%) translateY(0)}
  }

  .br-section-title { font-size:16px; font-weight:600; color:#111; margin-bottom:16px; }
`;

// ── Icons ──────────────────────────────────────────────────────────────────────
const LibraryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

// ── PassportPhoto ─────────────────────────────────────────────────────────────
function PassportPhoto({ account, width = 88 }) {
  const [err, setErr] = useState(false);
  const [c1, c2] = avatarColor(account?.name);
  const url = profileImgUrl(account?.profile_image);
  const height = passportH(width);
  const fs = Math.round(width * 0.36);

  useEffect(() => { setErr(false); }, [account?.profile_image]);

  return (
    <div
      className="br-passport"
      style={{
        width, height, fontSize: fs,
        background: (url && !err) ? "#d8dce6" : `linear-gradient(135deg,${c1},${c2})`,
      }}
    >
      {(url && !err)
        ? <img src={url} alt={account?.name} onError={() => setErr(true)} />
        : firstLetter(account?.name)
      }
    </div>
  );
}

// ── BookCover ─────────────────────────────────────────────────────────────────
// w=44 → h=57 (35×45mm passport ratio)
function BookCover({ book, width = 44 }) {
  const [err, setErr] = useState(false);
  const [c1, c2] = avatarColor(book?.title || book?.book_id);
  const url = bookCoverUrl(book?.cover_image);
  const height = passportH(width);
  const fs = Math.round(width * 0.38);

  useEffect(() => { setErr(false); }, [book?.cover_image]);

  return (
    <div
      className="br-book-cover"
      style={{
        width, height, fontSize: fs,
        background: (url && !err) ? "#dde0e6" : `linear-gradient(135deg,${c1},${c2})`,
      }}
    >
      {(url && !err)
        ? <img src={url} alt={book?.title} onError={() => setErr(true)} />
        : firstLetter(book?.title || book?.book_id)
      }
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BorrowReturnDisplay() {
  const [accountData, setAccountData] = useState(null);
  const [bookData, setBookData] = useState([]);
  const [message, setMessage] = useState("");
  const [action, setAction] = useState(null);
  const [stopping, setStopping] = useState(false);
  const [toast, setToast] = useState("");
  const [scanMessage, setScanMessage] = useState("");
  const [scanError, setScanError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const abortRef = useRef(null);
  const mountedRef = useRef(true);
  const location = useLocation();

  const sessionAction = location.pathname.includes("return") ? "return" : "borrow";
  const supportsWebNfc = () => typeof window !== "undefined" && "NDEFReader" in window;

  const isValidMemberTag = (text) => {
    if (!text || typeof text !== "string") return false;
    const pattern = /(?:Account|Student) Details\s+Name:\s*(.+?)\s+Department:\s*(.+?)\s+Roll-no:\s*(\w+)(?:\s+Mobile:\s*(\d+))?/i;
    return pattern.test(text.trim());
  };

  const isValidBookTag = (text) => {
    if (!text || typeof text !== "string") return false;
    const pattern = /Book Details\s+book_id:\s*"?.+?"?\s+title:\s*"?.+?"?\s+author:\s*"?.+?"?(?:\s+genre:\s*"?.+?"?)?\s*$/i;
    return pattern.test(text.trim());
  };

  const readNfcText = (messageData) => {
    if (!messageData?.records?.length) return "";

    for (const record of messageData.records) {
      if (record.recordType === "text" && record.data) {
        const decoder = new TextDecoder(record.encoding || "utf-8");
        const value = decoder.decode(record.data).trim();
        if (value) return value;
      }
      if (record.recordType === "url" && record.data) {
        const decoder = new TextDecoder("utf-8");
        const value = decoder.decode(record.data).trim();
        if (value) return value;
      }
    }

    return "";
  };

  const stopNfcScan = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsScanning(false);
  };

  const sendNfcTag = async (tagText) => {
    const validMember = isValidMemberTag(tagText);
    const validBook = isValidBookTag(tagText);

    if (!validMember && !validBook) {
      setScanError("Invalid NFC tag. Expected Account/Student Details or Book Details format.");
      return;
    }

    setIsSending(true);
    setScanError("");
    setScanMessage("Sending scanned NFC data...");

    try {
      const { data } = await api.post("/library", { nfc_data: tagText.trim() });

      if (data?.account || data?.student) {
        setAccountData(data.account || data.student);
        setAction(data.action || sessionAction);
        setBookData([]);
      }

      if (data?.book) {
        const { book_id, title, author, genre, cover_image, available_pieces, total_pieces } = data.book;
        setBookData((prev) => {
          const exists = prev.some((book) => book.book_id === book_id);
          return exists ? prev : [...prev, { book_id, title, author, genre, cover_image, available_pieces, total_pieces }];
        });
      }

      setMessage(data?.message || "NFC data sent successfully.");
      setScanMessage(data?.message || "NFC data sent successfully.");
    } catch (error) {
      setScanError(error?.response?.data?.message || "Failed to send scanned NFC data.");
    } finally {
      if (mountedRef.current) setIsSending(false);
    }
  };

  const startNfcScan = async () => {
    setScanError("");
    setScanMessage("");

    if (!supportsWebNfc()) {
      setScanError("This device/browser does not support Web NFC.");
      return;
    }

    try {
      const ndef = new window.NDEFReader();
      const controller = new AbortController();
      abortRef.current = controller;

      await ndef.scan({ signal: controller.signal });
      setIsScanning(true);
      setScanMessage(`Device scanner is active. Scan ${sessionAction === "borrow" ? "member cards and books" : "member cards and books"}.`);

      ndef.onreadingerror = () => {
        setScanError("NFC tag was detected but could not be read. Try scanning again.");
      };

      ndef.onreading = async ({ message: nfcMessage }) => {
        if (isSending) return;
        const text = readNfcText(nfcMessage);
        if (!text) {
          setScanError("No readable text found in NFC tag.");
          return;
        }

        await sendNfcTag(text);
      };
    } catch (error) {
      setIsScanning(false);
      if (error?.name === "NotAllowedError") {
        setScanError("NFC permission denied. Allow NFC permission and try again.");
      } else if (error?.name !== "AbortError") {
        setScanError(error?.message || "Unable to start NFC scanner.");
      }
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  useEffect(() => {
    mountedRef.current = true;
    socket.on("nfcDataReceived", (data) => {
      if (data.account || data.student) {
        setAccountData(data.account || data.student);
        setAction(data.action || null);
      }
      if (data.book) {
        // Extract only what we need from the book payload
        const { book_id, title, author, genre, cover_image, available_pieces, total_pieces } = data.book;
        setBookData(prev => {
          const exists = prev.some(b => b.book_id === book_id);
          return exists ? prev : [...prev, { book_id, title, author, genre, cover_image, available_pieces, total_pieces }];
        });
      }
      if (!data.account && !data.student && !data.book && data.message?.includes("completed")) {
        setAccountData(null); setBookData([]); setAction(null);
      }
      setMessage(data.message || "");
    });

    const initialize = async () => {
      try {
        await api.post("/library/select-action", { action: sessionAction });
        setAction(sessionAction);
      } catch (error) {
        setScanError(error?.response?.data?.message || "Failed to set library action.");
      }

      if (supportsWebNfc()) {
        await startNfcScan();
      }
    };

    initialize();

    return () => {
      mountedRef.current = false;
      socket.off("nfcDataReceived");
      stopNfcScan();
    };
  }, []);

  const handleStopSession = async () => {
    setStopping(true);
    try {
      const res = await api.post("/library/stop-session");
      showToast(res.data.message || "Session completed.");
      setAccountData(null); setBookData([]); setMessage(""); setAction(null);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to stop session.");
    } finally {
      setStopping(false);
    }
  };

  // accent color for left border of book rows
  const accentColor = action === "return" ? "#9333ea" : "#2563eb";

  return (
    <>
      <style>{styles}</style>
      <div className="br-root">

        <div className="br-card">
          <div className="br-card-header">
            <div className="br-card-title"><LibraryIcon /> Library Session</div>
            {action && (
              <span className={`br-action-badge ${action}`}>
                {action === "borrow" ? "Borrowing" : "Returning"}
              </span>
            )}
          </div>

          {isScanning && !scanError && (
            <div className="br-status-note info">Device scanner is active. Scan a member card, then book tags.</div>
          )}
          {!supportsWebNfc() && (
            <div className="br-status-note error">This device/browser does not support Web NFC.</div>
          )}
          {scanMessage && !scanError && (
            <div className="br-status-note info">{scanMessage}</div>
          )}
          {scanError && (
            <div className="br-status-note error">{scanError}</div>
          )}

          {!accountData ? (
            <div className="br-idle">
              <div className="br-idle-icon"><LibraryIcon /></div>
              <span className="br-idle-text">Device scanner is active…</span>
              <div className="br-pulse-bar"><div className="br-pulse-bar-inner" /></div>
            </div>
          ) : (
            <div className="br-result">

              {/* ── LEFT ── */}
              <div className="br-left">
                <PassportPhoto account={accountData} width={88} />
                <div className="br-identity">
                  <div className="br-name">{accountData.name}</div>
                  <div className="br-dept">{accountData.department}</div>
                  <div className="br-roll">
                    {accountData.roll_no}
                    {accountData.mobile ? (
                      <>
                        {" · "}
                        <span className="br-mobile-container" title="Hover to reveal full number">
                          <span className="br-mobile-masked">{getMaskedMobile(accountData.mobile)}</span>
                          <span className="br-mobile-visible">{accountData.mobile}</span>
                        </span>
                      </>
                    ) : ""}
                  </div>

                  <div className="br-stat-chip">
                    <span>{bookData.length}</span>
                    book{bookData.length !== 1 ? "s" : ""} queued
                  </div>

                  <button
                    className="br-end-btn"
                    onClick={handleStopSession}
                    disabled={stopping || bookData.length === 0}
                  >
                    {stopping ? "Processing…" : `End Session`}
                  </button>
                </div>
              </div>

              <div className="br-vdivider" />

              {/* ── RIGHT ── */}
              <div className="br-right">
                <div className="br-books-label">
                  Books to {action === "borrow" ? "Borrow" : "Return"} ({bookData.length})
                </div>

                {bookData.length === 0 ? (
                  <div className="br-no-books">Scan books to add them…</div>
                ) : (
                  bookData.map((book, i) => (
                    <div
                      key={book.book_id || i}
                      className="br-book-row"
                      style={{ animationDelay: `${i * 0.07}s`, "--br-accent": accentColor }}
                    >
                      <BookCover book={book} width={44} />
                      <div className="br-book-meta">
                        <div className="br-book-title">{book.title}</div>
                        <div className="br-book-author">{book.author}</div>
                        <div className="br-book-avail">
                          {book.available_pieces}/{book.total_pieces} copies available
                        </div>
                      </div>
                      {book.genre && <span className="br-book-genre">{book.genre}</span>}
                    </div>
                  ))
                )}

                {message && <div className="br-message">{message}</div>}
              </div>

            </div>
          )}
        </div>

        <div className="br-section-title">Books Catalogue</div>
        <BooksGrid />

        {toast && <div className="br-toast">{toast}</div>}
      </div>
    </>
  );
}