import type {
  EmployerApplication,
  EmployerApplicationEvent,
  EmployerApplicationStatus,
  EmployerCandidate,
  EmployerJob,
  TeamMember,
} from "./types";
import { cached, setCached, ensureLoaded, markLoaded, persist, emit, slugify } from "./core";
import { jobsForCompany } from "../data";

/* ─── Seed demo (Pierre Reynaud / SBM Monte-Carlo) ───────────────── */

const FIRST_NAMES = [
  "Sofia", "Lorenzo", "Marie", "Ahmed", "Camille", "Giulia", "Marc",
  "Yasmine", "Thomas", "Lea", "Karim", "Eleonora", "James", "Ines",
  "Paolo", "Sarah", "Andrei", "Clara", "Hugo", "Anais", "Matteo",
  "Olivia", "Rashid", "Leonie", "Vincent", "Beatrice", "Adrien", "Nour",
  "Pierre", "Federica",
];

const LAST_NAMES = [
  "Bianchi", "Rossi", "Dubois", "El Amri", "Conti", "Lefebvre", "Martins",
  "Riva", "Mansouri", "Greco", "Petit", "Ferrari", "Smith", "Bouchareb",
  "Romano", "Bernard", "Ivanov", "Moreno", "Vasseur", "De Luca", "Russo",
  "Garcia", "Hassan", "Marini", "Leger", "Esposito", "Levy", "Khalil",
  "Sanchez", "Galli",
];

const HEADLINES = [
  "Chef de Rang — Restaurant gastronomique",
  "Concierge Clefs d'Or",
  "Receptionniste 5*",
  "Sous-Chef — Cuisine mediterraneenne",
  "Spa Therapist senior",
  "Voiturier-bagagiste",
  "Maitre d'hotel",
  "Responsable Hebergement",
  "Sommelier",
  "Patissier",
  "Chef de Brigade",
  "Hote/sse VIP",
  "Gouvernant·e",
  "Bartender — cocktails signature",
  "F&B Manager",
  "Chef de Reception",
];

const SKILLS_POOL = [
  "Service haut-de-gamme", "Anglais courant", "Italien courant", "Russe",
  "Mandarin", "Sommellerie", "Mixologie", "OperaCloud", "Mews",
  "Salesforce CRM", "Patisserie francaise", "Cuisine mediterraneenne",
  "Service a la russe", "Conciergerie", "Gestion d'equipe", "HACCP",
  "Yield management", "Excel avance", "Etoile Michelin", "Palace",
];

const COVERS = [
  "Bonjour, votre maison fait rever depuis dix ans, et j'aimerais beaucoup contribuer a son service signature.",
  "Apres 6 ans dans un palace parisien, je cherche a m'etablir a Monaco et votre offre correspond exactement a mon projet.",
  "Mon experience en service etoile et ma maitrise du russe et de l'italien me permettraient de m'integrer rapidement.",
  "Je serais ravi·e d'echanger sur cette opportunite — disponible immediatement, mobile sur la Principaute.",
  "Le profil correspond parfaitement a mon parcours et j'ai deja eu l'occasion de croiser certains de vos collaborateurs sur le Grand Prix.",
];

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length];
}

function pickMany<T>(arr: readonly T[], seed: number, count: number): T[] {
  const out: T[] = [];
  for (let k = 0; k < count; k++) out.push(arr[(seed + k * 7) % arr.length]);
  return out;
}

