"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Lock } from "iconoir-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-[420px] bg-white border border-[var(--border)] rounded-2xl p-8 text-center">
          <BadgeCheck
            width={24}
            height={24}
            strokeWidth={2}
            className="text-[var(--accent)] inline-block"
          />
          <h1 className="font-display text-[24px] tracking-[-0.015em] text-foreground mt-4">
            Mot de passe mis a jour
          </h1>
          <p className="text-[13.5px] text-muted-foreground mt-2">
            Vous pouvez maintenant vous connecter avec votre nouveau mot de
            passe.
          </p>
          <button
            type="button"
            onClick={() => router.push("/connexion")}
            className="h-10 px-5 mt-6 rounded-full bg-foreground text-background text-[13px] font-medium hover:bg-foreground/85 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-[420px] bg-white border border-[var(--border)] rounded-2xl p-8"
      >
        <h1 className="font-display text-[24px] tracking-[-0.015em] text-foreground text-center">
          Nouveau mot de passe
        </h1>
        <p className="text-[13px] text-muted-foreground text-center mt-1.5">
          Choisissez un nouveau mot de passe pour votre compte Mur.mc.
        </p>

        <div className="flex flex-col gap-3 mt-6">
          <label className="wall-input h-11 cursor-text">
            <Lock
              width={14}
              height={14}
              strokeWidth={2}
              className="text-[var(--tertiary-foreground)] shrink-0"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nouveau mot de passe"
              required
              minLength={6}
              autoComplete="new-password"
              className="flex-1 bg-transparent outline-none text-[13.5px] placeholder:text-[var(--tertiary-foreground)]"
            />
          </label>
          <label className="wall-input h-11 cursor-text">
            <Lock
              width={14}
              height={14}
              strokeWidth={2}
              className="text-[var(--tertiary-foreground)] shrink-0"
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirmer le mot de passe"
              required
              minLength={6}
              autoComplete="new-password"
              className="flex-1 bg-transparent outline-none text-[13.5px] placeholder:text-[var(--tertiary-foreground)]"
            />
          </label>

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-2.5 text-[12.5px] text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-11 rounded-xl bg-foreground text-background text-[13.5px] font-medium hover:bg-foreground/85 disabled:opacity-60 disabled:cursor-wait transition-colors"
          >
            {loading ? "Mise a jour..." : "Mettre a jour"}
          </button>
        </div>
      </form>
    </div>
  );
}
