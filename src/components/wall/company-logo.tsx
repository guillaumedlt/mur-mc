"use client";

import { useState } from "react";

type Props = {
  name: string;
  domain?: string;
  color: string;
  initials: string;
  size?: number;
  radius?: number;
};

/**
 * Tile logo entreprise. Essaie successivement plusieurs sources de favicons
 * publiques (Google haute résolution, puis DuckDuckGo). Si tout échoue,
 * retombe sur une tile colorée avec les initiales — toujours quelque chose
 * à afficher, jamais de carré vide.
 */
export function CompanyLogo({
  name,
  domain,
  color,
  initials,
  size = 44,
  radius = 14,
}: Props) {
  const sources = domain ? buildSources(domain) : [];
  const [idx, setIdx] = useState(0);
  const exhausted = idx >= sources.length;
  const showImage = sources.length > 0 && !exhausted;

  return (
    <span
      className="relative inline-flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-black/5"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: showImage
          ? "#ffffff"
          : `linear-gradient(155deg, ${color} 0%, ${shade(color, -18)} 100%)`,
        boxShadow: showImage
          ? "0 1px 0 rgba(255,255,255,0.6) inset, 0 2px 8px -2px rgba(10,10,10,0.10)"
          : "0 1px 0 rgba(255,255,255,0.4) inset, 0 2px 8px -2px rgba(10,10,10,0.18)",
      }}
      aria-label={name}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={sources[idx]}
          src={sources[idx]}
          alt={name}
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          className="object-contain"
          style={{
            width: Math.round(size * 0.78),
            height: Math.round(size * 0.78),
          }}
          onError={() => setIdx((i) => i + 1)}
          loading="lazy"
        />
      ) : (
        <span
          className="font-display text-white font-medium"
          style={{ fontSize: Math.round(size * 0.34) }}
          aria-hidden
        >
          {initials}
        </span>
      )}
    </span>
  );
}

function buildSources(domain: string): string[] {
  return [
    // Google favicons haute résolution (cache global, très rapide)
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    // DuckDuckGo en backup
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  ];
}

/** Assombrit/éclaircit une couleur hex de N% (négatif = plus sombre). */
function shade(hex: string, percent: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const num = parseInt(h, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const adj = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c + (255 * percent) / 100)));
  return `#${[adj(r), adj(g), adj(b)]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`;
}
