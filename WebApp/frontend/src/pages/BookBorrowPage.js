import React from 'react';
import NFCScanner from '../components/NFCScanner';
import { sendNFCData } from '../services/api';

const BookBorrowPage = () => {
  const handleNFCSubmit = (data) => {
    sendNFCData(data)
      .then(response => {
        console.log('Book borrowed:', response.data);
      })
      .catch(error => {
        console.error('Error borrowing book:', error);
      });
  };

  return (
    <div>
      <h2>Borrow Book</h2>
      <NFCScanner onSubmit={handleNFCSubmit} />
    </div>
  );
};

export default BookBorrowPage;
