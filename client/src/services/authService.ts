import type { Provider } from "@supabase/supabase-js";
import { supabaseClient } from "../clients/supabaseClient";
import { upsertStreamUser } from "./userService";

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Sign in error:", error.message);
  }

  return { data, error };
};

export const signUpWithEmail = async (email: string, password: string) => {
  const siteUrl = import.meta.env.VITE_SITE_URL;
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: siteUrl,
    },
  });

  if (error) {
    console.error("Sign up error:", error.message);
  }

  const user = data.user;

  const userId = user?.id;
  const username = user?.email?.split("@")[0];

  if(!userId || !username){
    throw new Error("User Id or username missing");
  }

  await upsertStreamUser(userId,username);

  return { data, error };
};

export const signInWithProvider = async (provider: Provider) => {
  const siteUrl = import.meta.env.VITE_SITE_URL;
  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${siteUrl}`,
    },
  });

  if (error) {
    console.error(`Sign in with ${provider} error:`, error.message);
  }

  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    console.error("Sign out error:", error.message);
  }

  return { error };
};
