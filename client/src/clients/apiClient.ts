import { supabaseClient } from "./supabaseClient";

export const apiRequest = async (
  endPoint: string,
  options: RequestInit = {}
) => {
  const {
    data: { session }, 
  } = await supabaseClient.auth.getSession();
  const token = session?.access_token;
  const SERVER_URL = import.meta.env.VITE_SERVER_URL;

  return fetch(SERVER_URL + endPoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
};
