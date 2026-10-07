import { api } from "./client";

/* mirrors the backend me/auth DTOs, role stays backend-authoritative */
export type Role = "STUDENT" | "VENDOR" | "ADMIN";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  studentNumber: string | null;
  faculty: string | null;
  phoneNumber: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  role: Role;
  enabled: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: "STUDENT" | "VENDOR";
  studentNumber?: string;
  faculty?: string;
  acceptedTerms: boolean;
}

/* thin wrappers, state lives in the auth provider */
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function login(identifier: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", { identifier, password });
  return data;
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("/auth/me");
  return data;
}
