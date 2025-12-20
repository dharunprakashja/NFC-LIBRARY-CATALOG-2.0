import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Typography, CircularProgress } from "@mui/material";
import axios from "axios";



  // Define custom styling for column headers
  const useStyles = {
    header: {
      backgroundColor: '#455a64   ', // Your preferred color
      color: '#ffe393 ', // Ensure the text is readable
      fontSize: '16px',
      fontWeight: 'bold',
    }
  };

const BooksDataGrid = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const bookColumns = [
    { field: "id", headerName: "ID", width: 70,headerClassName: 'super-app-theme--header' },
    { field: "title", headerName: "Title", width: 273.5,headerClassName: 'super-app-theme--header' },
    { field: "author", headerName: "Author", width: 272 ,headerClassName: 'super-app-theme--header'},
    { field: "genre", headerName: "Genre", width: 272,headerClassName: 'super-app-theme--header' },
    { field: "total_pieces", headerName: "Total Pieces", width: 272,headerClassName: 'super-app-theme--header' },
    { field: "available_pieces", headerName: "Available Pieces", width: 272,headerClassName: 'super-app-theme--header' },
  ];

  const bookRows = books.map((book, index) => ({
    id: index + 1, // Add an ID for DataGrid
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
        <>
          {/* <Typography variant="h6" sx={{ marginBottom: 2, color: "#455a64" }}>
            <b>Books</b>
          </Typography> */}
          <Box sx={{ height: 400 }}>
            <DataGrid
              rows={bookRows}
              columns={bookColumns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              sx={{
                backgroundColor: "#f9f9f9",
                boxShadow: 2,
                borderRadius: 2,
                '& .super-app-theme--header': useStyles.header, // Apply the header styling
                '& .MuiDataGrid-columnHeader': { position: 'sticky', top: 0, zIndex: 1 }, // Fix header position
                '& .MuiDataGrid-cell': {
                  padding: '8px',
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
        </>
      )}
    </Box>
  );
};

export default BooksDataGrid;
