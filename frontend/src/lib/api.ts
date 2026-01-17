
const API_BASE_URL = "https://career-compass-backend-hf0w.onrender.com/api/v1";

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
};

export const fetchClient = async (endpoint: string, options: FetchOptions = {}) => {
    // Retrieve token from cookie "token" (set by login page)
    const token = getCookie("token");

    if (token) {
        console.log("Attaching Token:", token.substring(0, 10) + "...");
    } else {
        console.warn("No token found in cookies!");
    }

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
        // Clear cookie on 401
        if (typeof document !== "undefined") {
            document.cookie = "token=; path=/; max-age=0";
        }
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
    }

    return response;
};
