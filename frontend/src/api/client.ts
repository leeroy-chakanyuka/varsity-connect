import axios, { AxiosError } from "axios";

/* one axios instance for the whole app, every request flows through here */
export const TOKEN_KEY = "vc.token";

/* fired when a stored session goes stale, the auth provider listens once */
export const UNAUTHORIZED_EVENT = "vc:unauthorized";

function baseUrl(): string {
  return import.meta.env.VITE_API_URL ?? "http://localhost:8080/api/v1";
}

/* single place everything derives server addresses from, env first */
export function apiBaseUrl(): string {
  return baseUrl();
}

export const api = axios.create({
  baseURL: baseUrl(),
  headers: { "Content-Type": "application/json" },
});

/* attach the session token when we have one */
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* stale sessions clear themselves, but we never navigate in here —
 * navigation lives in the provider so a 401 can never loop the router */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error?.response?.status === 401 && sessionStorage.getItem(TOKEN_KEY)) {
      sessionStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

interface ErrorBody {
  code?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

function body(error: unknown): ErrorBody {
  return ((error as AxiosError<ErrorBody>)?.response?.data ?? {}) as ErrorBody;
}

/* one place to turn failures into words, pages never parse shapes by hand */
export function apiMessage(error: unknown, fallback: string): string {
  return body(error).message ?? (error as Error)?.message ?? fallback;
}

export function apiCode(error: unknown): string | undefined {
  return body(error).code;
}

export function apiFieldErrors(error: unknown): Record<string, string> {
  return body(error).fieldErrors ?? {};
}
