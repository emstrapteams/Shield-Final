
import axios from "axios";
const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";
const authAPI = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const loginUser = async (email, password) => {
  const response = await authAPI.post("/auth/login", {
    email,
    password,
  });

  return response.data;
};

export const logoutUser = () => {
  sessionStorage.removeItem("shield_token");
  sessionStorage.removeItem("shield_user");
};

export const getStoredUser = () => {
  const user = sessionStorage.getItem("shield_user");
  return user ? JSON.parse(user) : null;
};

export const getStoredToken = () => {
  return sessionStorage.getItem("shield_token");
};