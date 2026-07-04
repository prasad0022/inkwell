import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach token to every request automatically
apiClient.interceptors.request.use(
  (config) => {
    // Only runs on client side
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Helper to delete cookie reliably
const clearAuthCookies = () => {
  document.cookie = "accessToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
  document.cookie =
    "refreshToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          clearAuthCookies();
          window.location.href = "/login";
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
          { refreshToken },
        );

        const { accessToken } = response.data.data;
        localStorage.setItem("accessToken", accessToken);

        // Also update cookie so middleware stays in sync
        const expires = new Date();
        expires.setTime(expires.getTime() + 24 * 60 * 60 * 1000);
        document.cookie = `accessToken=${accessToken};expires=${expires.toUTCString()};path=/`;

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear everything including cookies
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        clearAuthCookies();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
