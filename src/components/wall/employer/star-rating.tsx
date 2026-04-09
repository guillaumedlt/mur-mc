"use client";

import { StarSolid, Star } from "iconoir-react";

type Props = {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
};

/**
 * 5 étoiles cliquables. Si `onChange` est fourni, elles sont interactives.
 * Sinon, elles sont en lecture seule.
 */
export function StarRating({ value, onChange, size = 14 }: Props) {
  return (
    <div className="inline-flex items-center gap-0.5" role="radiogroup" aria-label="Note">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        return onChange ? (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n === value ? 0 : n)}
            className="hover:scale-110 transition-transform"
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
          >
            {filled ? (
              <StarSolid
                width={size}
                height={size}
                className="text-amber-500"
              />
            ) : (
              <Star
                width={size}
                height={size}
                strokeWidth={2}
                className="text-foreground/30 hover:text-amber-400 transition-colors"
              />
            )}
          </button>
        ) : (
          <span key={n} aria-hidden>
            {filled ? (
              <StarSolid
                width={size}
                height={size}
                className="text-amber-500"
              />
            ) : (
              <Star
                width={size}
                height={size}
                strokeWidth={2}
                className="text-foreground/20"
              />
            )}
          </span>
        );
      })}
    </div>
  );
}

/**
 * Version compacte en lecture seule : affiche "★ N" sous forme de badge.
 */
export function StarRatingCompact({ value }: { value: number }) {
  if (value <= 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-[10.5px] text-amber-600">
      <StarSolid width={10} height={10} className="text-amber-500" />
      {value}
    </span>
  );
}
