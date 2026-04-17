import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MembersGrid from "../components/MembersGrid";
import BooksGrid from "../components/BooksGrid";
import { api } from "../api";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .home-root { 
    font-family: 'Inter', sans-serif; 
    background: #f7f7f8; 
    min-height: 100vh;
    padding: 16px; /* Added padding to prevent edges touching on smaller screens */
  }

  /* ── Quick actions ── */
  .home-actions {
    display: grid;
    /* Responsive grid: creates columns automatically based on screen width */
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 14px;
    margin-bottom: 28px;
  }

  .action-card {
    background: #fff;
    border: 1px solid #ebebeb;
    border-radius: 14px;
    padding: 18px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 14px;
    transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
  }

  .action-card:hover {
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    transform: translateY(-2px);
    border-color: #ddd;
  }

  .action-icon {
    width: 42px; height: 42px;
    border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .action-icon svg { width: 20px; height: 20px; }

  .action-label { font-size: 13px; font-weight: 600; color: #111; }
  .action-sub   { font-size: 11px; color: #999; margin-top: 2px; }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Tab bar ── */
  .home-tabs {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 18px;
    background: #fff;
    border: 1px solid #ebebeb;
    border-radius: 12px;
    padding: 4px;
    width: fit-content;
  }

  .home-tab {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 18px;
    border: none;
    border-radius: 9px;
    font-size: 13px;
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    color: #888;
    background: transparent;
  }

  .home-tab svg { width: 15px; height: 15px; }

  .home-tab.active {
    background: #1a1a2e;
    color: #fff;
    font-weight: 600;
  }

  .home-tab:not(.active):hover { background: #f5f5f5; color: #333; }

  /* ── Responsive adjustments for mobile devices ── */
  @media (max-width: 600px) {
    .home-root {
      padding: 12px;
    }
    
    .home-actions {
      grid-template-columns: 1fr; /* Stack cards vertically on phones */
    }

    .home-tabs {
      width: 100%; /* Tabs take full width on mobile */
      justify-content: space-between;
    }

    .home-tab {
      flex: 1; /* Make both tabs equal width */
      justify-content: center;
    }
  }
`;

const actions = [
  {
    label: "Attendance", sub: "Mark or view",
    path: "/attendance", action: null,
    bg: "#f0fdf4", color: "#16a34a",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    label: "Borrow Book", sub: "Issue to member",
    path: "/borrow-book", action: "borrow",
    bg: "#eff6ff", color: "#2563eb",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    label: "Return Book", sub: "Process return",
    path: "/return-book", action: "return",
    bg: "#fdf4ff", color: "#9333ea",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.45" />
      </svg>
    ),
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("members");
  const [loading, setLoading] = useState(null); // tracks which card is loading

  const handleActionClick = async (a) => {
    // Attendance needs no API call — navigate directly
    if (!a.action) {
      navigate(a.path);
      return;
    }

    setLoading(a.action);
    try {
      await api.post("/library/select-action", { action: a.action });
      navigate(a.path);
    } catch (err) {
      console.error("Failed to set action:", err);
      alert(err?.response?.data?.message || "Failed to set action. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="home-root">

        {/* ── Quick Actions ── */}
        <div className="home-actions">
          {actions.map((a) => (
            <div
              key={a.label}
              className={`action-card${loading === a.action && a.action ? " loading" : ""}`}
              onClick={() => !loading && handleActionClick(a)}
              style={{ opacity: loading && loading !== a.action ? 0.5 : 1, cursor: loading ? "wait" : "pointer" }}
            >
              <div className="action-icon" style={{ background: a.bg, color: a.color }}>
                {loading === a.action && a.action ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 0.8s linear infinite" }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : a.icon}
              </div>
              <div>
                <div className="action-label">{a.label}</div>
                <div className="action-sub">
                  {loading === a.action && a.action ? "Setting up…" : a.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tab switcher ── */}
        <div className="home-tabs">
          <button
            className={`home-tab ${tab === "members" ? "active" : ""}`}
            onClick={() => setTab("members")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Members
          </button>
          <button
            className={`home-tab ${tab === "books" ? "active" : ""}`}
            onClick={() => setTab("books")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Books
          </button>
        </div>

        {/* ── Tab content ── */}
        {tab === "members" ? <MembersGrid /> : <BooksGrid />}

      </div>
    </>
  );
}