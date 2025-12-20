import React from 'react';
import NFCScanner from '../components/NFCScanner';
import { sendNFCData } from '../services/api';

const BookReturnPage = () => {
  const handleNFCSubmit = (data) => {
    sendNFCData(data)
      .then(response => {
        console.log('Book returned:', response.data);
      })
      .catch(error => {
        console.error('Error returning book:', error);
      });
  };

  return (
    <div>
      <h2>Return Book</h2>
      <NFCScanner onSubmit={handleNFCSubmit} />
    </div>
  );
};

export default BookReturnPage;
