import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_STATUS = new Set(["new", "contacted", "converted", "rejected"]);

/**
 * GET /api/admin/contacts
 * Returns the latest contact_requests (recruiter signup leads). Admin-only.
 */
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("contact_requests")
    .select(
      "id, company_name, contact_name, email, phone, message, plan, status, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[admin.contacts.list]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({
    requests: (data ?? []).map((r) => ({
      id: r.id,
      companyName: r.company_name,
      contactName: r.contact_name,
      email: r.email,
      phone: r.phone,
      message: r.message,
      plan: r.plan,
      status: r.status,
      createdAt: r.created_at,
    })),
  });
}

/**
 * POST /api/admin/contacts
 * Body: { id: string, status: "new" | "contacted" | "converted" | "rejected" }
 */
export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let body: { id?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const id = typeof body?.id === "string" ? body.id : null;
  const status = typeof body?.status === "string" ? body.status : null;
  if (!id || !status || !ALLOWED_STATUS.has(status)) {
    return NextResponse.json({ error: "Invalid id/status" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("contact_requests")
    .update({ status })
    .eq("id", id);
  if (error) {
    console.error("[admin.contacts.update]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
