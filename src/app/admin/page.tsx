import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Mur.mc",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export { AdminPanel as default } from "@/components/wall/admin/admin-panel";
