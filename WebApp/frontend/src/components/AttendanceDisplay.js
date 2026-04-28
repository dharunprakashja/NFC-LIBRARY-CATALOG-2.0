import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import MembersGrid from './MembersGrid';
import { SOCKET_URL, accountImageUrl, api } from '../api';

const socket = io(SOCKET_URL);

const profileImgUrl = (img) => accountImageUrl(img);

const COLORS = [
  ["#1a1a2e", "#16213e"], ["#134e4a", "#0f766e"],
  ["#1e3a5f", "#1d4ed8"], ["#4c1d95", "#7c3aed"],
  ["#831843", "#be185d"], ["#7c2d12", "#c2410c"],
  ["#14532d", "#15803d"], ["#1c3a5e", "#0369a1"],
];
const avatarColor = (name) => COLORS[(name?.charCodeAt(0) || 65) % COLORS.length];
const firstLetter = (name) => name?.trim()?.[0]?.toUpperCase() || "?";
const passportH = (w) => Math.round(w * (45 / 35));
const daysLeft = (due) => due ? Math.ceil((new Date(due) - new Date()) / 86400000) : null;
const dueClass = (due) => { const d = daysLeft(due); return d === null ? "ok" : d < 0 ? "over" : d <= 3 ? "soon" : "ok"; };
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—";
const dueLabel = (due) => {
  const d = daysLeft(due);
  if (d === null) return "—";
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d === 0) return "Due today";
  return `Due ${fmtDate(due)}`;
};

function getMaskedMobile(mobile) {
  if (!mobile) return "";
  const str = String(mobile).trim();
  if (str.length <= 5) return "•••••";
  return str.slice(0, -5) + "•••••";
}

