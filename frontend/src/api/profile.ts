import { api } from "./client";
import type { AuthUser } from "./auth";

/* profile responses share the auth user shape until reviews add more */
export type Profile = AuthUser;

export const profileKeys = {
  me: ["profile", "me"] as const,
  byId: (id: string) => ["profile", id] as const,
};

export interface UpdateProfilePayload {
  fullName?: string;
  faculty?: string;
  phoneNumber?: string;
  bio?: string;
  profileImageUrl?: string;
}

/* thin wrappers, caching lives in the pages */
export async function fetchMyProfile(): Promise<Profile> {
  const { data } = await api.get<Profile>("/users/me");
  return data;
}

export async function fetchProfile(id: string): Promise<Profile> {
  const { data } = await api.get<Profile>(`/users/${id}`);
  return data;
}

export async function updateMyProfile(payload: UpdateProfilePayload): Promise<Profile> {
  const { data } = await api.patch<Profile>("/users/me", payload);
  return data;
}
