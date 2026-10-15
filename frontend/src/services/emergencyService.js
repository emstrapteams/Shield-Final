
import axios from "axios";
import { getStoredToken } from "./authService";

const API_URL =
  import.meta.env.VITE_API_URL || "https://shield-final-backend.vercel.app/api";

const emergencyAPI = axios.create({
  baseURL: API_URL,
});

// Attach the logged-in user's JWT to every request.
emergencyAPI.interceptors.request.use(
  (config) => {
    const token = getStoredToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Create a new emergency.
export const createEmergency = async (emergencyData) => {
  const response = await emergencyAPI.post(
    "/emergencies",
    emergencyData
  );

  return response.data;
};

// Upload photo/video evidence for an existing emergency.
export const uploadEmergencyEvidence = async (
  emergencyId,
  files
) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("evidence", file);
  });

  const response = await emergencyAPI.post(
    `/emergencies/${emergencyId}/evidence`,
    formData
  );

  return response.data;
};

// Fetch emergencies reported by the logged-in employee.
export const getMyEmergencies = async () => {
  const response = await emergencyAPI.get("/emergencies/my");
  return response.data;
};

// Fetch a specific emergency.
export const getEmergencyById = async (emergencyId) => {
  const response = await emergencyAPI.get(
    `/emergencies/${emergencyId}`
  );

  return response.data;
};

// Cancel an emergency reported by the employee.
export const cancelEmergency = async (
  emergencyId,
  cancellationReason
) => {
  const response = await emergencyAPI.patch(
    `/emergencies/${emergencyId}/cancel`,
    { cancellationReason }
  );

  return response.data;
};

// Fetch emergencies belonging to the Company Admin's company.
export const getCompanyEmergencies = async (params = {}) => {
  const response = await emergencyAPI.get("/emergencies", {
    params,
  });

  return response.data;
};

// Company Admin: acknowledge a triggered emergency.
export const acknowledgeEmergency = async (emergencyId) => {
  const response = await emergencyAPI.patch(
    `/emergencies/${emergencyId}/acknowledge`
  );

  return response.data;
};

// Company Admin: start responding to an acknowledged emergency.
export const startEmergencyResponse = async (emergencyId) => {
  const response = await emergencyAPI.patch(
    `/emergencies/${emergencyId}/start-response`
  );

  return response.data;
};

// Company Admin: resolve an emergency with an optional note.
export const resolveEmergency = async (emergencyId, note = "") => {
  const response = await emergencyAPI.patch(
    `/emergencies/${emergencyId}/resolve`,
    { note }
  );

  return response.data;
};

// Company Admin: close a resolved emergency with an optional note.
export const closeEmergency = async (emergencyId, note = "") => {
  const response = await emergencyAPI.patch(
    `/emergencies/${emergencyId}/close`,
    { note }
  );

  return response.data;
};
