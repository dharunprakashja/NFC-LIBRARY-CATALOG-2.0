function calculateFine(dueDate, currentDate) {
    const oneDay = 24 * 60 * 60 * 1000; // Milliseconds in one day
    const diffDays = Math.ceil((currentDate - dueDate) / oneDay);
  
    return diffDays > 0 ? diffDays * 10 : 0; // Assuming fine is ₹10 per day
  }
  
  module.exports = calculateFine;
  