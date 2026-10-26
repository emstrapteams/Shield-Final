const rawApiBase =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://shield-final-backend.vercel.app/api";

const trimmedApiBase = rawApiBase.replace(/\/+$/, "");

export const API_BASE_URL = trimmedApiBase.endsWith("/api")
  ? trimmedApiBase
  : `${trimmedApiBase}/api`;
