const account = require('../models/account'); // Path to your account model

const signInService = async (username, password) => {
  try {
    // Validate inputs
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    // Find the user with matching username and password
    const preuser = await account.findOne({ username: username, password: password });

    if (!preuser) {
      // If user is not found
      throw new Error('Invalid credentials');
    }

    return {
      username: username,
      password: password,
    };
  } catch (error) {
    // Handle different types of errors
    if (error.message === 'Username and password are required') {
      throw new Error('Username and password are required');
    }
    if (error.message === 'Invalid credentials') {
      throw new Error('Invalid credentials');
    }

    // Handle any other server errors
    throw new Error('Internal Server Error');
  }
};

module.exports = signInService;
