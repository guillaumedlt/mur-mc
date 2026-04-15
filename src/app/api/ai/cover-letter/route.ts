import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/ai/cover-letter
 * Rate limited: 3/day free, 30/day pro.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const rl = checkRateLimit(user.id, "cover-letter", "free");
  if (!rl.allowed) {
    return NextResponse.json({ error: "Limite atteinte (3/jour). Passez Pro pour plus." }, { status: 429 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });

  const body = await request.json();
  const { jobTitle, companyName, candidateName, headline, skills, bio } = body;

  const systemPrompt = `Tu es un assistant carriere pour un job board a Monaco (Mur.mc).
Tu rediges des lettres de motivation courtes, percutantes et personnalisees en francais.
Pas de formules creuses ou trop formelles. Ton professionnel mais authentique.
3-4 paragraphes maximum. Pas de "Madame, Monsieur" — commence directement.
Mentionne le poste et l'entreprise specifiquement.`;

  const userPrompt = `Redige une lettre de motivation pour :
- Poste : ${jobTitle}
- Entreprise : ${companyName}
- Candidat : ${candidateName}
- Profil : ${headline || ""}
- Competences : ${(skills || []).join(", ")}
- Bio : ${bio || ""}`;

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
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) return NextResponse.json({ error: "Claude API error" }, { status: 500 });
    const data = await response.json();
    return NextResponse.json({ text: data.content?.[0]?.text ?? "" });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
