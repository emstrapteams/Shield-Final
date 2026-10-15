

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://shield-final-backend.vercel.app/api";
).replace(/\/+$/, "");


function getAuthHeaders() {
  const token = sessionStorage.getItem("shield_token");

  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, { method = "GET", body, params } = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  let url = `${BASE_URL}${normalizedPath}`;

  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== null && value !== ""
      )
    ).toString();

    if (qs) url += `?${qs}`;
  }

  const headers = {
    ...getAuthHeaders(),
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload;

  try {
    payload = await res.json();
  } catch {
    payload = {
      success: false,
      message: "Invalid server response.",
    };
  }

  if (!res.ok || payload.success === false) {
    const err = new Error(
      payload.message || `Request failed (${res.status})`
    );
    err.status = res.status;
    err.errors = payload.errors;
    throw err;
  }

  return payload;
}

export const api = {
  get: (path, params) => request(path, { method: "GET", params }),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
};

export async function downloadReport(
  path,
  params,
  fallbackFilename = "report"
) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  let url = `${BASE_URL}${normalizedPath}`;

  const qs = new URLSearchParams(
    Object.entries(params || {}).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  ).toString();

  if (qs) url += `?${qs}`;

  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    let message = `Report request failed (${res.status})`;

    try {
      const payload = await res.json();
      message = payload.message || message;
    } catch {
      // Keep the default message if the response is not JSON.
    }

    throw new Error(message);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : fallbackFilename;

  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(blobUrl);
}
