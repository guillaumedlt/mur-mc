import { NextResponse } from "next/server";

/**
 * API Route : genere un message recruteur via Claude API.
 * POST /api/ai/generate-message
 * Body: { templateId, candidateName, recruiterName, jobTitle }
 */
export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 },
    );
  }

  const body = await request.json();
  const { templateId, candidateName, recruiterName, jobTitle } = body;

  const systemPrompt = `Tu es un assistant RH pour un job board a Monaco (Mur.mc).
Tu generes des messages professionnels et bienveillants en francais.
Le recruteur s'appelle ${recruiterName}.
Le candidat s'appelle ${candidateName}.
Le poste est : ${jobTitle}.
Sois concis, professionnel, et chaleureux. Pas de formules trop formelles.
Ne mets pas de sujet de mail, juste le corps du message.`;

  const userPrompts: Record<string, string> = {
    "interview-propose": `Genere un message pour proposer un premier entretien au candidat. Propose 3 creneaux cette semaine.`,
    "interview-visio": `Genere un message pour proposer un entretien en visio. Mentionne que le lien sera envoye 24h avant.`,
    "hold-patience": `Genere un message pour informer le candidat que le processus est en cours et qu'il reste dans la shortlist.`,
    "hold-complement": `Genere un message pour demander des informations complementaires (references + pretentions salariales).`,
    "reject-soft": `Genere un message de refus bienveillant. Remercie pour le temps, explique que d'autres profils correspondent mieux, et propose de garder le profil pour le futur.`,
    "reject-overqualified": `Genere un message de refus en expliquant que le candidat est surqualifie pour ce poste.`,
    "offer-send": `Genere un message pour annoncer que la candidature est retenue et proposer un dernier echange pour discuter des conditions.`,
  };

  const userPrompt = userPrompts[templateId] ?? `Genere un message professionnel pour le candidat a propos du poste.`;

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
        max_tokens: 500,
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
    const text =
      data.content?.[0]?.text ?? "Erreur : pas de reponse generee.";

    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json(
      { error: `Fetch error: ${String(err)}` },
      { status: 500 },
    );
  }
}
