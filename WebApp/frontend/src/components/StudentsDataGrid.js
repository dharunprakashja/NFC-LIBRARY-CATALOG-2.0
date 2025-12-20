import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Typography, CircularProgress } from "@mui/material";
import axios from "axios";

const StudentsDataGrid = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);


  // Define custom styling for column headers
const useStyles = {
    header: {
      backgroundColor: '#455a64   ', // Your preferred color
      color: '#ffe393 ', // Ensure the text is readable
      fontSize: '16px',
      fontWeight: 'bold',
    }
  };
  

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get("http://localhost:5000/students");
        setStudents(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudents();
  }, []);

  const studentColumns = [
    { field: "id", headerName: "ID", width: 70,headerClassName: 'super-app-theme--header' },
    { field: "name", headerName: "Name", width: 230,headerClassName: 'super-app-theme--header'  },
    { field: "department", headerName: "Department", width: 227,headerClassName: 'super-app-theme--header'  },
    { field: "roll_no", headerName: "Roll Number", width: 226,headerClassName: 'super-app-theme--header'  },
    { field: "mobile", headerName: "Mobile", width: 226,headerClassName: 'super-app-theme--header'  },
    { field: "no_of_days", headerName: "Attendance Days", width: 226,headerClassName: 'super-app-theme--header'  },
    { field: "total_fine", headerName: "Total Fine", width: 226,headerClassName: 'super-app-theme--header'  },
  ];

  const studentRows = students.map((student, index) => ({
    id: index + 1, // Add an ID for DataGrid
    ...student,
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
            <b>Students</b>
          </Typography> */}
          <Box sx={{ height: 400 }}>
            <DataGrid
              rows={studentRows}
              columns={studentColumns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              sx={{
                backgroundColor: "#f9f9f9",
                boxShadow: 2,
                borderRadius: 2,
                '& .super-app-theme--header': useStyles.header, // Apply the header styling

                "& .MuiDataGrid-row": {
                  "&:nth-of-type(odd)": {
                    backgroundColor: "#f5f5f5",
                  },
                  '& .MuiDataGrid-columnHeader': { position: 'sticky', top: 0, zIndex: 1 }, // Fix header position
                  '& .MuiDataGrid-cell': {
                    padding: '8px',
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

export default StudentsDataGrid;
