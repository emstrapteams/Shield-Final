
import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

const authAPI = axios.create({
  baseURL: API_BASE_URL,
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