function makeCandidate(i: number): EmployerCandidate {
  const first = pick(FIRST_NAMES, i);
  const last = pick(LAST_NAMES, i + 3);
  const headline = pick(HEADLINES, i + 1);
  const palette = [
    "#1C3D5A", "#7c1d2c", "#0a4d3a", "#062b3e",
    "#6B4423", "#5A2A2A", "#4A3D5A", "#2A4A5A",
  ];
  return {
    id: `emp-cand-${i + 1}`,
    fullName: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase().replace(/\s/g, "")}@example.com`,
    phone: `+377 06 ${10 + (i % 89)} ${20 + (i % 70)} ${30 + (i % 60)} ${40 + (i % 50)}`,
    location: pick(
      ["Monaco", "Beausoleil", "Cap d'Ail", "Roquebrune", "Menton", "Nice"],
      i,
    ),
    headline,
    bio: `${i % 4 === 0 ? "10+" : i % 3 === 0 ? "5-8" : "3-5"} ans d'experience en hotellerie de luxe, dont plusieurs saisons en palace.`,
    experienceYears: 3 + (i % 12),
    skills: pickMany(SKILLS_POOL, i, 4 + (i % 4)),
    languages: pickMany(
      ["Francais", "Anglais", "Italien", "Russe", "Espagnol"],
      i,
      2 + (i % 3),
    ),
    sectors: ["Hôtellerie & Restauration"],
    avatarColor: palette[i % palette.length],
    initials: `${first[0]}${last[0]}`.toUpperCase(),
    linkedinUrl: i % 2 === 0 ? `linkedin.com/in/${slugify(first + " " + last)}` : undefined,
    cvFileName: `${first}_${last}_CV.pdf`.replace(/\s/g, "_"),
    source: "platform",
  };
}

const STATUS_DISTRIBUTION: Array<{
  status: EmployerApplicationStatus;
  weight: number;
}> = [
  { status: "received", weight: 35 },
  { status: "reviewed", weight: 25 },
  { status: "interview", weight: 18 },
  { status: "offer", weight: 8 },
  { status: "hired", weight: 5 },
  { status: "rejected", weight: 9 },
];

function pickStatus(i: number): EmployerApplicationStatus {
  const total = STATUS_DISTRIBUTION.reduce((s, d) => s + d.weight, 0);
  const target = (i * 13 + 7) % total;
  let acc = 0;
  for (const d of STATUS_DISTRIBUTION) {
    acc += d.weight;
    if (target < acc) return d.status;
  }
  return "received";
}

