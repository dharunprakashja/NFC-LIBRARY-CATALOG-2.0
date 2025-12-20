import React, { useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import StudentsDataGrid from "./StudentsDataGrid"; // Import the Students DataGrid
import BooksDataGrid from "./BooksDataGrid"; // Import the Books DataGrid

const TabsWithDataGrid = () => {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Tabs Header */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={selectedTab}
          onChange={handleChange}
          aria-label="Student and Book Tabs"
          textColor="inherit"
          indicatorColor="primary"
          variant="fullWidth"
          sx={{
            "& .MuiTabs-indicator": { backgroundColor: "#455a64" }, // Indicator color
          }}
        >
          <Tab
            label="Students"
            sx={{
              fontWeight: "bold",
              width: "50%",
              color: "#455a64", // Text color
              "&.Mui-selected": { color: "#455a64" }, // Selected tab color
            }}
          />
          <Tab
            label="Books"
            sx={{
              fontWeight: "bold",
              width: "50%",
              color: "#455a64", // Text color
              "&.Mui-selected": { color: "#455a64" }, // Selected tab color
            }}
          />
        </Tabs>
      </Box>

      {/* Tabs Content */}
      <Box sx={{ padding: 2 }}>
        {selectedTab === 0 && (
          <Box>
            {/* <Typography variant="h6" sx={{ marginBottom: 2, color: "#455a64" }}>
              <b>Students</b>
            </Typography> */}
            <StudentsDataGrid />
          </Box>
        )}
        {selectedTab === 1 && (
          <Box>
            {/* <Typography variant="h6" sx={{ marginBottom: 2, color: "#455a64" }}>
              <b>Books</b>
            </Typography> */}
            <BooksDataGrid />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TabsWithDataGrid;
