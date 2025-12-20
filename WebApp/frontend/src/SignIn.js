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


const PageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

const BoxContainer = styled.div`
  width: 400px;
  min-height: 550px;
  display: flex;
  flex-direction: column;
  border-radius: 19px;
  background-color: #fff;
  box-shadow: 0 0 2px rgba(15, 15, 15, 0.28);
  position: relative;
  overflow: hidden;
`;

const TopContainer = styled.div`
  width: 100%;
  height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0 1.8em;
  padding-bottom: 90px;
  position: relative;
`;

const BackDrop = styled.div`
  position: absolute;
  width: 140%;
  height: 550px;
  display: flex;
  flex-direction: column;
  border-radius: 50%;
  top: -300px;
  left: -80px;
  transform: rotate(60deg);
  background: #455a64;
`;

export default function SignIn() {
  const defaultTheme = createTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClear = () => {
    setFormData({ username: "", password: "" });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await signInUser(formData.username, formData.password);
      if (response && response.data) {
        sessionStorage.setItem("logged", "true");
        sessionStorage.setItem("admin", response.data.admin ? "true" : "false");
        sessionStorage.setItem("username", formData.username); // Store username
        window.location.assign("/");
      } else {
        alert("Invalid Credentials");
      }
    } catch (error) {
      console.error("Login Error:", error);
      setError("Invalid username or password. Please try again!");
    }
  };
  
  

  return (
    <PageContainer>
      <BoxContainer>
        <TopContainer>
          <BackDrop />
          <div
            style={{
              position: "absolute",
              top: "30px",
              left: "50%",
              transform: "translateX(-50%)",
              textAlign: "center",
              color: "#fff",
            }}
          >
            <AssignmentIndRoundedIcon style={{ fontSize: "120px", color: "#fff",color:'#ffe393' }} />
            <h2 style={{ marginTop: "0px",color:'#ffe393' }}>Welcome Back !!!</h2>
            <p style={{ fontSize: "14px",color:'#ffe393' }}>Please sign-in to continue!</p>
          </div>
        </TopContainer>
        <div style={{ paddingTop: "30px" }}>
          <ThemeProvider theme={defaultTheme}>
            <Container
              component="main"
              maxWidth="xs"
              style={{
                backgroundColor: "#ffffff",
                padding: "20px",
                borderRadius: "10px",
              }}
            >
              <CssBaseline />
              <form onSubmit={handleSubmit}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="username"
                  autoFocus
                  color="#ffe393"
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  color="#ffe393"
                  InputProps={{
                    endAdornment: formData.password && (
                      <IconButton onClick={handleTogglePasswordVisibility}>
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    ),
                  }}
                />
                {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 3,
                    mb: 2,
                    borderRadius: 20,
                    backgroundColor: "#455a64",
                    color:'#ffe393',
                  }}
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  fullWidth
                  variant="outlined"
                  onClick={handleClear}
                  sx={{
                    mb: 2,
                    borderRadius: 20,
                    borderColor: "#455a64",
                    color: "#455a64",
                  }}
                >
                  Clear
                </Button>
              </form>
            </Container>
          </ThemeProvider>
        </div>
      </BoxContainer>
    </PageContainer>
  );
}
