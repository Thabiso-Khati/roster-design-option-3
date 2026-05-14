"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const email    = (formData.get("email")    as string)?.trim();
  const password =  formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { error: "Please confirm your email address first — check your inbox." };
    }
    if (error.message.toLowerCase().includes("invalid login")) {
      return { error: "Incorrect email or password. Please try again." };
    }
    return { error: error.message };
  }

  // Session is now set in the server response cookies — redirect happens server-side.
  redirect("/dashboard");
}
