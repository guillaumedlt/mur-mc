import type { Metadata } from "next";
import { EmployerShell } from "@/components/wall/employer/employer-shell";
import { MagazineAdmin } from "@/components/wall/employer/magazine-admin";

export const metadata: Metadata = {
  title: "Magazine — Admin",
  robots: { index: false, follow: false },
};

export default function MagazineAdminPage() {
  return (
    <EmployerShell>
      <MagazineAdmin />
    </EmployerShell>
  );
}
