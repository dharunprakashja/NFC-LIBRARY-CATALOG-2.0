import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box, IconButton, CircularProgress, Dialog, DialogTitle, DialogContent, Divider, Collapse, Typography } from "@mui/material";
import AppShortcutIcon from '@mui/icons-material/AppShortcut';
import axios from "axios";

// Custom Styles for Headers
const useStyles = {
  header: {
    backgroundColor: "#455a64",
    color: "#ffe393",
    fontSize: "16px",
    fontWeight: "bold",
  }
};

const UserBooksDataGrid = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState("");
  const [open, setOpen] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false); // To track AI summary loading
  const [selectedBook, setSelectedBook] = useState(null); // To store selected book details

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get("http://localhost:5000/books");
        setBooks(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching books:", error);
      }
    };

    fetchBooks();
  }, []);

  const handleAIRequest = async (book) => {
    setSelectedBook(book); // Store the selected book
    try {
      setLoadingSummary(true); // Start loader

      // Sending the request to generate summary based on the book's title and author
      const response = await axios.post("http://localhost:5000/gemini", {
        prompt: `Provide a short summary of the book "${book.title}" by ${book.author}.`,
      });

      // Extracting the summary from the response
      setSummary(response.data.summary);
      setLoadingSummary(false); // Stop loader
      setOpen(true); // Opening the dialog to show the generated summary
    } catch (error) {
      console.error("Error fetching AI summary:", error);
      setSummary("Failed to generate a summary.");
      setLoadingSummary(false); // Stop loader
      setOpen(true); // Open dialog with error message
    }
  };

  const bookColumns = [
    { field: "id", headerName: "ID", flex: 0.5, minWidth: 50, headerClassName: "super-app-theme--header" },
    { field: "title", headerName: "Title", flex: 1, minWidth: 150, headerClassName: "super-app-theme--header" },
    { field: "author", headerName: "Author", flex: 1, minWidth: 150, headerClassName: "super-app-theme--header" },
    { field: "genre", headerName: "Genre", flex: 1, minWidth: 120, headerClassName: "super-app-theme--header" },
    { field: "available_pieces", headerName: "Available", flex: 0.8, minWidth: 100, headerClassName: "super-app-theme--header" },
    {
      field: "Summary",
      headerName: "Gemini AI",
      flex: 0.5,
      minWidth: 80,
      sortable: false,
      filterable: false,
      headerClassName: "super-app-theme--header",
      renderCell: (params) => (
        <IconButton onClick={() => handleAIRequest(params.row)}>
          <AppShortcutIcon style={{ color: "#455a64" }} />
        </IconButton>
      ),
    },
  ];

  const bookRows = books.map((book, index) => ({
    id: index + 1,
    ...book,
  }));

  return (
    <Box sx={{ padding: 2 }}>
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <CircularProgress color="secondary" />
        </Box>
      ) : (
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <DataGrid
            rows={bookRows}
            columns={bookColumns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            autoHeight
            disableSelectionOnClick
            sx={{
              backgroundColor: "#f9f9f9",
              boxShadow: 2,
              borderRadius: 2,
              '& .super-app-theme--header': useStyles.header,
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: "#455a64",
                color: "#ffe393",
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                fontWeight: "bold",
              },
              '& .MuiDataGrid-cell': {
                padding: "4px 8px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
              "& .MuiDataGrid-row": {
                "&:nth-of-type(odd)": {
                  backgroundColor: "#f5f5f5",
                },
                "&:nth-of-type(even)": {
                  backgroundColor: "#fff",
                },
              },
            }}
          />
        </Box>
      )}

      {/* Dialog for AI-generated Summary with Collapse transition */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ textAlign: "center", backgroundColor: "#455a64", color: "#ffe393" }}>
        <b> SUMMARY</b>
        </DialogTitle>
        <Divider sx={{ backgroundColor: "#ffe393" }} />

        <DialogContent sx={{ textAlign: "center", backgroundColor: "#455a64" }}>
  <Collapse in={open}>
    {loadingSummary ? (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress color="secondary" />
      </Box>
    ) : (
      <>
        <Typography variant="h6" sx={{ color: "#ffe393", backgroundColor: "#455a64", marginBottom: 0.5 }}>
          <strong>Book Title: </strong> {selectedBook?.title || "Unknown Title"}
        </Typography>
        <Typography variant="body1" sx={{ color: "#ffe393", backgroundColor: "#455a64", marginBottom: 0.5 }}>
          <strong>Author: </strong> {selectedBook?.author || "Unknown Author"}
        </Typography>
        <Divider sx={{ backgroundColor: "#ffe393", marginBottom: 1 }} />
        <Typography variant="h6" sx={{ backgroundColor: "#455a64", color: "#ffe393", marginBottom: 2 }}>
          {summary ? summary : "Failed to generate a summary."}
        </Typography>
        <Divider sx={{ backgroundColor: "#ffe393", marginBottom: 2 }} />
      </>
    )}
  </Collapse>
</DialogContent>

      </Dialog>
    </Box>
  );
};

export default UserBooksDataGrid;
