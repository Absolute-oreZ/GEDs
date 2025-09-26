import { apiRequest } from "../clients/apiClient";
import type { User } from "../types";

export const fetchUserData = async (): Promise<User> => {
  const res = await apiRequest("/users/profile");
  if (!res.ok) throw new Error("Failed to fetch user data");
  return res.json();
};

export const upsertStreamUser = async (userId: string, username: string) => {
  await apiRequest("/stream/users/upsert", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId: userId, username: username }),
  });
};