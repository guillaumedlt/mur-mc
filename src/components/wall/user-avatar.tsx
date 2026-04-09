"use client";

import type { AuthUser } from "@/lib/auth";
import { useCandidate } from "@/lib/candidate-store";

type Props = {
  user: AuthUser;
  size?: number;
  radius?: number;
  /** Si true, on désactive le gradient (texte plat sur fond uni). */
  flat?: boolean;
};

/**
 * Avatar utilisateur. Si l'user est un candidat avec une `avatarDataUrl`,
 * on affiche la photo. Sinon, fallback dégradé + initiales.
 */
export function UserAvatar({ user, size = 40, radius, flat = false }: Props) {
  const { profile } = useCandidate();
  const avatar = user.role === "candidate" ? profile.avatarDataUrl : undefined;
  const r = radius ?? (size <= 32 ? 999 : Math.round(size * 0.28));

  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar}
        alt={user.name}
        width={size}
        height={size}
        className="object-cover ring-1 ring-black/5 shadow-[0_2px_10px_-2px_rgba(10,10,10,0.18)]"
        style={{
          width: size,
          height: size,
          borderRadius: r,
        }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center text-white font-display font-medium ring-1 ring-black/5 shadow-[0_2px_10px_-2px_rgba(10,10,10,0.18)] shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: r,
        fontSize: Math.max(11, Math.round(size * 0.34)),
        background: flat
          ? user.avatarColor
          : `linear-gradient(155deg, ${user.avatarColor}, #122a3f)`,
      }}
    >
      {user.initials}
    </span>
  );
}
