import React, { useState, useEffect, useMemo } from "react";
import { api, accountImageUrl } from "../api";

// ── Build full profile image URL from filename ─────────────────────────────────
function getProfileImageUrl(filename) {
  return accountImageUrl(filename);
}

// ── Color palette (Expanded to 16 pairs for more variety) ──────────────────────
const COLORS = [
  ["#1a1a2e", "#16213e"], // Deep Navy
  ["#134e4a", "#0f766e"], // Teal
  ["#1e3a5f", "#1d4ed8"], // Royal Blue
  ["#4c1d95", "#7c3aed"], // Violet
  ["#831843", "#be185d"], // Rose
  ["#7c2d12", "#c2410c"], // Rust
  ["#14532d", "#15803d"], // Forest Green
  ["#1c3a5e", "#0369a1"], // Ocean Blue
  ["#581c87", "#9333ea"], // Purple
  ["#9f1239", "#e11d48"], // Crimson
  ["#3f6212", "#65a30d"], // Olive
  ["#0f172a", "#334155"], // Slate
  ["#701a75", "#a21caf"], // Fuchsia
  ["#064e3b", "#059669"], // Emerald
  ["#78350f", "#b45309"], // Amber
  ["#312e81", "#4f46e5"], // Indigo
];

// String hashing for better randomization
function avatarColor(name) {
  if (!name) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function firstLetter(name) {
  return name?.trim()?.[0]?.toUpperCase() || "?";
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// Helper to mask only the last 5 digits
function getMaskedMobile(mobile) {
  if (!mobile) return "—";
  const str = String(mobile).trim();
  if (str.length <= 5) return "•••••";
  return str.slice(0, -5) + "•••••";
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  .mg-root { font-family: 'Inter', sans-serif; }

  /* ── Toolbar ── */
  .mg-toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
    flex-wrap: wrap;
  }

  .mg-search {
    flex: 1;
    min-width: 200px;
    padding: 9px 14px;
    border: 1.5px solid #e5e5e5;
    border-radius: 10px;
    font-size: 13px;
    font-family: 'Inter', sans-serif;
    color: #111;
    outline: none;
    background: #fff;
    transition: border-color 0.15s;
  }
  .mg-search:focus { border-color: #1a1a2e; }
  .mg-search::placeholder { color: #bbb; }

  /* ── Hidden scroll container ── */
  .mg-scroll {
    overflow-y: auto;
    max-height: calc(100vh - 280px);
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .mg-scroll::-webkit-scrollbar {
    display: none;
  }

  /* ── Grid ── */
  .mg-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
    padding-bottom: 16px;
  }

  /* ── Card ── */
  .mg-card {
    background: #fff;
    border: 1px solid #ebebeb;
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
  }
  .mg-card:hover {
    box-shadow: 0 6px 24px rgba(0,0,0,0.09);
    transform: translateY(-3px);
    border-color: #ddd;
  }

  .mg-card-banner {
    height: 64px;
    width: 100%;
    flex-shrink: 0;
  }

  .mg-card-top {
    padding: 0 16px 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    border-bottom: 1px solid #f5f5f5;
    margin-top: -32px;
  }

  .mg-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: 3px solid #fff;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }

  .mg-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .mg-name {
    font-size: 14px;
    font-weight: 600;
    color: #111;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .mg-dept {
    font-size: 11px;
    color: #999;
    font-weight: 500;
  }

  .mg-badge {
    display: inline-flex;
    align-items: center;
    font-size: 10px;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: 100px;
    margin-top: 7px;
  }
  .mg-badge.admin  { background: #1a1a2e; color: #fff; }
  .mg-badge.member { background: #f0f0f0; color: #666; }

  .mg-card-bottom {
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .mg-info-row {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    color: #666;
  }
  .mg-info-row svg {
    width: 13px;
    height: 13px;
    color: #bbb;
    flex-shrink: 0;
  }

  /* ── Mobile Masking Styles ── */
  .mg-mobile-container {
    cursor: help;
  }
  .mg-mobile-masked {
    display: inline;
    letter-spacing: 0.5px;
  }
  .mg-mobile-visible {
    display: none;
  }
  .mg-mobile-container:hover .mg-mobile-masked {
    display: none;
  }
  .mg-mobile-container:hover .mg-mobile-visible {
    display: inline;
  }

  /* ── Empty / loading ── */
  .mg-empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 48px;
    color: #bbb;
    font-size: 14px;
  }

  /* ── Modal overlay ── */
  .mg-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.35);
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: mgFade 0.2s ease;
  }
  @keyframes mgFade { from { opacity: 0; } to { opacity: 1; } }

  /* ── Modal ── */
  .mg-modal {
    background: #fff;
    border-radius: 18px;
    width: 100%;
    max-width: 520px;
    max-height: 88vh;
    overflow-y: auto;
    -ms-overflow-style: none;
    scrollbar-width: none;
    box-shadow: 0 24px 64px rgba(0,0,0,0.18);
    animation: mgSlide 0.25s cubic-bezier(0.22,1,0.36,1);
  }
  .mg-modal::-webkit-scrollbar { display: none; }
  @keyframes mgSlide {
    from { transform: translateY(24px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  /* Modal hero */
  .mg-modal-hero {
    height: 110px;
    width: 100%;
    border-radius: 18px 18px 0 0;
    position: relative;
    display: flex;
    align-items: flex-end;
    padding: 0 24px;
    flex-shrink: 0;
  }

  .mg-modal-avatar {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    border: 4px solid #fff;
    margin-bottom: -22px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    font-weight: 700;
    color: #fff;
    overflow: hidden;
    box-shadow: 0 4px 14px rgba(0,0,0,0.2);
    flex-shrink: 0;
  }
  .mg-modal-avatar img { width: 100%; height: 100%; object-fit: cover; }

  .mg-close {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(0,0,0,0.25);
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    transition: background 0.15s;
  }
  .mg-close:hover { background: rgba(0,0,0,0.5); }

  .mg-modal-info {
    padding: 30px 24px 6px;
  }
  .mg-modal-title { font-size: 18px; font-weight: 700; color: #111; }
  .mg-modal-sub   { font-size: 13px; color: #888; margin-top: 3px; }

  .mg-modal-body  { padding: 16px 24px 28px; }

  .mg-section       { margin-bottom: 24px; }
  .mg-section-title {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #bbb;
    margin-bottom: 12px;
  }

  .mg-detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .mg-detail-item {
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 10px;
    padding: 10px 12px;
  }
  .mg-detail-key { font-size: 11px; color: #aaa; margin-bottom: 3px; font-weight: 500; }
  .mg-detail-val { font-size: 13px; font-weight: 600; color: #111; }

  .mg-attend-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .mg-attend-pill {
    font-size: 11px;
    font-weight: 500;
    background: #f0fdf4;
    color: #16a34a;
    border: 1px solid #bbf7d0;
    padding: 4px 10px;
    border-radius: 100px;
  }

  .mg-empty-text { font-size: 13px; color: #bbb; }

  .mg-book-card {
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 10px;
    padding: 12px 14px;
    margin-bottom: 8px;
  }
  .mg-book-title { font-size: 13px; font-weight: 600; color: #111; margin-bottom: 4px; }
  .mg-book-meta  {
    font-size: 12px;
    color: #888;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .mg-fine-tag {
    display: inline-block;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 100px;
    margin-top: 6px;
  }
  .mg-fine-tag.has-fine { background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; }
  .mg-fine-tag.no-fine  { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

  .mg-total-fine {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-radius: 10px;
    margin-top: 10px;
    font-size: 13px;
    font-weight: 600;
  }
  .mg-total-fine.dirty { background: #fff1f2; border: 1px solid #fecdd3; color: #e11d48; }
  .mg-total-fine.clean { background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; }
`;

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, src, size = 64, fontSize = 26, borderSize = 3, colorPair }) {
  const [imgError, setImgError] = useState(false);
  const [c1, c2] = colorPair || avatarColor(name);

  useEffect(() => { setImgError(false); }, [src]);
  const imageUrl = getProfileImageUrl(src);

  return (
    <div
      className="mg-avatar"
      style={{
        width: size,
        height: size,
        fontSize,
        border: `${borderSize}px solid #fff`,
        background: (imageUrl && !imgError)
          ? "#f0f0f0"
          : `linear-gradient(135deg, ${c1}, ${c2})`,
      }}
    >
      {(imageUrl && !imgError) ? (
        <img
          src={imageUrl}
          alt={name}
          onError={() => setImgError(true)}
        />
      ) : (
        firstLetter(name)
      )}
    </div>
  );
}

// ── Modal Avatar ──────────────────────────────────────────────────────────────
function ModalAvatar({ name, src, colorPair }) {
  const [imgError, setImgError] = useState(false);
  const [c1, c2] = colorPair || avatarColor(name);

  useEffect(() => { setImgError(false); }, [src]);
  const imageUrl = getProfileImageUrl(src);

  return (
    <div
      className="mg-modal-avatar"
      style={{
        background: (imageUrl && !imgError)
          ? "#f0f0f0"
          : `linear-gradient(135deg, ${c2}, ${c1})`,
      }}
    >
      {(imageUrl && !imgError) ? (
        <img
          src={imageUrl}
          alt={name}
          onError={() => setImgError(true)}
        />
      ) : (
        firstLetter(name)
      )}
    </div>
  );
}

// ── Member Modal ──────────────────────────────────────────────────────────────
function MemberModal({ member, onClose }) {
  if (!member) return null;

  const [c1, c2] = member.colorPair || avatarColor(member?.name);
  const recentAttendance = [...(member.attendance || [])]
    .sort((a, b) => new Date(b) - new Date(a))
    .slice(0, 10);

  return (
    <div className="mg-overlay" onClick={onClose}>
      <div className="mg-modal" onClick={e => e.stopPropagation()}>

        {/* Gradient hero */}
        <div
          className="mg-modal-hero"
          style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
        >
          <ModalAvatar name={member.name} src={member.profile_image} colorPair={[c1, c2]} />

          <button className="mg-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Name */}
        <div className="mg-modal-info">
          <div className="mg-modal-title">{member.name}</div>
          <div className="mg-modal-sub">{member.department} · {member.roll_no}</div>
        </div>

        <div className="mg-modal-body">

          {/* Basic Info */}
          <div className="mg-section">
            <div className="mg-section-title">Basic Info</div>
            <div className="mg-detail-grid">
              <div className="mg-detail-item">
                <div className="mg-detail-key">Roll No</div>
                <div className="mg-detail-val">{member.roll_no || "—"}</div>
              </div>
              <div className="mg-detail-item">
                <div className="mg-detail-key">Mobile</div>
                <div className="mg-detail-val">
                  {member.mobile ? (
                    <span className="mg-mobile-container" title="Hover to reveal full number">
                      <span className="mg-mobile-masked">{getMaskedMobile(member.mobile)}</span>
                      <span className="mg-mobile-visible">{member.mobile}</span>
                    </span>
                  ) : "—"}
                </div>
              </div>
              <div className="mg-detail-item">
                <div className="mg-detail-key">Department</div>
                <div className="mg-detail-val">{member.department || "—"}</div>
              </div>
              <div className="mg-detail-item">
                <div className="mg-detail-key">Attendance Days</div>
                <div className="mg-detail-val">{member.no_of_days ?? 0} days</div>
              </div>
            </div>
          </div>

          {/* Attendance */}
          <div className="mg-section">
            <div className="mg-section-title">
              Recent Attendance ({recentAttendance.length})
            </div>
            {recentAttendance.length > 0 ? (
              <div className="mg-attend-wrap">
                {recentAttendance.map((d, i) => (
                  <span key={i} className="mg-attend-pill">{formatDate(d)}</span>
                ))}
              </div>
            ) : (
              <span className="mg-empty-text">No attendance records</span>
            )}
          </div>

          {/* Borrowed Books */}
          <div className="mg-section">
            <div className="mg-section-title">
              Borrowed Books ({(member.borrowed_books || []).length})
            </div>
            {(member.borrowed_books || []).length > 0 ? (
              <>
                {member.borrowed_books.map((book, i) => (
                  <div key={i} className="mg-book-card">
                    <div className="mg-book-title">{book.title || book.book_id}</div>
                    <div className="mg-book-meta">
                      <span>Borrowed: {formatDate(book.borrowed_date)}</span>
                      <span>Due: {formatDate(book.due_date)}</span>
                    </div>
                    <span className={`mg-fine-tag ${book.fine > 0 ? "has-fine" : "no-fine"}`}>
                      {book.fine > 0 ? `Fine: ₹${book.fine}` : "No fine"}
                    </span>
                  </div>
                ))}
                <div className={`mg-total-fine ${member.total_fine > 0 ? "dirty" : "clean"}`}>
                  <span>Total Fine</span>
                  <span>₹{member.total_fine ?? 0}</span>
                </div>
              </>
            ) : (
              <span className="mg-empty-text">No books borrowed</span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ── MembersGrid ───────────────────────────────────────────────────────────────
export default function MembersGrid() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/account")
      .then(res => setMembers(res.data.accounts || []))
      .catch(err => console.error("Failed to fetch members:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return members.filter(m =>
      !search ||
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.roll_no?.toLowerCase().includes(search.toLowerCase()) ||
      m.department?.toLowerCase().includes(search.toLowerCase())
    );
  }, [members, search]);

  const displayMembers = useMemo(() => {
    let prevColorIdx = -1;
    return filtered.map(member => {
      let str = (member.name || "") + (member.roll_no || "");
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }

      let colorIdx = Math.abs(hash) % COLORS.length;

      if (colorIdx === prevColorIdx) {
        colorIdx = (colorIdx + 1) % COLORS.length;
      }

      prevColorIdx = colorIdx;
      return { ...member, colorPair: COLORS[colorIdx] };
    });
  }, [filtered]);

  return (
    <>
      <style>{styles}</style>
      <div className="mg-root">

        {/* Search */}
        <div className="mg-toolbar">
          <input
            className="mg-search"
            type="text"
            placeholder="Search by name, roll no or department…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Scrollable grid */}
        <div className="mg-scroll">
          <div className="mg-grid">

            {loading && (
              <div className="mg-empty">Loading members…</div>
            )}

            {!loading && displayMembers.length === 0 && (
              <div className="mg-empty">No members found.</div>
            )}

            {!loading && displayMembers.map((member) => {
              const [c1, c2] = member.colorPair;
              return (
                <div
                  key={member.roll_no}
                  className="mg-card"
                  onClick={() => setSelected(member)}
                >
                  {/* Gradient banner */}
                  <div
                    className="mg-card-banner"
                    style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                  />

                  {/* Avatar + name */}
                  <div className="mg-card-top">
                    <Avatar name={member.name} src={member.profile_image} colorPair={[c1, c2]} />
                    <div className="mg-name">{member.name}</div>
                    <div className="mg-dept">{member.department}</div>
                    <span className={`mg-badge ${member.is_admin ? "admin" : "member"}`}>
                      {member.is_admin ? "Admin" : "Member"}
                    </span>
                  </div>

                  {/* Info rows */}
                  <div className="mg-card-bottom">
                    <div className="mg-info-row">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      {member.roll_no}
                    </div>
                    <div className="mg-info-row">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8 9a16 16 0 0 0 6 6l.36-.81a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      {member.mobile ? (
                        <span className="mg-mobile-container" title="Hover to reveal full number">
                          <span className="mg-mobile-masked">{getMaskedMobile(member.mobile)}</span>
                          <span className="mg-mobile-visible">{member.mobile}</span>
                        </span>
                      ) : "—"}
                    </div>
                    <div className="mg-info-row">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                      {(member.borrowed_books || []).length} book(s) borrowed
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Detail modal */}
        {selected && (
          <MemberModal
            member={selected}
            onClose={() => setSelected(null)}
          />
        )}

      </div>
    </>
  );
}