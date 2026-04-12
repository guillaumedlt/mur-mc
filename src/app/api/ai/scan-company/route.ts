import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * API Route : scanne un domaine d'entreprise et genere une description via Claude.
 * POST /api/ai/scan-company
 * Body: { domain }
 * Protegee : requiert un user Supabase authentifie.
 */
export async function POST(request: Request) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 },
    );
  }

  const body = await request.json();
  const { domain } = body;

  if (!domain) {
    return NextResponse.json({ error: "domain required" }, { status: 400 });
  }

  const systemPrompt = `Tu es un assistant pour un job board a Monaco (Mur.mc).
On te donne un nom de domaine d'entreprise. A partir de ce domaine, genere :
1. Une description d'entreprise (150 mots max, en francais, ton professionnel mais pas corporate)
2. Un positionnement marche (100 mots max)
3. Le secteur principal (parmi : Banque & Finance, Yachting, Hotellerie & Restauration, Luxe & Retail, Tech & Digital, Immobilier, Juridique, Sport & Bien-etre, Evenementiel, Autre)
4. La taille estimee (1-10, 10-50, 50-200, 200-500, 500+)

Reponds UNIQUEMENT en JSON valide avec les cles : description, positioning, sector, size
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
        messages: [
          {
            role: "user",
            content: `Domaine de l'entreprise : ${domain}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json(
        { error: `Claude API error: ${err}` },
        { status: 500 },
      );
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text ?? "{}";

    // Parse le JSON de la reponse
    try {
      const parsed = JSON.parse(rawText);
      return NextResponse.json(parsed);
    } catch {
      // Si le parse echoue, retourner le texte brut comme description
      return NextResponse.json({
        description: rawText,
        positioning: "",
        sector: "Autre",
        size: "10-50",
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Fetch error: ${String(err)}` },
      { status: 500 },
    );
  }
}
