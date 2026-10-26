
import axios from "axios";
import { API_BASE_URL } from "./apiConfig";
import { getStoredToken } from "./authService";

const companyAPI = axios.create({
  baseURL: API_BASE_URL,
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

export const createCompanyAdmin = async (companyId, adminData) => {
  const response = await companyAPI.post(
    `/companies/${companyId}/admin`,
    adminData
  );

  return response.data;
};
