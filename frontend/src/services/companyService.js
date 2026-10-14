
import axios from "axios";
import { getStoredToken } from "./authService";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const companyAPI = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

companyAPI.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getCompanies = async () => {
  const response = await companyAPI.get("/companies");
  return response.data;
};

export const createCompany = async (companyData) => {
  const response = await companyAPI.post("/companies", companyData);
  return response.data;
};

export const updateCompany = async (id, companyData) => {
  const response = await companyAPI.put(
    `/companies/${id}`,
    companyData
  );

  return response.data;
};

export const updateCompanyStatus = async (id, status) => {
  const response = await companyAPI.patch(
    `/companies/${id}/status`,
    { status }
  );

  return response.data;
};

export const getCompanyAdmins = async () => {
  const response = await companyAPI.get("/companies/admins");
  return response.data;
};
