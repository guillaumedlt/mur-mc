"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthResult = {
  error?: string;
  success?: boolean;
};

/**
 * Inscription par email/password.
 * Cree le user dans Supabase Auth → le trigger `on_auth_user_created`
 * cree automatiquement le profil dans `profiles`.
 */
export async function signUpAction(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const fullName = (formData.get("fullName") as string)?.trim();
  const role = (formData.get("role") as string) || "candidate";

  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
  }
  if (password.length < 6) {
    return { error: "Le mot de passe doit faire au moins 6 caracteres." };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || email.split("@")[0],
        role,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://hellowork-monaco.vercel.app"}/auth/callback`,
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Cet email est deja utilise. Connectez-vous." };
    }
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Connexion par email/password.
 */
export async function signInAction(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("Invalid login")) {
      return { error: "Email ou mot de passe incorrect." };
    }
    return { error: error.message };
  }

  // Redirect cote serveur apres login reussi
  // On determine la destination en fonction du role stocke dans user_metadata
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role;

  if (role === "employer") {
    redirect("/recruteur");
  } else {
    redirect("/candidat");
  }
}

/**
 * Deconnexion.
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * Demande de reinitialisation de mot de passe.
 */
export async function resetPasswordAction(
  formData: FormData,
): Promise<AuthResult> {
  const supabase = await createClient();
  const email = (formData.get("email") as string)?.trim();

  if (!email) {
    return { error: "Email requis." };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://hellowork-monaco.vercel.app"}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