export function seedDemoEmployer(args: {
  companyId: string;
  recruiterName: string;
}): void {
  ensureLoaded();
  if (
    cached.jobs.length > 0 &&
    cached.applications.length > 0 &&
    cached.candidates.length > 0
  )
    return;

  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();

  // 1. EmployerJobs depuis les offres seedees de l'entreprise
  const seedJobs = jobsForCompany(args.companyId);
  const employerJobs: EmployerJob[] = seedJobs.map((j, idx) => {
    const id = `emp-job-seed-${idx + 1}`;
    return {
      id,
      companyId: args.companyId,
      slug: j.slug,
      title: j.title,
      type: j.type,
      level: j.level,
      sector: j.sector,
      location: j.location,
      remote: j.remote,
      workTime: j.workTime,
      lang: j.lang,
      languages: j.languages,
      salaryMin: j.salaryMin,
      salaryMax: j.salaryMax,
      shortDescription: j.shortDescription,
      description: j.description,
      responsibilities: j.responsibilities,
      requirements: j.requirements,
      benefits: j.benefits,
      tags: j.tags,
      status: "published",
      views: 250 + idx * 137 + (j.title.length % 11) * 23,
      createdAt: new Date(now - (15 - idx * 2) * day).toISOString(),
      updatedAt: new Date(now - idx * day).toISOString(),
      fromSeed: true,
      seedJobId: j.id,
    };
  });

  // 2. 30 candidats fake
  const candidates: EmployerCandidate[] = Array.from({ length: 30 }, (_, i) =>
    makeCandidate(i),
  );

  // 3. ~45 applications reparties sur les 5 jobs
  const applications: EmployerApplication[] = [];
  let appIdx = 0;
  const orderCounters: Record<string, Record<EmployerApplicationStatus, number>> =
    {};

  for (let i = 0; i < 45; i++) {
    const job = employerJobs[i % employerJobs.length];
    const candidate = candidates[i % candidates.length];
    const status = pickStatus(i);
    const matchScore = 55 + ((i * 7) % 42);
    const ageDays = (i * 11 + 1) % 21;
    const appliedAt = new Date(now - ageDays * day).toISOString();
    const updatedAt = new Date(
      now - Math.max(0, ageDays - (i % 4)) * day,
    ).toISOString();

    if (!orderCounters[job.id]) {
      orderCounters[job.id] = {
        received: 0,
        shortlisted: 0,
        reviewed: 0,
        interview: 0,
        offer: 0,
        hired: 0,
        rejected: 0,
      };
    }
    const order = orderCounters[job.id][status]++;

    const events: EmployerApplicationEvent[] = [
      {
        id: `evt-${appIdx}-1`,
        type: "received",
        at: appliedAt,
        text: i % 3 === 0 ? "Candidature recue avec lettre" : "Candidature recue",
      },
    ];
    if (status !== "received") {
      events.push({
        id: `evt-${appIdx}-2`,
        type: "cv_viewed",
        at: new Date(now - Math.max(0, ageDays - 1) * day).toISOString(),
        by: args.recruiterName,
      });
    }
    if (
      status === "interview" ||
      status === "offer" ||
      status === "hired"
    ) {
      events.push({
        id: `evt-${appIdx}-3`,
        type: "interview_scheduled",
        at: new Date(now - Math.max(0, ageDays - 3) * day).toISOString(),
        by: args.recruiterName,
        text: `Entretien planifie — ${["lundi 10h", "mardi 14h", "mercredi 11h", "jeudi 16h"][i % 4]}`,
      });
    }
    if (status === "offer" || status === "hired") {
      events.push({
        id: `evt-${appIdx}-4`,
        type: "offer_sent",
        at: new Date(now - Math.max(0, ageDays - 5) * day).toISOString(),
        by: args.recruiterName,
        text: "Offre envoyee par email",
      });
    }
    if (status === "hired") {
      events.push({
        id: `evt-${appIdx}-5`,
        type: "hired",
        at: new Date(now - Math.max(0, ageDays - 7) * day).toISOString(),
        by: args.recruiterName,
        text: "Embauche confirmee",
      });
    }
    if (status === "rejected") {
      events.push({
        id: `evt-${appIdx}-6`,
        type: "rejected",
        at: updatedAt,
        by: args.recruiterName,
      });
    }

    applications.push({
      id: `emp-app-${i + 1}`,
      jobId: job.id,
      candidateId: candidate.id,
      status,
      matchScore,
      rating: i % 5 === 0 ? 4 : i % 6 === 0 ? 5 : 0,
      appliedAt,
      updatedAt,
      coverLetter: i % 3 === 0 ? COVERS[i % COVERS.length] : undefined,
      events,
      order,
    });
    appIdx++;
  }

  // 4. Equipe seedee
  const now2 = new Date().toISOString();
  const team: TeamMember[] = [
    {
      id: "team-1",
      fullName: args.recruiterName,
      email: "p.reynaud@montecarlosbm.com",
      role: "admin",
      avatarColor: "#7c1d2c",
      initials: args.recruiterName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
      addedAt: new Date(now - 60 * day).toISOString(),
      lastActiveAt: now2,
    },
    {
      id: "team-2",
      fullName: "Sophie Martin",
      email: "s.martin@montecarlosbm.com",
      role: "recruiter",
      avatarColor: "#1C3D5A",
      initials: "SM",
      addedAt: new Date(now - 45 * day).toISOString(),
      lastActiveAt: new Date(now - 1 * day).toISOString(),
    },
    {
      id: "team-3",
      fullName: "Lucas Ferri",
      email: "l.ferri@montecarlosbm.com",
      role: "viewer",
      avatarColor: "#0a4d3a",
      initials: "LF",
      addedAt: new Date(now - 20 * day).toISOString(),
    },
  ];

  setCached({
    jobs: employerJobs,
    candidates,
    applications,
    companyProfile: null,
    team,
    onboarding: {
      completed: [
        "company_created",
        "profile_completed",
        "first_job_published",
        "team_invited",
        "company_page_customized",
      ],
    },
  });
  markLoaded();
  persist();
  emit();
}
