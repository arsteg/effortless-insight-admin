import axios, { AxiosInstance, AxiosError } from "axios";
import type { AdminApiResponse } from "@/types/admin";

const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://localhost:59110/api/v1";
const ADMIN_ACCESS_TOKEN_KEY = "admin_access_token";
const ADMIN_REFRESH_TOKEN_KEY = "admin_refresh_token";

// Cookie helper functions
const setCookie = (name: string, value: string, days: number = 7): void => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const deleteCookie = (name: string): void => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
};

export const adminTokens = {
  getAccessToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
  },
  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY);
  },
  setTokens: (accessToken: string, refreshToken: string): void => {
    if (typeof window === "undefined") return;
    // Store in localStorage for API calls
    localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshToken);
    // Also set cookies for middleware auth checks
    setCookie(ADMIN_ACCESS_TOKEN_KEY, accessToken, 7);
    setCookie(ADMIN_REFRESH_TOKEN_KEY, refreshToken, 7);
  },
  clearTokens: (): void => {
    if (typeof window === "undefined") return;
    // Clear from localStorage
    localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
    localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
    // Clear cookies
    deleteCookie(ADMIN_ACCESS_TOKEN_KEY);
    deleteCookie(ADMIN_REFRESH_TOKEN_KEY);
  },
};

const adminClient: AxiosInstance = axios.create({
  baseURL: ADMIN_API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

adminClient.interceptors.request.use(
  (config) => {
    const token = adminTokens.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

adminClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return adminClient(originalRequest);
        });
      }
      isRefreshing = true;
      const refreshToken = adminTokens.getRefreshToken();
      if (!refreshToken) {
        adminTokens.clearTokens();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(error);
      }
      try {
        const response = await axios.post(
          `${ADMIN_API_BASE_URL}/admin/auth/refresh`,
          { refreshToken },
        );
        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;
        adminTokens.setTokens(accessToken, newRefreshToken);
        processQueue(null, accessToken);
        if (originalRequest.headers)
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return adminClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        adminTokens.clearTokens();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export function extractData<T>(response: { data: AdminApiResponse<T> }): T {
  if (!response.data.success) {
    throw new Error(response.data.message || "Request failed");
  }
  return response.data.data as T;
}

export { adminClient, ADMIN_API_BASE_URL };
export default adminClient;
