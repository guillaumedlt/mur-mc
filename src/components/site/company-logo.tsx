import type { Company } from "@/lib/data";

export function CompanyLogo({
  company,
  size = 44,
}: {
  company: Company;
  size?: number;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl border border-border bg-secondary font-display font-semibold text-foreground"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
      }}
      aria-hidden
    >
      {company.initials}
    </div>
  );
}
