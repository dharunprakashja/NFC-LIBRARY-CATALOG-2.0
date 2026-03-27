import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Sign-In function
export const signInUser = async (roll_no, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/account/signin`, { roll_no, password });
    return response;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};


// Existing attendance function (if needed)
export const fetchAttendanceData = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/attendance`);
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    throw error;
  }
};

// GET INDIDUAL STUDENTS DETAILS BASED ON ROLL NO 

export const getStudentDetails = async (rollNo) => {
  try {
    const response = await axios.get(`${BASE_URL}/students/${rollNo}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching student details:', error);
    throw error;
  }
};

// Generate Summary using Gemini API
export const generateSummary = async (prompt) => {
  try {
    const response = await axios.post(`${BASE_URL}/gemini`, { prompt });
    return response.data.summary; // Return the generated summary
  } catch (error) {
    console.error('❌ Error generating summary:', error);
    throw error;
  }
};
