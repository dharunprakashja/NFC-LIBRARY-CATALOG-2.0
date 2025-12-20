import React from 'react';
import NFCScanner from '../components/NFCScanner';
import { sendNFCData } from '../services/api';

const AttendancePage = () => {
  const handleNFCSubmit = (data) => {
    sendNFCData(data)
      .then(response => {
        console.log('Attendance updated:', response.data);
      })
      .catch(error => {
        console.error('Error updating attendance:', error);
      });
  };

  return (
    <div>
      <h2>Attendance</h2>
      <NFCScanner onSubmit={handleNFCSubmit} />
    </div>
  );
};

export default AttendancePage;
