import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountImageUrl } from '../api';

// ── Session helpers ────────────────────────────────────────────────────────────
const session = {
  get: (key) => sessionStorage.getItem(key) || "",
  isAdmin: () => sessionStorage.getItem("is_admin") === "true",
  clear: () => sessionStorage.clear(),
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ab-root { font-family: 'Inter', sans-serif; }

  /* ── Navbar ── */
  .ab-bar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: #fff;
    border-bottom: 1px solid #ebebeb;
    height: 60px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    gap: 12px;
    box-shadow: 0 1px 8px rgba(0,0,0,0.06);
  }

  .ab-menu-btn {
    width: 36px; height: 36px;
    border: none;
    background: #f5f5f5;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #333;
    flex-shrink: 0;
    transition: background 0.15s;
  }
  .ab-menu-btn:hover { background: #ebebeb; }

  .ab-brand {
    font-size: 15px;
    font-weight: 600;
    color: #111;
    flex: 1;
    letter-spacing: -0.01em;
  }

  .ab-brand span {
    font-size: 11px;
    font-weight: 500;
    color: #aaa;
    margin-left: 8px;
    letter-spacing: 0;
  }

  /* Admin badge */
  .ab-admin-badge {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: #1a1a2e;
    color: #fff;
    padding: 3px 9px;
    border-radius: 100px;
  }

  /* Avatar button */
  .ab-avatar-btn {
    width: 36px; height: 36px;
    border-radius: 50%;
    border: 2px solid #ebebeb;
    overflow: hidden;
    cursor: pointer;
    background: #f5f5f5;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.15s;
    position: relative;
  }
  .ab-avatar-btn:hover { border-color: #1a1a2e; }

  .ab-avatar-btn img {
    width: 100%; height: 100%;
    object-fit: cover;
  }

  .ab-avatar-initials {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    text-transform: uppercase;
    user-select: none;
  }

  /* Initials background circle */
  .ab-initials-circle {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(135deg, #1a1a2e, #4a4a8a);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ── Drawer overlay ── */
  .ab-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.25);
    z-index: 200;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  /* ── Drawer ── */
  .ab-drawer {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    width: 270px;
    background: #fff;
    z-index: 201;
    display: flex;
    flex-direction: column;
    box-shadow: 4px 0 24px rgba(0,0,0,0.1);
    animation: slideIn 0.25s cubic-bezier(0.22,1,0.36,1);
  }

  @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }

  .ab-drawer-header {
    padding: 20px 20px 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  .ab-drawer-profile {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .ab-drawer-avatar {
    width: 44px; height: 44px;
    border-radius: 50%;
    background: #f0f0f0;
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #ebebeb;
  }

  .ab-drawer-avatar img { width: 100%; height: 100%; object-fit: cover; }

  .ab-drawer-avatar-initials {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    text-transform: uppercase;
    user-select: none;
  }

  .ab-drawer-initials-circle {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #1a1a2e, #4a4a8a);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ab-drawer-name {
    font-size: 14px;
    font-weight: 600;
    color: #111;
  }

  .ab-drawer-meta {
    font-size: 12px;
    color: #888;
    margin-top: 2px;
  }

  .ab-drawer-roll {
    font-size: 11px;
    color: #bbb;
    margin-top: 1px;
  }

  /* Section label */
  .ab-section-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #ccc;
    padding: 16px 20px 6px;
  }

  /* Nav items */
  .ab-nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 20px;
    font-size: 14px;
    font-weight: 500;
    color: #333;
    cursor: pointer;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    border-radius: 0;
    transition: background 0.12s, color 0.12s;
    font-family: 'Inter', sans-serif;
  }

  .ab-nav-item:hover { background: #f7f7f7; color: #111; }
  .ab-nav-item:hover .ab-nav-icon { color: #1a1a2e; }

  .ab-nav-icon {
    width: 18px; height: 18px;
    color: #aaa;
    flex-shrink: 0;
    transition: color 0.12s;
  }

  .ab-divider {
    height: 1px;
    background: #f0f0f0;
    margin: 8px 0;
  }

  /* Logout */
  .ab-logout-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 20px;
    font-size: 14px;
    font-weight: 500;
    color: #e53e3e;
    cursor: pointer;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    transition: background 0.12s;
    font-family: 'Inter', sans-serif;
    margin-top: auto;
  }

  .ab-logout-item:hover { background: #fff5f5; }

  /* ── Profile dropdown ── */
  .ab-dropdown {
    position: absolute;
    top: 52px;
    right: 16px;
    width: 240px;
    background: #fff;
    border: 1px solid #ebebeb;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    z-index: 300;
    overflow: hidden;
    animation: fadeIn 0.15s ease;
  }

  .ab-dropdown-header {
    padding: 14px 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  .ab-dropdown-name {
    font-size: 14px;
    font-weight: 600;
    color: #111;
  }

  .ab-dropdown-sub {
    font-size: 12px;
    color: #888;
    margin-top: 2px;
  }

  .ab-dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 16px;
    font-size: 13px;
    font-weight: 500;
    color: #333;
    cursor: pointer;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    font-family: 'Inter', sans-serif;
    transition: background 0.12s;
  }

  .ab-dropdown-item:hover { background: #f7f7f7; }

  .ab-dropdown-item.danger { color: #e53e3e; }
  .ab-dropdown-item.danger:hover { background: #fff5f5; }

  .ab-dropdown-item svg {
    width: 15px; height: 15px;
    color: #aaa;
    flex-shrink: 0;
  }

  .ab-dropdown-item.danger svg { color: #e53e3e; }
`;

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const Icons = {
  Menu: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Home: () => (
    <svg className="ab-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Attendance: () => (
    <svg className="ab-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Borrow: () => (
    <svg className="ab-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  Return: () => (
    <svg className="ab-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.45" />
    </svg>
  ),
  Users: () => (
    <svg className="ab-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Books: () => (
    <svg className="ab-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  Reports: () => (
    <svg className="ab-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  ),
  Profile: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Logout: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Fine: () => (
    <svg className="ab-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
};

// ── Get first letter of name ───────────────────────────────────────────────────
function getInitial(name) {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

// ── Avatar Component ───────────────────────────────────────────────────────────
// Shows profile image if available, otherwise shows first letter of name
function Avatar({ name, src, size = 36, fontSize = 15 }) {
  const [imgError, setImgError] = useState(false);
  const initial = getInitial(name);

  // Reset error state if src changes
  useEffect(() => { setImgError(false); }, [src]);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #1a1a2e, #4a4a8a)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize, fontWeight: 700, color: '#fff', userSelect: 'none', letterSpacing: '0.02em' }}>
        {initial}
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const AppBarComponent = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const navigate = useNavigate();

  // Read from sessionStorage
  const name = session.get("name");
  const rollNo = session.get("roll_no");
  const department = session.get("department");
  const isAdmin = session.isAdmin();

  // ── Fetch profile image on mount ───────────────────────────────────────────
  useEffect(() => {
    const storedImage = session.get("profile_image");

    if (!storedImage) {
      setProfileImageUrl(null);
      return;
    }

    const imageUrl = accountImageUrl(storedImage);
    setProfileImageUrl(imageUrl);
  }, []);

  const handleLogout = () => {
    session.clear();
    window.location.assign('/');
  };

  const handleNav = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  // ── Nav items per role ──────────────────────────────────────────────────────
  const userNavItems = [
    { label: 'Home', icon: <Icons.Home />, path: '/' },
    // { label: 'Attendance',  icon: <Icons.Attendance />, path: '/attendance' },
    // { label: 'Borrow Book', icon: <Icons.Borrow />,     path: '/borrow-book' },
    // { label: 'Return Book', icon: <Icons.Return />,     path: '/return-book' },
  ];

  const adminNavItems = [
    { label: 'Dashboard', icon: <Icons.Home />, path: '/' },
    { label: 'Manage Books', icon: <Icons.Books />, path: '/manage-books' },
    { label: 'Manage Users', icon: <Icons.Users />, path: '/manage-users' },
    { label: 'Attendance', icon: <Icons.Attendance />, path: '/attendance' },
    { label: 'Fines', icon: <Icons.Fine />, path: '/fines' },
    { label: 'Reports', icon: <Icons.Reports />, path: '/reports' },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <>
      <style>{styles}</style>
      <div className="ab-root">

        {/* ── AppBar ── */}
        <header className="ab-bar">
          <button className="ab-menu-btn" onClick={() => setDrawerOpen(true)}>
            <Icons.Menu />
          </button>

          <span className="ab-brand">
            NFC Library
            {isAdmin && <span>· Admin Panel</span>}
          </span>

          {isAdmin && <span className="ab-admin-badge">Admin</span>}

          {/* Avatar → dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              className="ab-avatar-btn"
              onClick={() => setDropdownOpen(o => !o)}
            >
              <Avatar name={name} src={profileImageUrl} size={32} fontSize={14} />
            </button>

            {dropdownOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 299 }}
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="ab-dropdown">
                  <div className="ab-dropdown-header">
                    <div className="ab-dropdown-name">{name || "User"}</div>
                    <div className="ab-dropdown-sub">{department || rollNo}</div>
                  </div>
                  <button
                    className="ab-dropdown-item"
                    onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
                  >
                    <Icons.Profile /> My Profile
                  </button>
                  <div className="ab-divider" />
                  <button className="ab-dropdown-item danger" onClick={handleLogout}>
                    <Icons.Logout /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* ── Drawer ── */}
        {drawerOpen && (
          <>
            <div className="ab-overlay" onClick={() => setDrawerOpen(false)} />
            <nav className="ab-drawer">

              {/* Drawer header — profile card */}
              <div className="ab-drawer-header">
                <div className="ab-drawer-profile">
                  <div className="ab-drawer-avatar">
                    <Avatar name={name} src={profileImageUrl} size={44} fontSize={18} />
                  </div>
                  <div>
                    <div className="ab-drawer-name">{name || "User"}</div>
                    <div className="ab-drawer-meta">{department || "—"}</div>
                    <div className="ab-drawer-roll">{rollNo}</div>
                  </div>
                </div>
              </div>

              {/* Nav section */}
              <div className="ab-section-label">
                {isAdmin ? "Admin Menu" : "Menu"}
              </div>

              {navItems.map((item) => (
                <button
                  key={item.path}
                  className="ab-nav-item"
                  onClick={() => handleNav(item.path)}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}

              <div className="ab-divider" style={{ marginTop: 'auto' }} />

            </nav>
          </>
        )}

        {/* ── Page content ── */}
        <main style={{ padding: '24px 20px' }}>
          {children}
        </main>

      </div>
    </>
  );
};

export default AppBarComponent;