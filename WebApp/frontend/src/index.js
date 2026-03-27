import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import SignIn             from './SignIn';
import AppBarComponent    from './components/AppBar';
import ARIABubble         from './components/admin_ai';      // admin AI
import UserARIABubble     from './components/user_ai';  // user AI

// Admin pages
import Home               from './pages/Home';
import AttendanceDisplay  from './components/AttendanceDisplay';
// import ManageBooks     from './pages/ManageBooks';
// import ManageUsers     from './pages/ManageUsers';
// import Fines           from './pages/Fines';
// import Reports         from './pages/Reports';

// User pages
import UserHome           from './pages/UserHome';
import BorrowReturnDisplay from './components/BorrowReturnDisplay';
import UserProfile        from './pages/UserProfile';

// ── Session ───────────────────────────────────────────────────────────────────
const isLoggedIn = sessionStorage.getItem('logged')   === 'true';
const isAdmin    = sessionStorage.getItem('is_admin') === 'true';

const WithNav = ({ children }) => (
  <AppBarComponent>{children}</AppBarComponent>
);

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter>

    {/* ── Floating AI bubbles — outside <Routes> so they persist on navigation ── */}
    {isLoggedIn && isAdmin  && <ARIABubble />}
    {isLoggedIn && !isAdmin && <UserARIABubble />}

    <Routes>

      {!isLoggedIn && (
        <Route path="*" element={<SignIn />} />
      )}

      {isLoggedIn && isAdmin && (
        <>
          <Route path="/"            element={<WithNav><Home /></WithNav>} />
          <Route path="/attendance"  element={<WithNav><AttendanceDisplay /></WithNav>} />
          <Route path="/borrow-book" element={<WithNav><BorrowReturnDisplay /></WithNav>} />
          <Route path="/return-book" element={<WithNav><BorrowReturnDisplay /></WithNav>} />
          {/* <Route path="/manage-books" element={<WithNav><ManageBooks /></WithNav>} /> */}
          {/* <Route path="/manage-users" element={<WithNav><ManageUsers /></WithNav>} /> */}
          {/* <Route path="/fines"        element={<WithNav><Fines /></WithNav>} />     */}
          {/* <Route path="/reports"      element={<WithNav><Reports /></WithNav>} />   */}
          <Route path="*"            element={<WithNav><Home /></WithNav>} />
        </>
      )}

      {isLoggedIn && !isAdmin && (
        <>
          <Route path="/"        element={<WithNav><UserHome /></WithNav>} />
          <Route path="/profile" element={<WithNav><UserProfile /></WithNav>} />
          <Route path="*"        element={<WithNav><UserHome /></WithNav>} />
        </>
      )}

    </Routes>

  </BrowserRouter>
);