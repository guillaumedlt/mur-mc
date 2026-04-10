import { Search, LayoutGrid, ChevronDown } from "lucide-react";
import { sectors } from "@/lib/data";
import { type Locale, lhref } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n/dict";

export function SearchBar({
  locale,
  defaultQ = "",
  defaultSector = "",
}: {
  locale: Locale;
  defaultQ?: string;
  defaultSector?: string;
}) {
  const t = getDict(locale).search;
  return (
    <form
      action={lhref(locale, "/jobs")}
      method="get"
      className="hw-shadow-card flex w-full flex-col items-stretch gap-1 rounded-2xl border border-border bg-card p-1.5 sm:flex-row sm:items-center sm:rounded-full"
    >
      <label className="flex flex-1 items-center gap-3 rounded-xl px-5 sm:rounded-full">
        <Search
          className="h-[18px] w-[18px] shrink-0 text-muted-foreground"
          strokeWidth={2}
        />
        <input
          name="q"
          defaultValue={defaultQ}
          placeholder={t.keyword}
          className="w-full bg-transparent py-3.5 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
        />
      </label>

      <div className="hidden h-8 w-px bg-border sm:block" />

      <label className="relative flex flex-1 items-center gap-3 rounded-xl px-5 sm:rounded-full">
        <LayoutGrid
          className="h-[18px] w-[18px] shrink-0 text-muted-foreground"
          strokeWidth={2}
        />
        <select
          name="sector"
          defaultValue={defaultSector}
          className="w-full cursor-pointer appearance-none bg-transparent py-3.5 pr-7 text-[15px] text-foreground outline-none"
        >
          <option value="">{t.sector}</option>
          {sectors.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-5 h-4 w-4 text-muted-foreground"
          strokeWidth={2}
        />
      </label>

      <button
        type="submit"
        className="m-1 rounded-xl bg-accent px-7 py-3.5 text-[14px] font-semibold text-accent-foreground transition hover:bg-[var(--accent-hover)] sm:m-0 sm:rounded-full"
      >
        {t.submit}
      </button>
    </form>
  );
}
