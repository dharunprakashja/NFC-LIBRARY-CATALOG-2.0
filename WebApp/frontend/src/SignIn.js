import React, { useState } from "react";
import styled from "styled-components";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AssignmentIndRoundedIcon from "@mui/icons-material/AssignmentIndRounded";
import { signInUser } from "./api";
import './styles/bg.css';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .si-root {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    font-family: 'Inter', sans-serif;
  }

  .si-card {
    background: #fff;
    border-radius: 16px;
    padding: 40px 36px;
    width: 380px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  }

  .si-logo {
    width: 48px;
    height: 48px;
    background: #1a1a2e;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
  }

  .si-logo svg {
    width: 24px;
    height: 24px;
    color: #fff;
  }

  .si-title {
    font-size: 22px;
    font-weight: 600;
    color: #111;
    margin-bottom: 6px;
  }

  .si-sub {
    font-size: 13px;
    color: #888;
    margin-bottom: 32px;
  }

  .si-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: #555;
    margin-bottom: 6px;
  }

  .si-field {
    margin-bottom: 18px;
  }

  .si-input-wrap {
    position: relative;
  }

  .si-input {
    width: 100%;
    padding: 11px 40px 11px 14px;
    border: 1.5px solid #e5e5e5;
    border-radius: 10px;
    font-size: 14px;
    font-family: 'Inter', sans-serif;
    color: #111;
    outline: none;
    transition: border-color 0.18s;
    background: #fafafa;
  }

  .si-input:focus {
    border-color: #1a1a2e;
    background: #fff;
  }

  .si-input::placeholder { color: #bbb; }

  .si-eye {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #aaa;
    padding: 2px;
    display: flex;
    align-items: center;
  }

  .si-eye:hover { color: #555; }

  .si-error {
    font-size: 12.5px;
    color: #e53e3e;
    background: #fff5f5;
    border: 1px solid #fed7d7;
    border-radius: 8px;
    padding: 9px 12px;
    margin-bottom: 18px;
  }

  .si-btn {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    transition: opacity 0.18s, transform 0.12s;
  }

  .si-btn:active { transform: scale(0.99); }

  .si-btn-primary {
    background: #1a1a2e;
    color: #fff;
    margin-bottom: 10px;
  }

  .si-btn-primary:hover:not(:disabled) { opacity: 0.88; }
  .si-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .si-btn-ghost {
    background: #f5f5f5;
    color: #555;
  }

  .si-btn-ghost:hover { background: #ececec; }

  .si-spinner {
    display: inline-block;
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    vertical-align: middle;
    margin-right: 6px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
`;

const EyeIcon = ({ off }) => off ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

export default function SignIn() {
  const [formData, setFormData] = useState({ roll_no: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleClear = () => {
    setFormData({ roll_no: "", password: "" });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.roll_no || !formData.password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await signInUser(formData.roll_no, formData.password);
      const { name, roll_no, department, profile_image, is_admin } = res.data.account;

      // Store all required fields in sessionStorage
      sessionStorage.setItem("logged",         "true");
      sessionStorage.setItem("name",           name          || "");
      sessionStorage.setItem("roll_no",        roll_no       || "");
      sessionStorage.setItem("department",     department    || "");
      sessionStorage.setItem("profile_image",  profile_image || "");
      sessionStorage.setItem("is_admin",       is_admin ? "true" : "false");

      window.location.assign("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="si-root">
        <div className="si-card">

          {/* Logo */}
          <div className="si-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>

          <h1 className="si-title">Sign in</h1>
          <p className="si-sub">Library Management System</p>

          {error && <div className="si-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Roll No */}
            <div className="si-field">
              <label className="si-label" htmlFor="roll_no">Roll Number</label>
              <input
                className="si-input"
                id="roll_no"
                name="roll_no"
                type="text"
                placeholder="e.g. CS2021001"
                value={formData.roll_no}
                onChange={handleChange}
                autoFocus
              />
            </div>

            {/* Password */}
            <div className="si-field">
              <label className="si-label" htmlFor="password">Password</label>
              <div className="si-input-wrap">
                <input
                  className="si-input"
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                />
                {formData.password && (
                  <button
                    type="button"
                    className="si-eye"
                    onClick={() => setShowPassword(p => !p)}
                    tabIndex={-1}
                  >
                    <EyeIcon off={showPassword} />
                  </button>
                )}
              </div>
            </div>

            <button type="submit" className="si-btn si-btn-primary" disabled={loading}>
              {loading && <span className="si-spinner" />}
              {loading ? "Signing in…" : "Sign In"}
            </button>

            <button type="button" className="si-btn si-btn-ghost" onClick={handleClear}>
              Clear
            </button>
          </form>

        </div>
      </div>
    </>
  );
}