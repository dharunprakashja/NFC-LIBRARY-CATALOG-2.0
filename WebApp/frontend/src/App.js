import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import AttendanceDisplay from './components/AttendanceDisplay';
import SignIn from './SignIn';

const App = () => {
  const isLoggedIn = sessionStorage.getItem('logged');

  return (
    <BrowserRouter>
      <Routes>
        {/* Conditional routing based on login status */}
        <Route 
          path="/" 
          element={isLoggedIn ? <AttendanceDisplay /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/login" 
          element={!isLoggedIn ? <SignIn /> : <Navigate to="/" />} 
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
