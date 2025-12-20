// AttendanceCard.js

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import io from 'socket.io-client';

const socket = io('http://localhost:5000'); // Adjust the URL as needed

function AttendanceCard() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    // Listen for attendance updates from the server
    socket.on('attendanceUpdate', (student) => {
      setStudents((prevStudents) => [...prevStudents, student]);
    });

    // Cleanup on component unmount
    return () => {
      socket.off('attendanceUpdate');
    };
  }, []);

  return (
    <div>
      {students.map((student, index) => (
        <Card key={index} sx={{ marginBottom: 2 }}>
          <CardContent>
            <Typography variant="h6">{student.name}</Typography>
            <Typography variant="body2">Department: {student.department}</Typography>
            <Typography variant="body2">Roll No: {student.roll_no}</Typography>
            <Typography variant="body2">Mobile: {student.mobile}</Typography>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default AttendanceCard;
