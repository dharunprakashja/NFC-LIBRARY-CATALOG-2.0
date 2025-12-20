import React from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AppBarComponent from "../AppBar";

// Import SVGs
import AttendanceIcon from "../assets/attendance.svg";
import BorrowIcon from "../assets/borrow.svg";
import ReturnIcon from "../assets/return.svg";
import TabsWithDataGrid from "../components/TabsWithDataGrid";

axios.defaults.baseURL = "http://localhost:5000/library";

const images = [
  {
    svg: AttendanceIcon,
    title: "Attendance",
    width: "33.33%",
    route: "/attendance",
    action: null, // No session action needed
  },
  {
    svg: BorrowIcon,
    title: "Borrow Book",
    width: "33.33%",
    route: "/borrow-book",
    action: "borrow", // Session action for borrow
  },
  {
    svg: ReturnIcon,
    title: "Return Book",
    width: "33.33%",
    route: "/return-book",
    action: "return", // Session action for return
  },
];

const ImageButton = styled(ButtonBase)(({ theme }) => ({
  position: "relative",
  height: 200,
  width: "100%",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
  transition: "transform 0.3s ease",
  "&:hover, &.Mui-focusVisible": {
    zIndex: 1,
    transform: "scale(1.05)",
    boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.2)",
    "& .MuiImageBackdrop-root": {
      opacity: 0.15,
    },
    "& .MuiImageMarked-root": {
      opacity: 0,
    },
    "& .MuiTypography-root": {
      border: "4px solid currentColor",
    },
  },
}));

const ImageBackdrop = styled("span")(({ theme }) => ({
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  backgroundColor: theme.palette.common.black,
  opacity: 0.4,
  transition: theme.transitions.create("opacity"),
}));

const ImageMarked = styled("span")(({ theme }) => ({
  height: 3,
  width: 18,
  backgroundColor: theme.palette.common.white,
  position: "absolute",
  bottom: -2,
  left: "calc(50% - 9px)",
  transition: theme.transitions.create("opacity"),
}));

export default function Home() {
  const navigate = useNavigate();

  const handleNavigation = async (image) => {
    if (image.action) {
      try {
        const response = await axios.post("/select-action", {
          action: image.action,
        });
        console.log(`Action set to ${image.action}`, response.data.message);
      } catch (error) {
        console.error("Error setting action:", error.response?.data || error);
        alert(
          error.response?.data?.message || "Failed to set action. Please try again."
        );
        return;
      }
    }
    navigate(image.route);
  };

  return (
    <div>
      <AppBarComponent />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          padding: 2,
          flexWrap: "nowrap",
        }}
      >
        {images.map((image) => (
          <ImageButton
            focusRipple
            key={image.title}
            onClick={() => handleNavigation(image)}
            style={{
              width: image.width,
            }}
          >
            <img
              src={image.svg}
              alt={image.title}
              style={{
                width: "50%",
                height: "100%",
                objectFit: "contain",
              }}
            />
            <ImageBackdrop className="MuiImageBackdrop-root" />
            <Typography
              component="span"
              variant="h6"
              color="inherit"
              sx={{
                position: "relative",
                p: 2,
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              {image.title}
              <ImageMarked className="MuiImageMarked-root" />
            </Typography>
          </ImageButton>
        ))}
      </Box>
      <TabsWithDataGrid />
    </div>
  );
}