// ── Live clock hook ───────────────────────────────────────────────────────────
function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .at-root { font-family: 'Inter', sans-serif; width: 100%; }

  /* ── Outer card ── */
  .at-card {
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 18px;
    padding: 20px 22px;
    margin-bottom: 28px;
    box-shadow: 0 2px 14px rgba(0,0,0,0.06);
    transition: box-shadow 0.25s ease, transform 0.25s ease;
  }
  .at-card:hover {
    box-shadow: 0 8px 32px rgba(0,0,0,0.10);
    transform: translateY(-2px);
  }

  .at-card-title {
    font-size: 11px; font-weight: 600; color: #aaa;
    letter-spacing: 0.1em; text-transform: uppercase;
    margin-bottom: 16px;
    display: flex; align-items: center; gap: 7px;
  }
  .at-nfc-note {
    font-size: 11px;
    font-weight: 600;
    padding: 8px 10px;
    border-radius: 10px;
    margin-bottom: 12px;
    border: 1px solid;
  }
  .at-nfc-note.info {
    color: #1d4ed8;
    background: #eff6ff;
    border-color: #bfdbfe;
  }
  .at-nfc-note.error {
    color: #b91c1c;
    background: #fef2f2;
    border-color: #fecaca;
  }
  .at-card-title svg { width: 14px; height: 14px; color: #1a1a2e; }
  .at-device-pill {
    margin-left: auto;
    font-size: 11px;
    font-weight: 600;
    border: 1px solid;
    padding: 4px 10px;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .at-device-pill.connected {
    background: #ecfdf3;
    color: #15803d;
    border-color: #bbf7d0;
  }
  .at-device-pill.disconnected {
    background: #fef2f2;
    color: #b91c1c;
    border-color: #fecaca;
  }

  /* ── Idle ── */
  .at-idle {
    display: flex; flex-direction: column; align-items: center;
    padding: 32px 0 20px; gap: 12px;
  }
  .at-idle-ring {
    width: 62px; height: 62px; border-radius: 50%;
    background: #f5f5f7; display: flex; align-items: center; justify-content: center;
  }
  .at-idle-ring svg { width: 28px; height: 28px; color: #ccc; }
  .at-idle-text { font-size: 13px; color: #bbb; text-align: center; }
  .at-pulse-bar { width:100%; height:2px; background:#f0f0f0; border-radius:100px; overflow:hidden; margin-top:12px; }
  .at-pulse-bar-inner {
    height:100%; width:35%;
    background: linear-gradient(90deg,#1a1a2e,#4a4a8a);
    border-radius:100px; animation: atPulse 1.6s ease-in-out infinite;
  }
  @keyframes atPulse { 0%{transform:translateX(-100%)} 100%{transform:translateX(380%)} }

  /* ── Result: left | divider | right ── */
  .at-result {
    display: grid;
    grid-template-columns: auto 1px 1fr;
    gap: 0 22px;
    align-items: stretch;
    animation: atReveal 0.38s cubic-bezier(0.22,1,0.36,1);
  }
  @keyframes atReveal {
    from { opacity:0; transform:translateY(14px) scale(0.98); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }

  .at-vdivider { width:1px; background:#f0f0f0; border-radius:1px; }

  /* ── LEFT ── */
  .at-left { display:flex; gap:16px; align-items:flex-start; }

  .at-passport {
    border-radius: 10px; overflow: hidden; flex-shrink: 0;
    border: 2px solid #e4e4e8;
    box-shadow: 0 4px 20px rgba(0,0,0,0.13), 0 0 0 4px rgba(255,255,255,0.9);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; color: #fff;
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
  }
  .at-card:hover .at-passport {
    transform: scale(1.04) rotate(-1deg);
    box-shadow: 0 8px 28px rgba(0,0,0,0.18), 0 0 0 5px rgba(255,255,255,0.95);
  }
  .at-passport img { width:100%; height:100%; object-fit:cover; object-position:center top; display:block; }

  .at-identity { display:flex; flex-direction:column; padding-top:3px; word-break: break-word; }
  .at-name { font-size:17px; font-weight:700; color:#111; line-height:1.2; margin-bottom:4px; }
  .at-dept { font-size:12px; color:#888; margin-bottom:2px; }
  .at-roll { font-size:11px; color:#bbb; font-weight:500; margin-bottom:12px; }

  .at-mobile-container { cursor: help; }
  .at-mobile-masked { display: inline; letter-spacing: 0.5px; }
  .at-mobile-visible { display: none; }
  .at-mobile-container:hover .at-mobile-masked { display: none; }
  .at-mobile-container:hover .at-mobile-visible { display: inline; }

  .at-status {
    display: inline-flex; align-items:center; gap:5px;
    font-size:11px; font-weight:600;
    padding:5px 12px; border-radius:100px; width:fit-content;
    animation: atBadgePop 0.4s 0.2s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes atBadgePop {
    from { opacity:0; transform:scale(0.7); }
    to   { opacity:1; transform:scale(1); }
  }
  .at-status svg { width:11px; height:11px; }
  .at-status.success { background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; }
  .at-status.already { background:#fefce8; color:#ca8a04; border:1px solid #fef08a; }

  /* ── RIGHT ── */
  .at-right {
    display: flex; flex-direction: column; gap: 14px; min-width: 0;
  }

  /* Clock + date pill in top-right */
  .at-clock-row {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
  }
  .at-clock {
    font-size: 26px; font-weight: 700; color: #111;
    letter-spacing: -0.03em; line-height: 1;
  }
  .at-clock-sub { font-size: 11px; color: #aaa; margin-top: 2px; }
  .at-date-pill {
    font-size: 11px; font-weight: 600; color: #555;
    background: #f4f4f7; border: 1px solid #eaeaee;
    padding: 6px 12px; border-radius: 100px;
    white-space: nowrap;
  }

  /* 3 stat tiles */
  .at-stat-row { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
  .at-stat-tile {
    background:#f7f7f9; border:1px solid #eeeef2; border-radius:12px;
    padding:11px 10px; text-align:center; cursor:default;
    transition: background 0.18s, transform 0.18s, box-shadow 0.18s;
    animation: atChipIn 0.4s ease both;
  }
  .at-stat-tile:nth-child(1){animation-delay:0.12s}
  .at-stat-tile:nth-child(2){animation-delay:0.20s}
  .at-stat-tile:nth-child(3){animation-delay:0.28s}
  @keyframes atChipIn {
    from{opacity:0;transform:translateY(8px)}
    to  {opacity:1;transform:translateY(0)}
  }
  .at-stat-tile:hover { background:#ededf5; transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,0.08); }
  .at-tile-val { font-size:20px; font-weight:700; color:#111; line-height:1; }
  .at-tile-key { font-size:9px; font-weight:600; color:#aaa; text-transform:uppercase; letter-spacing:0.08em; margin-top:4px; }

  .at-attendance-block {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  /* Borrowed books mini list */
  .at-books-label {
    font-size:10px; font-weight:600; color:#bbb;
    text-transform:uppercase; letter-spacing:0.09em; margin-bottom:7px;
  }
  .at-book-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:8px 11px; background:#fafafa; border:1px solid #f0f0f0;
    border-radius:9px; margin-bottom:6px;
    transition: background 0.15s, transform 0.15s;
    animation: atChipIn 0.35s ease both;
  }
  .at-book-row:last-child { margin-bottom:0; }
  .at-book-row:hover { background:#f2f2f8; transform:translateX(3px); }
  .at-book-title { font-size:12px; font-weight:600; color:#111; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:55%; }
  .at-book-due {
    font-size:10px; font-weight:600; padding:2px 8px; border-radius:100px; flex-shrink:0;
  }
  .at-book-due.over { background:#fff1f2; color:#e11d48; border:1px solid #fecdd3; }
  .at-book-due.soon { background:#fefce8; color:#ca8a04; border:1px solid #fef08a; }
  .at-book-due.ok   { background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; }

  /* Recent attendance dots */
  .at-attend-label {
    font-size:10px; font-weight:600; color:#bbb;
    text-transform:uppercase; letter-spacing:0.09em; margin-bottom:7px;
  }
  .at-attend-dots { display:flex; gap:5px; flex-wrap:wrap; }
  .at-dot {
    width:22px; height:22px; border-radius:6px;
    display:flex; align-items:center; justify-content:center;
    font-size:9px; font-weight:600;
    transition: transform 0.15s;
    cursor:default;
  }
  .at-dot:hover { transform: scale(1.2); }
  .at-dot.present { background:#1a1a2e; color:#fff; }
  .at-dot.absent  { background:#f3f3f5; color:#ccc; }

  .at-no-data { font-size:12px; color:#ccc; padding:4px 0; }

  /* ── Section title ── */
  .at-section-title { font-size:16px; font-weight:600; color:#111; margin-bottom:16px; }

  /* ── RESPONSIVE STYLES ── */
  @media (max-width: 768px) {
    .at-card {
      padding: 16px;
    }
    .at-result {
      grid-template-columns: 1fr;
      gap: 20px;
    }
    .at-vdivider {
      width: 100%;
      height: 1px;
      margin: 4px 0;
    }
    .at-left {
      align-items: center;
    }
    .at-clock-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    .at-date-pill {
      align-self: flex-start;
    }
    .at-stat-row {
      gap: 6px;
    }
    .at-tile-val {
      font-size: 18px;
    }
    .at-attend-dots {
      gap: 4px;
    }
  }
`;

// ── Icons ──────────────────────────────────────────────────────────────────────
const NfcIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8.32a7.43 7.43 0 0 1 0 7.36" />
    <path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58" />
    <path d="M12.91 4.1a15.91 15.91 0 0 1 .01 15.8" />
    <path d="M16.37 2a20.16 20.16 0 0 1 0 20" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

// ── PassportPhoto ─────────────────────────────────────────────────────────────
function PassportPhoto({ account, width = 96 }) {
  const [imgError, setImgError] = useState(false);
  const [c1, c2] = avatarColor(account?.name);
  const imageUrl = profileImgUrl(account?.profile_image);
  const height = passportH(width);
  const fontSize = Math.round(width * 0.36);

  useEffect(() => { setImgError(false); }, [account?.profile_image]);

  return (
    <div
      className="at-passport"
      style={{
        width, height, fontSize,
        background: (imageUrl && !imgError) ? "#d8dce6" : `linear-gradient(135deg,${c1},${c2})`,
      }}
    >
      {(imageUrl && !imgError)
        ? <img src={imageUrl} alt={account?.name} onError={() => setImgError(true)} />
        : firstLetter(account?.name)
      }
    </div>
  );
}

// ── AttendanceDots — last 14 days ─────────────────────────────────────────────
function AttendanceDots({ dates = [] }) {
  const presentSet = new Set(
    dates.map(d => new Date(d).toDateString())
  );
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d;
  });
  return (
    <div className="at-attend-dots">
      {days.map((d, i) => {
        const present = presentSet.has(d.toDateString());
        return (
          <div
            key={i}
            className={`at-dot ${present ? "present" : "absent"}`}
            title={d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
          >
            {d.getDate()}
          </div>
        );
      })}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AttendanceDisplay() {
  const [nfcData, setNfcData] = useState(null);
  const [scanMessage, setScanMessage] = useState('');
  const [scanError, setScanError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [attendanceDevice, setAttendanceDevice] = useState({
    connected: false,
    port: 'COM11',
  });
  const abortRef = useRef(null);
  const mountedRef = useRef(true);
  const now = useClock();

  const supportsWebNfc = () => typeof window !== 'undefined' && 'NDEFReader' in window;

  const isValidAttendanceTag = (text) => {
    if (!text || typeof text !== 'string') return false;
    const pattern = /(?:Account|Student) Details\s+Name:\s*(.+?)\s+Department:\s*(.+?)\s+Roll-no:\s*(\w+)(?:\s+Mobile:\s*(\d+))?/i;
    return pattern.test(text.trim());
  };

  const readNfcText = (message) => {
    if (!message?.records?.length) return '';

    for (const record of message.records) {
      if (record.recordType === 'text' && record.data) {
        const decoder = new TextDecoder(record.encoding || 'utf-8');
        const value = decoder.decode(record.data).trim();
        if (value) return value;
      }
      if (record.recordType === 'url' && record.data) {
        const decoder = new TextDecoder('utf-8');
        const value = decoder.decode(record.data).trim();
        if (value) return value;
      }
    }

    return '';
  };

  const submitAttendanceFromTag = async (tagText) => {
    if (!isValidAttendanceTag(tagText)) {
      setScanError('Invalid NFC attendance tag. Expected Student/Account Details format.');
      return;
    }

    setIsSending(true);
    setScanError('');
    setScanMessage('Sending attendance to server...');

    try {
      const { data } = await api.post('/attendance', { nfc_data: tagText.trim() });

      if (data?.account || data?.student) {
        setNfcData({
          account: data.account || data.student,
          message: data.message || 'Attendance processed successfully.',
        });
      }

      setScanMessage(data?.message || 'Attendance sent successfully.');
    } catch (error) {
      const serverMessage = error?.response?.data?.message;
      setScanError(serverMessage || 'Failed to send attendance. Check your network and try again.');
    } finally {
      if (mountedRef.current) setIsSending(false);
    }
  };

  const stopNfcScan = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsScanning(false);
  };

  const startNfcScan = async () => {
    setScanError('');
    setScanMessage('');

    if (!supportsWebNfc()) {
      return;
    }

    try {
      const ndef = new window.NDEFReader();
      const controller = new AbortController();
      abortRef.current = controller;

      await ndef.scan({ signal: controller.signal });
      setIsScanning(true);
      setScanMessage('Scanner is active. Tap an attendance NFC tag.');

      ndef.onreadingerror = () => {
        setScanError('NFC tag was detected but could not be read. Try scanning again.');
      };

      ndef.onreading = async ({ message }) => {
        if (isSending) return;

        const text = readNfcText(message);
        if (!text) {
          setScanError('No readable text found in NFC tag.');
          return;
        }

        await submitAttendanceFromTag(text);
      };
    } catch (error) {
      setIsScanning(false);
      if (error?.name === 'NotAllowedError') {
        setScanError('NFC permission denied. Allow NFC permission and try again.');
      } else if (error?.name !== 'AbortError') {
        setScanError(error?.message || 'Unable to start NFC scanner.');
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    socket.on('nfcDataReceived', (data) => {
      if (data.account || data.student) setNfcData(data);
    });

    socket.on('deviceStatus', (status) => {
      if (status?.attendance) {
        setAttendanceDevice(status.attendance);
      }
    });

    api.get('/device-status')
      .then((res) => {
        if (res?.data?.attendance) {
          setAttendanceDevice(res.data.attendance);
        }
      })
      .catch(() => {
        // Live socket updates will still refresh status.
      });

    if (supportsWebNfc()) {
      startNfcScan();
    }

    return () => {
      mountedRef.current = false;
      socket.off('nfcDataReceived');
      socket.off('deviceStatus');
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

  const account = nfcData?.account || nfcData?.student || null;
  const message = nfcData?.message || "";
  const alreadyMarked = message.toLowerCase().includes("already");
  const borrowed = account?.borrowed_books || [];
  const attendance = account?.attendance || [];

  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  return (
    <>
      <style>{styles}</style>
      <div className="at-root">

        <div className="at-card">
          <div className="at-card-title">
            <NfcIcon /> NFC Attendance Scanner
            <span className={`at-device-pill ${attendanceDevice.connected ? 'connected' : 'disconnected'}`}>
              Attendance Device {attendanceDevice.connected ? 'Connected' : 'Disconnected'} ({attendanceDevice.port || 'N/A'})
            </span>
          </div>

          {isScanning && !scanError && (
            <div className="at-nfc-note info">Device scanner is active. Tap an attendance NFC tag.</div>
          )}
          {scanMessage && !scanError && (
            <div className="at-nfc-note info">{scanMessage}</div>
          )}
          {scanError && (
            <div className="at-nfc-note error">{scanError}</div>
          )}

          {!account ? (
            <div className="at-idle">
              <div className="at-idle-ring"><NfcIcon /></div>
              <span className="at-idle-text">Device scanner is active…</span>
              <div className="at-pulse-bar"><div className="at-pulse-bar-inner" /></div>
            </div>
          ) : (
            <div className="at-result">

              {/* ── LEFT: photo + identity ── */}
              <div className="at-left">
                <PassportPhoto account={account} width={96} />
                <div className="at-identity">
                  <div className="at-name">{account.name}</div>
                  <div className="at-dept">{account.department}</div>
                  <div className="at-roll">
                    {account.roll_no}
                    {account.mobile ? (
                      <>
                        {" · "}
                        <span className="at-mobile-container" title="Hover to reveal full number">
                          <span className="at-mobile-masked">{getMaskedMobile(account.mobile)}</span>
                          <span className="at-mobile-visible">{account.mobile}</span>
                        </span>
                      </>
                    ) : ""}
                  </div>
                  <div className={`at-status ${alreadyMarked ? "already" : "success"}`}>
                    {alreadyMarked ? <ClockIcon /> : <CheckIcon />}
                    {alreadyMarked ? "Already marked" : "Marked"}
                  </div>
                </div>
              </div>

              {/* vertical rule */}
              <div className="at-vdivider" />

              {/* ── RIGHT: clock + stats + books + attendance ── */}
              <div className="at-right">

                {/* Live clock + date */}
                <div className="at-clock-row">
                  <div>
                    <div className="at-clock">{timeStr}</div>
                    <div className="at-clock-sub">{dateStr}</div>
                  </div>
                  <div className="at-date-pill">
                    {account.no_of_days ?? 0} days present
                  </div>
                </div>

                {/* Stat tiles */}
                {account.no_of_days !== undefined && (
                  <div className="at-stat-row">
                    <div className="at-stat-tile">
                      <div className="at-tile-val">{account.no_of_days ?? 0}</div>
                      <div className="at-tile-key">Attendance</div>
                    </div>
                    <div className="at-stat-tile">
                      <div className="at-tile-val">{borrowed.length}</div>
                      <div className="at-tile-key">Books Out</div>
                    </div>
                    <div className="at-stat-tile">
                      <div className="at-tile-val" style={{ color: account.total_fine > 0 ? "#e11d48" : "#16a34a" }}>
                        ₹{account.total_fine ?? 0}
                      </div>
                      <div className="at-tile-key">Fine</div>
                    </div>
                  </div>
                )}

                <div className="at-attendance-block">
                  <div className="at-attend-label">Recent Attendance</div>
                  {attendance.length > 0 ? (
                    <AttendanceDots dates={attendance} />
                  ) : (
                    <div className="at-no-data">No attendance records yet.</div>
                  )}
                </div>


              </div>
            </div>
          )}
        </div>

        <div className="at-section-title">All Members</div>
        <MembersGrid />

      </div>
    </>
  );
}