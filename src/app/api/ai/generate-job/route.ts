import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * API Route : genere une fiche de poste complete via Claude API.
 * POST /api/ai/generate-job
 * Body: { title, contract, level, sector, location, remote, workTime, salaryMin?, salaryMax?, companyName, lang, freePrompt? }
 *
 * Retourne : { shortDescription, description, responsibilities[], requirements[], benefits[], tags[] }
 * Protegee : requiert un user Supabase authentifie.
 */
export async function POST(request: Request) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  const {
    title,
    contract,
    level,
    sector,
    location,
    remote,
    workTime,
    salaryMin,
    salaryMax,
    companyName,
    lang,
    freePrompt,
  } = body;

  const salaryHint =
    salaryMin || salaryMax
      ? `Fourchette salariale : ${salaryMin ? salaryMin + " EUR" : "?"} - ${salaryMax ? salaryMax + " EUR" : "?"} brut annuel.`
      : "";

  const freeHint = freePrompt?.trim()
    ? `\n\nInstructions supplementaires du recruteur :\n"${freePrompt.trim()}"`
    : "";

  const systemPrompt = `Tu es un expert RH senior specialise dans la redaction d'offres d'emploi pour un job board premium a Monaco (Mur.mc).
Tu rediges en ${lang === "en" ? "anglais" : "francais"}, ton professionnel mais accessible — pas de jargon corporate creux.
Tu connais bien le marche monegasque : banques privees, palaces, yachting, luxe, family offices.

Tu dois generer une fiche de poste COMPLETE et REALISTE pour le poste decrit.

IMPORTANT :
- Les responsabilites doivent etre specifiques au metier, pas generiques
- Les competences recherchees doivent correspondre au niveau d'experience demande
- Les avantages doivent etre realistes pour Monaco
- Les tags doivent etre des mots-cles pertinents pour le SEO et la recherche
- L'accroche (shortDescription) doit donner envie en 2-3 phrases max
- La description doit etre detaillee mais pas trop longue (3-4 paragraphes)

Reponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "shortDescription": "string (2-3 phrases, ton editorial)",
  "description": "string (3-4 paragraphes, contexte + mission + environnement)",
  "responsibilities": ["string", "string", ...] (5-8 items concrets),
  "requirements": ["string", "string", ...] (5-8 items, competences + experience),
  "benefits": ["string", "string", ...] (4-6 items realistes pour Monaco),
  "tags": ["string", "string", ...] (5-8 mots-cles SEO)
}

Pas de markdown, pas de texte avant ou apres le JSON.`;

  const userPrompt = `Genere la fiche de poste pour :
- Titre : ${title}
- Entreprise : ${companyName || "Entreprise monegasque"}
- Contrat : ${contract}
- Niveau : ${level}
- Secteur : ${sector}
- Lieu : ${location || "Monaco"}
- Mode : ${remote}
- Temps : ${workTime}
${salaryHint}${freeHint}`;

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
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
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
    const rawText =
      data.content?.[0]?.text ?? "";

    // Parse le JSON de la reponse
    try {
      const parsed = JSON.parse(rawText);
      return NextResponse.json(parsed);
    } catch {
      // Si le parsing echoue, essayer d'extraire le JSON du texte
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return NextResponse.json(parsed);
        } catch {
          return NextResponse.json(
            { error: "Reponse IA invalide", raw: rawText },
            { status: 500 },
          );
        }
      }
      return NextResponse.json(
        { error: "Reponse IA invalide", raw: rawText },
        { status: 500 },
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Fetch error: ${String(err)}` },
      { status: 500 },
    );
  }
}
