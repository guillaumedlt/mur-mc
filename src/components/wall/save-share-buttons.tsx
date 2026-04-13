"use client";

import { useState } from "react";
import { Bookmark, BookmarkSolid, ShareIos } from "iconoir-react";
import { useSavedJobs } from "@/lib/supabase/use-saved-jobs";

type Props = { jobId: string; jobUrl: string; jobTitle: string };

export function SaveShareButtons({ jobId, jobUrl, jobTitle }: Props) {
  const { isSaved, toggle } = useSavedJobs();
  const saved = isSaved(jobId);
  const [shared, setShared] = useState(false);

  const onShare = async () => {
    if (typeof window === "undefined") return;
    const url = new URL(jobUrl, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title: jobTitle, url });
        return;
      } catch {
        // ignore
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => toggle(jobId)}
        className={`h-9 rounded-xl border text-[12.5px] transition-colors flex items-center justify-center gap-1.5 ${
          saved
            ? "border-[var(--accent)]/40 bg-[var(--accent)]/[0.06] text-[var(--accent)]"
            : "border-[var(--border)] bg-white text-foreground/80 hover:text-foreground hover:bg-[var(--background-alt)]"
        }`}
      >
        {saved ? (
          <BookmarkSolid width={12} height={12} />
        ) : (
          <Bookmark width={12} height={12} strokeWidth={2} />
        )}
        {saved ? "Sauvegardee" : "Sauver"}
      </button>
      <button
        type="button"
        onClick={onShare}
        className="h-9 rounded-xl border border-[var(--border)] bg-white text-[12.5px] text-foreground/80 hover:text-foreground hover:bg-[var(--background-alt)] transition-colors flex items-center justify-center gap-1.5"
      >
        <ShareIos width={12} height={12} strokeWidth={2} />
        {shared ? "Lien copie" : "Partager"}
      </button>
    </div>
  );
}
