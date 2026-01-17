
const API_BASE_URL = "https://career-compass-backend-hf0w.onrender.com/api/v1";

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

export const fetchClient = async (endpoint: string, options: FetchOptions = {}) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    const headers: Record<string, string> = {
        ...(options.headers || {}),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    // If body is NOT FormData, default to application/json
    // If it IS FormData, let the browser set Content-Type header with boundary
    if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const config = {
        ...options,
        headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
        console.error("Unauthorized! Redirecting to login...");
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
    }

    return response;
};
