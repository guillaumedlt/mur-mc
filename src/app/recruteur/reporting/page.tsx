import type { Metadata } from "next";
import { EmployerShell } from "@/components/wall/employer/employer-shell";
import { ReportingDashboard } from "@/components/wall/employer/reporting-dashboard";

export const metadata: Metadata = {
  title: "Reporting — Monte Carlo Work",
  robots: { index: false, follow: false },
};

export default function ReportingPage() {
  return (
    <EmployerShell>
      <ReportingDashboard />
    </EmployerShell>
  );
}
