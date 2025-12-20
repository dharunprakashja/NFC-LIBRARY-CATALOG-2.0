import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { Container, Typography, Box, Paper, Avatar, Divider, LinearProgress } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AppBarComponent from '../AppBar';
import StudentsDataGrid from './StudentsDataGrid';

const socket = io('http://localhost:5000'); // Change this to your backend IP if necessary

function AttendanceDisplay() {
  const [nfcData, setNfcData] = useState(null);

  useEffect(() => {
    socket.on('nfcDataReceived', (data) => {
      setNfcData(data);
    });

    return () => {
      socket.off('nfcDataReceived');
    };
  }, []);

  return (
    <div>
      <AppBarComponent />
      <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'auto', width: '100' }}>
        <Paper elevation={4} sx={{ padding: 4, borderRadius: 3, textAlign: 'center',backgroundColor:'#455a64' }}>
          <Typography variant="h4" gutterBottom color="primary" sx={{ fontWeight: 'bold',color:'#ffe393' }}>
            NFC Attendance System
          </Typography>
          <Divider sx={{ my: 3,backgroundColor:"#ffe393" }} />

          {nfcData ? (
            <Box sx={{ textAlign: 'left' }}>
              <Box display="flex" justifyContent="center" mb={2}>
              <Avatar sx={{ bgcolor: "#ffe393",color:"#455a64", width: 72, height: 72 }}>
                  <AccountCircleIcon  sx={{ fontSize: 40 ,color:"#455a64"}} />
                </Avatar>
              </Box>

              <Typography variant="h6" color="#ffe393" gutterBottom>
                Scanned Student Details
              </Typography>
              <Typography variant="body1" color="#ffe393" ><strong>Name:</strong> {nfcData.student.name}</Typography>
              <Typography variant="body1" color="#ffe393"><strong>Department:</strong> {nfcData.student.department}</Typography>
              <Typography variant="body1" color="#ffe393"><strong>Roll No:</strong> {nfcData.student.roll_no}</Typography>
              <Typography variant="body1" color="#ffe393"><strong>Mobile:</strong> {nfcData.student.mobile}</Typography>

              <Divider sx={{ my: 3 , backgroundColor:"#ffe393"}} />
              <Typography variant="body2" color="#ffe393" sx={{ mt: 2,    display: 'flex',justifyContent: 'center',alignItems: 'center' }}>
                {nfcData.message}
              </Typography>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" alignItems="center">
              {/* Linear Progress Bar for loading */}
              <LinearProgress color="inherit"
  sx={{ 
    width: '100%', 
    marginBottom: 2, 
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#ffe393',  // Color of the progress bar
    },
    '& .MuiLinearProgress-root': {
      backgroundColor: '#ffe393', // Color of the background/track (optional, if you want a different color for the track)
    }
  }} 
/>

              <Typography variant="body1" sx={{ mt: 2,color:'#ffe393' }}>
                Please scan an NFC tag.
              </Typography>
            </Box>
          )}
        </Paper>
      </Container>
      <Box sx={{padding:2}}>
      <StudentsDataGrid/>
      </Box>
    </div>
  );
}

export default AttendanceDisplay;
