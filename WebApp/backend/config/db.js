const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://dharunprakash:12345@cluster0.tttb0r3.mongodb.net/nfcData');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);  // Exit process with failure if connection fails
  }
};

module.exports = connectDB;
