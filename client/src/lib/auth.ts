import { apiRequest } from "./queryClient";
import { UserProfile } from "./types";
import { API_BASE_URL } from './config';

export async function loginUser(username: string, password: string): Promise<UserProfile> {
  const response = await apiRequest("POST", "/api/auth/login", { username, password });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Login failed");
  }

  return data.user;
}

export async function logoutUser(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error("Failed to get current user");
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}
