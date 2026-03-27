import React, { useState, useEffect } from "react";
import axios from "axios";

axios.defaults.baseURL = "http://localhost:5000";

const BASE_COVER_URL = "http://localhost:5000/image/book/";

// ── Build full cover image URL from filename ───────────────────────────────────
function getCoverImageUrl(filename) {
  if (!filename) return null;
  return `${BASE_COVER_URL}${filename}`;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  .bg-root { font-family: 'Inter', sans-serif; }

  /* ── Toolbar ── */
  .bg-toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
    flex-wrap: wrap;
  }

  .bg-search {
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
  .bg-search:focus { border-color: #1a1a2e; }
  .bg-search::placeholder { color: #bbb; }

  .bg-filter {
    padding: 9px 14px;
    border: 1.5px solid #e5e5e5;
    border-radius: 10px;
    font-size: 13px;
    font-family: 'Inter', sans-serif;
    color: #555;
    outline: none;
    background: #fff;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .bg-filter:focus { border-color: #1a1a2e; }

  /* ── Grid ── */
  .bg-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  /* ── Book card ── */
  .bg-card {
    background: #fff;
    border: 1px solid #ebebeb;
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
    display: flex;
    flex-direction: column;
  }

  .bg-card:hover {
    box-shadow: 0 6px 24px rgba(0,0,0,0.09);
    transform: translateY(-3px);
    border-color: #ddd;
  }

  /* Cover image area */
  .bg-cover {
    width: 100%;
    height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }

  .bg-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Letter fallback */
  .bg-cover-letter {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 56px;
    font-weight: 700;
    color: rgba(255,255,255,0.9);
    letter-spacing: -2px;
    user-select: none;
  }

  /* Available badge overlay */
  .bg-avail-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 10px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 100px;
    backdrop-filter: blur(6px);
  }
  .bg-avail-badge.available   { background: rgba(22,163,74,0.85);  color: #fff; }
  .bg-avail-badge.unavailable { background: rgba(225,29,72,0.85);  color: #fff; }
  .bg-avail-badge.low         { background: rgba(234,179,8,0.85);  color: #fff; }

  /* Card body */
  .bg-card-body {
    padding: 14px 14px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .bg-title {
    font-size: 13px;
    font-weight: 600;
    color: #111;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .bg-author {
    font-size: 11px;
    color: #888;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bg-genre-tag {
    display: inline-block;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 100px;
    background: #f0f0f0;
    color: #666;
    margin-top: 4px;
    width: fit-content;
  }

  .bg-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px 12px;
    font-size: 11px;
    color: #aaa;
  }

  .bg-card-footer span { display: flex; align-items: center; gap: 4px; }
  .bg-card-footer svg  { width: 12px; height: 12px; }

  /* ── Empty / Loading ── */
  .bg-empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 48px;
    color: #bbb;
    font-size: 14px;
  }

  /* ── Modal overlay ── */
  .bg-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.3);
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: bgFade 0.2s ease;
  }

  @keyframes bgFade { from { opacity: 0; } to { opacity: 1; } }

  /* ── Modal ── */
  .bg-modal {
    background: #fff;
    border-radius: 18px;
    width: 100%;
    max-width: 520px;
    max-height: 88vh;
    overflow-y: auto;
    box-shadow: 0 24px 64px rgba(0,0,0,0.15);
    animation: bgSlide 0.25s cubic-bezier(0.22,1,0.36,1);
  }

  @keyframes bgSlide { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  /* Modal cover */
  .bg-modal-cover {
    width: 100%;
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 18px 18px 0 0;
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
  }

  .bg-modal-cover img {
    width: 100%; height: 100%;
    object-fit: cover;
  }

  .bg-modal-cover-letter {
    font-size: 80px;
    font-weight: 700;
    color: rgba(255,255,255,0.9);
    letter-spacing: -3px;
    user-select: none;
  }

  /* Modal close */
  .bg-close {
    position: absolute;
    top: 12px; right: 12px;
    background: rgba(0,0,0,0.35);
    border: none;
    width: 32px; height: 32px;
    border-radius: 50%;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    transition: background 0.15s;
  }
  .bg-close:hover { background: rgba(0,0,0,0.55); }

  /* Modal body */
  .bg-modal-body { padding: 20px 24px 28px; }

  .bg-modal-title {
    font-size: 18px;
    font-weight: 700;
    color: #111;
    margin-bottom: 4px;
    line-height: 1.3;
  }

  .bg-modal-author {
    font-size: 13px;
    color: #888;
    margin-bottom: 14px;
  }

  /* Stats row */
  .bg-stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 22px;
  }

  .bg-stat {
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 10px;
    padding: 10px 12px;
    text-align: center;
  }

  .bg-stat-val {
    font-size: 18px;
    font-weight: 700;
    color: #111;
  }

  .bg-stat-key {
    font-size: 10px;
    color: #aaa;
    font-weight: 500;
    margin-top: 2px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  /* Section title */
  .bg-section-title {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #bbb;
    margin-bottom: 10px;
  }

  /* Borrower rows */
  .bg-borrower-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 10px;
    margin-bottom: 8px;
    font-size: 13px;
  }

  .bg-borrower-roll {
    font-weight: 600;
    color: #111;
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .bg-borrower-roll svg { width: 13px; height: 13px; color: #bbb; }

  .bg-due-tag {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: 100px;
  }

  .bg-due-tag.overdue  { background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; }
  .bg-due-tag.due-soon { background: #fefce8; color: #ca8a04; border: 1px solid #fef08a; }
  .bg-due-tag.ok       { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

  .bg-no-borrowers { font-size: 13px; color: #bbb; }
`;

// ── Cover color palette (based on first char code) ───────────────────────────
const COLORS = [
  ["#1a1a2e", "#16213e"],
  ["#134e4a", "#0f766e"],
  ["#1e3a5f", "#1d4ed8"],
  ["#4c1d95", "#7c3aed"],
  ["#831843", "#be185d"],
  ["#7c2d12", "#c2410c"],
  ["#14532d", "#15803d"],
  ["#1e3a5f", "#0369a1"],
];

function coverColor(title) {
  const idx = (title?.charCodeAt(0) || 65) % COLORS.length;
  return COLORS[idx];
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function dueStatus(due_date) {
  if (!due_date) return "ok";
  const diff = Math.ceil((new Date(due_date) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return "overdue";
  if (diff <= 3) return "due-soon";
  return "ok";
}

function dueLabel(due_date) {
  if (!due_date) return "—";
  const diff = Math.ceil((new Date(due_date) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Due today";
  return `Due ${formatDate(due_date)}`;
}

function availStatus(book) {
  if (book.available_pieces === 0)                                    return "unavailable";
  if (book.available_pieces <= Math.ceil(book.total_pieces / 3))     return "low";
  return "available";
}

function availLabel(book) {
  if (book.available_pieces === 0) return "Unavailable";
  if (book.available_pieces <= Math.ceil(book.total_pieces / 3)) return `Only ${book.available_pieces} left`;
  return `${book.available_pieces} Available`;
}

// ── BookCover component ───────────────────────────────────────────────────────
// Builds full URL from filename; falls back to first letter of title on error/missing
function BookCover({ title, src, letterSize = 56 }) {
  const [imgError, setImgError] = useState(false);
  const colors  = coverColor(title);
  const letter  = title?.trim()?.[0]?.toUpperCase() || "?";
  const imageUrl = getCoverImageUrl(src);

  // Reset error when a different book is shown
  useEffect(() => { setImgError(false); }, [src]);

  if (imageUrl && !imgError) {
    return (
      <img
        src={imageUrl}
        alt={title}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: letterSize,
        fontWeight: 700,
        color: "rgba(255,255,255,0.9)",
        letterSpacing: "-2px",
        userSelect: "none",
      }}
    >
      {letter}
    </div>
  );
}

// ── Book Detail Modal ─────────────────────────────────────────────────────────
function BookModal({ book, onClose }) {
  const colors = coverColor(book?.title || "");

  if (!book) return null;

  return (
    <div className="bg-overlay" onClick={onClose}>
      <div className="bg-modal" onClick={e => e.stopPropagation()}>

        {/* Cover */}
        <div
          className="bg-modal-cover"
          style={!getCoverImageUrl(book.cover_image) ? { background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` } : {}}
        >
          <BookCover title={book.title} src={book.cover_image} letterSize={80} />
          <button className="bg-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="bg-modal-body">
          {/* Title / Author */}
          <div className="bg-modal-title">{book.title}</div>
          <div className="bg-modal-author">
            by {book.author}
            {book.genre && <> · <span style={{ color: "#aaa" }}>{book.genre}</span></>}
          </div>

          {/* Stats */}
          <div className="bg-stats-row">
            <div className="bg-stat">
              <div className="bg-stat-val">{book.total_pieces}</div>
              <div className="bg-stat-key">Total</div>
            </div>
            <div className="bg-stat">
              <div className="bg-stat-val" style={{ color: book.available_pieces === 0 ? "#e11d48" : "#16a34a" }}>
                {book.available_pieces}
              </div>
              <div className="bg-stat-key">Available</div>
            </div>
            <div className="bg-stat">
              <div className="bg-stat-val">{(book.borrowed_by || []).length}</div>
              <div className="bg-stat-key">Borrowed</div>
            </div>
          </div>

          {/* Borrowers */}
          <div className="bg-section-title">
            Current Borrowers ({(book.borrowed_by || []).length})
          </div>

          {(book.borrowed_by || []).length > 0 ? (
            book.borrowed_by.map((b, i) => (
              <div key={i} className="bg-borrower-row">
                <span className="bg-borrower-roll">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  {b.roll_no}
                </span>
                <span className={`bg-due-tag ${dueStatus(b.due_date)}`}>
                  {dueLabel(b.due_date)}
                </span>
              </div>
            ))
          ) : (
            <div className="bg-no-borrowers">No one has borrowed this book.</div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── BooksGrid ─────────────────────────────────────────────────────────────────
export default function BooksGrid() {
  const [books,    setBooks]    = useState([]);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    axios.get("/book")
      .then(res => setBooks(res.data.books || []))
      .catch(err => console.error("Failed to fetch books", err))
      .finally(() => setLoading(false));
  }, []);

  // Collect unique genres for filter dropdown
  const genres = ["all", ...new Set(books.map(b => b.genre).filter(Boolean))];

  const filtered = books.filter(b => {
    const matchSearch =
      !search ||
      b.title?.toLowerCase().includes(search.toLowerCase()) ||
      b.author?.toLowerCase().includes(search.toLowerCase()) ||
      b.book_id?.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === "all"         ? true :
      filter === "available"   ? b.available_pieces > 0 :
      filter === "unavailable" ? b.available_pieces === 0 :
      b.genre === filter;

    return matchSearch && matchFilter;
  });

  return (
    <>
      <style>{styles}</style>
      <div className="bg-root">

        {/* Toolbar */}
        <div className="bg-toolbar">
          <input
            className="bg-search"
            type="text"
            placeholder="Search by title, author or book ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="bg-filter"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
            {genres.filter(g => g !== "all").map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        <div className="bg-grid">
          {loading && <div className="bg-empty">Loading books…</div>}

          {!loading && filtered.length === 0 && (
            <div className="bg-empty">No books found.</div>
          )}

          {!loading && filtered.map(book => {
            const status = availStatus(book);
            return (
              <div key={book.book_id} className="bg-card" onClick={() => setSelected(book)}>

                {/* Cover — passes raw filename; BookCover builds the URL */}
                <div className="bg-cover">
                  <BookCover title={book.title} src={book.cover_image} />
                  <span className={`bg-avail-badge ${status}`}>
                    {availLabel(book)}
                  </span>
                </div>

                {/* Body */}
                <div className="bg-card-body">
                  <div className="bg-title">{book.title}</div>
                  <div className="bg-author">{book.author}</div>
                  {book.genre && <span className="bg-genre-tag">{book.genre}</span>}
                </div>

                {/* Footer */}
                <div className="bg-card-footer">
                  <span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                    {book.available_pieces}/{book.total_pieces} copies
                  </span>
                  <span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    {(book.borrowed_by || []).length} borrowed
                  </span>
                </div>

              </div>
            );
          })}
        </div>

        {/* Modal */}
        {selected && (
          <BookModal book={selected} onClose={() => setSelected(null)} />
        )}

      </div>
    </>
  );
}