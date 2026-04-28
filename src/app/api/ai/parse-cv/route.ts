import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAuthorizedEmployer } from "@/lib/supabase/authz";

/**
 * POST /api/ai/parse-cv
 * Body: { text } — plain text extracted from CV
 * Returns: { fullName, headline, skills[], languages[], experienceYears, location, bio }
 * Uses Claude to parse unstructured CV text into structured data.
 *
 * Reserve aux employers admin/recruiter (les viewers en lecture seule sont bloques).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const authz = await getAuthorizedEmployer(supabase, "recruiter");
  if (!authz.ok) return authz.response;
  const { userId } = authz.employer;

  const rl = await checkRateLimit(userId, "parse-cv", "recruiter");
  if (!rl.allowed) {
    return NextResponse.json({ error: "Vous avez depasse votre limite journaliere. Reessayez demain." }, { status: 429 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const body = await request.json();
  const rawText: string | undefined = body?.text;

  if (!rawText || rawText.length < 20) {
    return NextResponse.json({ error: "Texte trop court" }, { status: 400 });
  }

  const { sanitizeForPrompt } = await import("@/lib/ai/sanitize");
  const text = sanitizeForPrompt(rawText, 5000);

  const systemPrompt = `Tu es un parseur de CV pour un job board a Monaco (Monte Carlo Work).
On te donne le texte brut d'un CV. Extrais les informations structurees.

Reponds UNIQUEMENT en JSON valide avec cette structure :
{
  "fullName": "string",
  "headline": "string (titre de poste actuel ou dernier)",
  "skills": ["string", ...] (max 10 competences cles),
  "languages": ["string", ...] (langues parlees),
  "experienceYears": number (estimation),
  "location": "string (ville/pays)",
  "bio": "string (resume professionnel en 2-3 phrases)"
}

Si une information n'est pas trouvable, mets null.
Pas de markdown, pas de texte avant ou apres le JSON.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: "user", content: `Voici le CV a parser :\n\n${text.slice(0, 5000)}` }],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Claude API error" }, { status: 500 });
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text ?? "{}";

    try {
      return NextResponse.json(JSON.parse(rawText));
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        try { return NextResponse.json(JSON.parse(match[0])); } catch { /* fall */ }
      }
      return NextResponse.json({ error: "Parsing failed" }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
