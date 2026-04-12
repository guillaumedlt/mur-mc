/**
 * Hand-drawn SVG decorations — sketchy / "fait crayon" style.
 * Used as playful accents throughout the site.
 */

type Props = { className?: string };

export function DoodleStar({ className }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M32 8c1 8 4 16 12 18-8 2-12 8-13 18-1-9-5-15-12-17 7-2 11-9 13-19z" />
      <path d="M32 8c-.5 4-2 7-4 9" opacity="0.4" />
    </svg>
  );
}

export function DoodleSquiggle({ className }: Props) {
  return (
    <svg
      viewBox="0 0 120 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      className={className}
    >
      <path d="M3 12c8-12 16 12 24 0s16 12 24 0 16 12 24 0 16 12 24 0 16 12 18 4" />
    </svg>
  );
}

export function DoodleArrow({ className }: Props) {
  return (
    <svg
      viewBox="0 0 100 60"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 10c10 5 35 18 60 30 8 4 18 8 28 12" />
      <path d="M82 42c4 5 8 8 11 10M93 52c-3 0-7 0-11 1" />
    </svg>
  );
}

export function DoodleCircle({ className }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      className={className}
    >
      <path d="M50 8c20 1 38 16 40 38 2 22-14 42-38 44C28 92 8 74 8 50 8 28 28 9 50 8z" />
    </svg>
  );
}

export function DoodleUnderline({ className }: Props) {
  return (
    <svg
      viewBox="0 0 240 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      className={className}
    >
      <path d="M4 8c40-6 80-6 116-3 36 3 72 6 116 5" />
      <path d="M8 12c40-2 80-2 110 0" opacity="0.5" />
    </svg>
  );
}

export function DoodleSpark({ className }: Props) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={className}
    >
      <path d="M20 4v10M20 26v10M4 20h10M26 20h10M9 9l6 6M25 25l6 6M31 9l-6 6M9 31l6-6" />
    </svg>
  );
}

export function DoodleYacht({ className }: Props) {
  // Tiny yacht silhouette - signature for Monaco
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14 56h92l-10 14H24L14 56z" />
      <path d="M30 56V32h54v24" />
      <path d="M40 32V18h32v14" />
      <path d="M48 18l8-10 8 10" />
      <path d="M3 70c8 4 16 4 24 0M30 70c8 4 16 4 24 0M57 70c8 4 16 4 24 0M84 70c8 4 16 4 24 0M111 70c2 0 4 0 6 1" opacity="0.6" />
    </svg>
  );
}

export function DoodleConfetti({ className }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={className}
    >
      <path d="M20 20l4 8M60 12l-2 8M82 28l-6 4M14 60l8 2M84 64l-6 6M30 82l4-6M68 84l-4-6" />
      <circle cx="50" cy="50" r="3" />
      <circle cx="22" cy="42" r="2" />
      <circle cx="78" cy="48" r="2" />
      <circle cx="48" cy="80" r="2" />
    </svg>
  );
}
