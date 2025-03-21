"use server";

import { signIn, signOut } from "@/auth";

export const login = async (provider?: string) => {
  try {
    await signIn(provider, {
      redirectTo: "/playground",
      redirect: true,
    });
  } catch (error) {
    console.error("Authentication error:", error);
    throw error; // Let the client handle the error
  }
};

export const logout = async () => {
  try {
    await signOut({ redirectTo: "/" });
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};