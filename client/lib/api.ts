import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { API_URL } from "./constants";
import { tokenStorage } from "./storage";

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

function flushQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  pendingQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;
    const status = error.response?.status;

    if (!original || status !== 401) return Promise.reject(error);

    // Don't try to refresh on the auth endpoints themselves.
    if (original.url?.includes("/auth/")) return Promise.reject(error);

    if (original._retry) return Promise.reject(error);
    original._retry = true;

    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      tokenStorage.clear();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (original.headers) original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        })
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;
    try {
      const { data } = await axios.post(
        `${API_URL}/auth/refresh`,
        { refreshToken },
        { withCredentials: true },
      );
      const newAccess = data?.data?.accessToken as string;
      const newRefresh = data?.data?.refreshToken as string;
      if (!newAccess || !newRefresh) throw new Error("Failed to refresh tokens");
      tokenStorage.setTokens(newAccess, newRefresh);
      flushQueue(null, newAccess);
      if (original.headers) original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (refreshErr) {
      flushQueue(refreshErr, null);
      tokenStorage.clear();
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (!path.startsWith("/login") && !path.startsWith("/signup")) {
          window.location.href = "/login";
        }
      }
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);

export function getErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(err)) {
    const msg = (err.response?.data as { message?: string } | undefined)?.message;
    return msg ?? err.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.get(url, config);
  return res.data?.data as T;
}

export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.post(url, body, config);
  return res.data?.data as T;
}

export async function apiPut<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.put(url, body, config);
  return res.data?.data as T;
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.delete(url, config);
  return res.data?.data as T;
}
