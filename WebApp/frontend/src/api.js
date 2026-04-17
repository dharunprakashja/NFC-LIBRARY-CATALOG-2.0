import axios from "axios";

// Change only this env var during deployment to switch backend IP/host.
export const BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const api = axios.create({
  baseURL: BASE_URL,
});

export const SOCKET_URL = BASE_URL;

export const withBaseUrl = (path = "") => {
  if (!path) return BASE_URL;
  return path.startsWith("/") ? `${BASE_URL}${path}` : `${BASE_URL}/${path}`;
};

export const accountImageUrl = (value) => {
  if (!value) return null;

  const v = String(value).trim();
  if (!v) return null;

  if (/^(https?:)?\/\//i.test(v) || v.startsWith("data:")) return v;
  if (v.startsWith("/")) return withBaseUrl(v);
  if (v.startsWith("image/")) return withBaseUrl(v);
  return withBaseUrl(`/image/account/${encodeURI(v)}`);
};

export const bookImageUrl = (value) => {
  if (!value) return null;

  const v = String(value).trim();
  if (!v) return null;

  if (/^(https?:)?\/\//i.test(v) || v.startsWith("data:")) return v;
  if (v.startsWith("/")) return withBaseUrl(v);
  if (v.startsWith("image/")) return withBaseUrl(v);
  return withBaseUrl(`/image/book/${encodeURI(v)}`);
};

// Sign-In function
export const signInUser = async (roll_no, password) => {
  try {
    return await api.post("/account/signin", { roll_no, password });
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Existing attendance function (if needed)
export const fetchAttendanceData = async () => {
  try {
    const response = await api.post("/attendance");
    return response.data;
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    throw error;
  }
};

// GET INDIDUAL STUDENTS DETAILS BASED ON ROLL NO
export const getStudentDetails = async (rollNo) => {
  try {
    const response = await api.get(`/students/${rollNo}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching student details:", error);
    throw error;
  }
};

// Generate Summary using Gemini API
export const generateSummary = async (prompt) => {
  try {
    const response = await api.post("/gemini", { prompt });
    return response.data.summary;
  } catch (error) {
    console.error("Error generating summary:", error);
    throw error;
  }
};
