import { ImageResponse } from "next/og";
import { fetchJobBySlug } from "@/lib/supabase/queries";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export default async function OgImage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const job = await fetchJobBySlug(slug);

  if (!job) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#FAFAF7",
            fontSize: 56,
            fontWeight: 500,
            color: "#0A0A0A",
            letterSpacing: "-0.025em",
            fontFamily: "ui-serif, Georgia, serif",
          }}
        >
          Monte Carlo Work
        </div>
      ),
      size,
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 70px",
          background: "#FAFAF7",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#0A0A0A",
                color: "#FAFAF7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "-0.04em",
                fontFamily: "ui-serif, Georgia, serif",
              }}
            >
              MC
            </div>
            <span
              style={{
                fontSize: 22,
                color: "#0A0A0A",
                fontWeight: 500,
                letterSpacing: "-0.015em",
              }}
            >
              Monte Carlo Work
            </span>
          </div>
          <div
            style={{
              fontSize: 16,
              color: "#1C3D5A",
              background: "rgba(28, 61, 90, 0.08)",
              padding: "6px 16px",
              borderRadius: 999,
              fontWeight: 500,
            }}
          >
            {job.type} · {job.sector}
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: 52,
              fontWeight: 400,
              color: "#0A0A0A",
              lineHeight: 1.1,
              maxWidth: "900px",
            }}
          >
            {job.title}
          </div>
          <div style={{ fontSize: 24, color: "#6B6B6B", fontWeight: 500 }}>
            {job.company.name} · {job.location}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #E8E6E0",
            paddingTop: 24,
          }}
        >
          <span style={{ fontSize: 16, color: "#A8A8A8" }}>
            montecarlowork.com/jobs/{job.slug}
          </span>
          <span style={{ fontSize: 16, color: "#A8A8A8" }}>
            Le job board de la Principaute de Monaco
          </span>
        </div>
      </div>
    ),
    size,
  );
}
