import React, { useEffect, useState } from 'react';
import { api, getStudentDetails } from '../api';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Chip,
  CircularProgress,
  Button
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BookIcon from '@mui/icons-material/Book';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import UserAppBar from '../UserAppBar';

const UserProfile = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  // Retrieve roll number from sessionStorage
  const rollNo = sessionStorage.getItem('username');

  useEffect(() => {
    const fetchStudent = async () => {
      if (!rollNo) {
        setLoading(false);
        return;
      }

      try {
        const data = await getStudentDetails(rollNo);
        setStudent(data);
      } catch (error) {
        console.error('Failed to fetch student data');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [rollNo]);

  const handlePayFine = async () => {
    if (!student?.roll_no || (student.total_fine || 0) <= 0) return;
    setPaying(true);
    try {
      const { data } = await api.post('/fines/payment-link', { roll_no: student.roll_no });
      if (data?.payment_link) {
        window.open(data.payment_link, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Failed to generate payment link', error);
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;
  if (!student) return <Typography align="center" mt={5}>No student found.</Typography>;

  return (
    <div>
      <UserAppBar />
      <Box sx={{ maxWidth: 900, margin: 'auto', padding: 4 }}>
        {/* Student Info Card */}
        <Card sx={{ mb: 3, backgroundColor: '#455a64', color: '#fff', borderRadius: 3, boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ mr: 1, color: '#ffe393' }} /> {student.name}
            </Typography>
            <Typography variant="body1">Department: <strong>{student.department}</strong></Typography>
            <Typography variant="body1">Roll No: <strong>{student.roll_no}</strong></Typography>
            <Typography variant="body1">Mobile: <strong>{student.mobile}</strong></Typography>
            <Box mt={2} display="flex" gap={1}>
              <Chip label={`Total Attendance: ${student.no_of_days}`} sx={{ backgroundColor: '#2e7d32', color: '#fff', fontWeight: 'bold' }} />
              <Chip label={`Total Fine: ₹${student.total_fine}`} sx={{ backgroundColor: '#d32f2f', color: '#fff', fontWeight: 'bold' }} />
            </Box>
            <Box mt={2} display="flex" gap={1} flexWrap="wrap">
              <Button
                variant="contained"
                onClick={handlePayFine}
                disabled={paying || (student.total_fine || 0) <= 0}
                sx={{ backgroundColor: '#0f172a' }}
              >
                {paying ? 'Preparing payment...' : 'Pay Fine Online'}
              </Button>
              <Button variant="outlined" disabled>
                Pay to Admin (manual settle)
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Borrowed Books Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#455a64', color: '#ffe393' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Book Title</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Borrowed Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fine</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {student.borrowed_books.map((book) => (
                <TableRow key={book.book_id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f5f5f5' } }}>
                  <TableCell sx={{ display: 'flex', alignItems: 'center' }}>
                    <BookIcon sx={{ mr: 1, color: '#1976d2' }} /> {book.title}
                  </TableCell>
                  <TableCell>{new Date(book.borrowed_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(book.due_date).toLocaleDateString()}</TableCell>
                  <TableCell sx={{ color: book.fine > 0 ? 'red' : 'green', fontWeight: 'bold' }}>
                    <AccountBalanceWalletIcon sx={{ mr: 1, color: book.fine > 0 ? 'red' : 'green' }} /> ₹{book.fine}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </div>
  );
};

export default UserProfile;
