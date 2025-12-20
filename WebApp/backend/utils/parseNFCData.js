function parseNFCData(nfcData, type) {
    const isStudent = nfcData.includes('Student Details');
    const isBook = nfcData.includes('Book Details');
  
    if (type === 'attendance' && isStudent) {
      const match = /Name:\s*(.+?)\s*Department:\s*(.+?)\s*Roll-no:\s*(\w+)\s*Mobile:\s*(\d+)/.exec(nfcData);
      if (match) {
        return { type: 'student', data: { name: match[1], department: match[2], roll_no: match[3], mobile: match[4] } };
      }
    } else if (type === 'borrow' && isBook) {
      const match = /title:\s*"(.+?)"\s*author:\s*"(.+?)"\s*genre:\s*"(.+?)"/.exec(nfcData);
      if (match) {
        return { type: 'book_borrow', data: { title: match[1], author: match[2], genre: match[3] } };
      }
    } else if (type === 'return' && isBook) {
      return { type: 'book_return', data: { nfcData } };  // Use a different parser if needed
    }
  
    return null;
  }
  
  module.exports = parseNFCData;
  