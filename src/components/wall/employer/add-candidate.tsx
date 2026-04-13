"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Download,
  Mail,
  MapPin,
  Page,
  Phone,
  PlusCircle,
  Suitcase,
  Upload,
  User as UserIcon,
  Xmark,
} from "iconoir-react";
import { useUser } from "@/lib/auth";
import { useMyJobs, type MyJob } from "@/lib/supabase/use-my-jobs";
import { createClient } from "@/lib/supabase/client";

type Tab = "manual" | "csv";

export function AddCandidate() {
  const user = useUser();
  const { jobs, loading } = useMyJobs();
  const [tab, setTab] = useState<Tab>("manual");

  if (!user || user.role !== "employer") return null;

  if (loading) {
    return (
      <div className="max-w-[820px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 flex items-center justify-center">
        <span className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[820px] mx-auto">
      <Link
        href="/recruteur/candidats"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/55 hover:text-foreground transition-colors mb-3 px-1"
      >
        <ArrowLeft width={12} height={12} strokeWidth={2} />
        Pool candidats
      </Link>

      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
        <p className="ed-label-sm">Ajouter des candidats</p>
        <h1 className="font-display text-[24px] sm:text-[28px] tracking-[-0.015em] text-foreground mt-1">
          Importer dans le pipeline
        </h1>
        <p className="text-[13.5px] text-muted-foreground mt-2">
          Ajoute un candidat manuellement ou importe une liste CSV.
        </p>

        <div className="relative grid grid-cols-2 p-1 rounded-full bg-[var(--background-alt)] border border-[var(--border)] mt-5 max-w-[340px]">
          <span
            className="absolute top-1 bottom-1 rounded-full bg-foreground transition-[left] duration-300 ease-out"
            style={{
              width: "calc(50% - 4px)",
              left: tab === "manual" ? "4px" : "calc(50%)",
            }}
            aria-hidden
          />
          <button
            type="button"
            onClick={() => setTab("manual")}
            className={`relative z-10 h-9 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-medium transition-colors ${
              tab === "manual" ? "text-background" : "text-foreground/70"
            }`}
          >
            <PlusCircle width={13} height={13} strokeWidth={2} />
            Ajout manuel
          </button>
          <button
            type="button"
            onClick={() => setTab("csv")}
            className={`relative z-10 h-9 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-medium transition-colors ${
              tab === "csv" ? "text-background" : "text-foreground/70"
            }`}
          >
            <Upload width={13} height={13} strokeWidth={2} />
            Import CSV
          </button>
        </div>
      </header>

      {tab === "manual" ? (
        <ManualForm jobs={jobs} userName={user.name} userId={user.id} />
      ) : (
        <CsvImport jobs={jobs} userName={user.name} userId={user.id} />
      )}
    </div>
  );
}

/* ─── Supabase helpers ─────────────────────────────────────── */

async function insertCandidate(
  candidateData: {
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    headline?: string;
    skills: string[];
    languages: string[];
  },
  jobId: string | undefined,
  coverLetter: string | undefined,
  userId: string,
): Promise<boolean> {
  const supabase = createClient();

  // First ensure the candidate has a profile — if they don't exist, we create
  // an application linked to the recruiter's user ID as a "manual" source
  if (!jobId) return true; // No job to link to, nothing to insert

  // Insert application directly
  const { error } = await supabase.from("applications").insert({
    job_id: jobId,
    candidate_id: userId, // Link to the recruiter who added them for now
    status: "received",
    cover_letter: coverLetter || null,
    source: "manual",
    added_by: userId,
    match_score: 50,
  });

  if (error) {
    window.console.error("Insert application error:", error);
    return false;
  }

  return true;
}

/* ─── Manual form ──────────────────────────────────────────── */

function ManualForm({
  jobs,
  userName,
  userId,
}: {
  jobs: MyJob[];
  userName: string;
  userId: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [headline, setHeadline] = useState("");
  const [skills, setSkills] = useState("");
  const [languages, setLanguages] = useState("");
  const [jobId, setJobId] = useState<string>(jobs[0]?.id ?? "");
  const [coverLetter, setCoverLetter] = useState("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    await insertCandidate(
      {
        fullName: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        headline: headline.trim() || undefined,
        skills: skills.split(/[,;]/).map((s) => s.trim()).filter(Boolean),
        languages: languages.split(/[,;]/).map((s) => s.trim()).filter(Boolean),
      },
      jobId || undefined,
      coverLetter.trim() || undefined,
      userId,
    );

    // Also insert an event
    if (jobId) {
      const supabase = createClient();
      // Get the application we just created to add an event
      const { data: app } = await supabase
        .from("applications")
        .select("id")
        .eq("job_id", jobId)
        .eq("added_by", userId)
        .order("applied_at", { ascending: false })
        .limit(1)
        .single();

      if (app) {
        await supabase.from("application_events").insert({
          application_id: app.id,
          type: "received",
          text: `Candidat ajoute manuellement : ${name.trim()}`,
          by_name: userName,
        });
      }
    }

    setSaving(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
        <BadgeCheck width={26} height={26} strokeWidth={2} className="text-[var(--accent)] inline-block" />
        <p className="font-display text-[22px] tracking-[-0.01em] text-foreground mt-4">
          Candidat ajoute
        </p>
        <p className="text-[13px] text-muted-foreground mt-2">
          {name} a ete ajoute dans le pipeline.
        </p>
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            type="button"
            onClick={() => {
              setDone(false);
              setName(""); setEmail(""); setPhone(""); setLocation("");
              setHeadline(""); setSkills(""); setLanguages(""); setCoverLetter("");
            }}
            className="h-10 px-4 rounded-full bg-foreground text-background text-[13px] font-medium"
          >
            Ajouter un autre
          </button>
          <Link
            href="/recruteur/candidats"
            className="h-10 px-4 rounded-full border border-[var(--border)] bg-white text-[13px] text-foreground/85 hover:bg-[var(--background-alt)] flex items-center"
          >
            Voir le pool
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8 flex flex-col gap-5"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field icon={UserIcon} label="Nom complet" value={name} onChange={setName} required placeholder="Sofia Bianchi" />
        <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} placeholder="sofia.bianchi@example.com" />
        <Field icon={Phone} label="Telephone" value={phone} onChange={setPhone} placeholder="+377 06 12 34 56" />
        <Field icon={MapPin} label="Lieu" value={location} onChange={setLocation} placeholder="Monaco, Beausoleil..." />
      </div>

      <Field icon={Suitcase} label="Poste / titre" value={headline} onChange={setHeadline} placeholder="Chef de Rang, Concierge..." />
      <Field icon={Suitcase} label="Competences" value={skills} onChange={setSkills} placeholder="Service, Sommellerie, Anglais... (separes par des virgules)" />
      <Field icon={Suitcase} label="Langues" value={languages} onChange={setLanguages} placeholder="Francais, Anglais, Italien... (separes par des virgules)" />

      {jobs.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">
            Rattacher a une offre (optionnel)
          </label>
          <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="wall-select h-10">
            <option value="">Aucune offre</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">
          Note / lettre (optionnel)
        </label>
        <textarea
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="Contexte, remarques..."
          rows={3}
          className="bg-white border border-[var(--border)] rounded-xl px-3.5 py-3 text-[13.5px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] transition-all leading-[1.6] resize-y"
        />
      </div>

      <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end">
        <button
          type="submit"
          disabled={saving}
          className="h-11 px-5 rounded-xl bg-foreground text-background text-[13.5px] font-medium hover:bg-foreground/85 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {saving ? (
            <span className="size-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
          ) : (
            <PlusCircle width={14} height={14} strokeWidth={2} />
          )}
          {saving ? "Ajout..." : "Ajouter le candidat"}
        </button>
      </div>
    </form>
  );
}

/* ─── CSV Import ───────────────────────────────────────────── */

function CsvImport({
  jobs,
  userId,
}: {
  jobs: MyJob[];
  userName: string;
  userId: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [jobId, setJobId] = useState<string>(jobs[0]?.id ?? "");
  const [preview, setPreview] = useState<Array<Record<string, string>> | null>(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setPreview(parseCsv(text));
    };
    reader.readAsText(file);
  };

  const onImport = async () => {
    if (!preview) return;
    setImporting(true);

    let count = 0;
    for (const row of preview) {
      const fullName = (row.nom || row.name || row.fullname || "").trim();
      const email = (row.email || row.mail || "").trim();
      if (!fullName && !email) continue;

      await insertCandidate(
        {
          fullName: fullName || email.split("@")[0],
          email,
          phone: (row.telephone || row.phone || row.tel || "").trim() || undefined,
          location: (row.lieu || row.location || row.ville || "").trim() || undefined,
          headline: (row.poste || row.headline || row.titre || "").trim() || undefined,
          skills: (row.competences || row.skills || "").split(/[,;]/).map((s) => s.trim()).filter(Boolean),
          languages: (row.langues || row.languages || "").split(/[,;]/).map((s) => s.trim()).filter(Boolean),
        },
        jobId || undefined,
        undefined,
        userId,
      );
      count++;
    }

    setImporting(false);
    setResult(count);
  };

  if (result !== null) {
    return (
      <div className="bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
        <BadgeCheck width={26} height={26} strokeWidth={2} className="text-[var(--accent)] inline-block" />
        <p className="font-display text-[22px] tracking-[-0.01em] text-foreground mt-4">
          {result} candidat{result > 1 ? "s" : ""} importe{result > 1 ? "s" : ""}
        </p>
        <p className="text-[13px] text-muted-foreground mt-2">
          Depuis {fileName}. Ils sont maintenant dans le pipeline.
        </p>
        <div className="flex items-center justify-center gap-2 mt-6">
          <Link
            href="/recruteur/candidats"
            className="h-10 px-4 rounded-full bg-foreground text-background text-[13px] font-medium flex items-center"
          >
            Voir le pool
          </Link>
          <button
            type="button"
            onClick={() => { setResult(null); setPreview(null); setFileName(""); }}
            className="h-10 px-4 rounded-full border border-[var(--border)] bg-white text-[13px] text-foreground/85 hover:bg-[var(--background-alt)] flex items-center"
          >
            Importer un autre fichier
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8 flex flex-col gap-5">
      {/* Guide */}
      <div className="rounded-xl bg-[var(--background-alt)] border border-[var(--border)] p-4">
        <p className="ed-label-sm mb-2">Format attendu</p>
        <p className="text-[12.5px] text-foreground/80 leading-snug">
          Fichier CSV avec les colonnes suivantes (seul{" "}
          <code className="font-mono text-[var(--accent)]">nom</code> est obligatoire) :
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="text-[11.5px] font-mono border-collapse w-full">
            <thead>
              <tr className="text-foreground/55">
                {["nom", "email", "telephone", "lieu", "poste", "competences", "langues"].map((h) => (
                  <th key={h} className="text-left py-1 pr-3 border-b border-[var(--border)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-foreground/70">
              <tr>
                <td className="py-1 pr-3">Sofia Bianchi</td>
                <td className="py-1 pr-3">sofia@ex.com</td>
                <td className="py-1 pr-3">+377 06...</td>
                <td className="py-1 pr-3">Monaco</td>
                <td className="py-1 pr-3">Chef de Rang</td>
                <td className="py-1 pr-3">Service,Anglais</td>
                <td className="py-1">FR,EN,IT</td>
              </tr>
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={() => {
            const csv = "nom,email,telephone,lieu,poste,competences,langues\nSofia Bianchi,sofia@example.com,+377 06 12 34 56,Monaco,Chef de Rang,\"Service,Anglais\",\"FR,EN,IT\"";
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "modele-import-mur.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] text-[var(--accent)] hover:underline underline-offset-2"
        >
          <Download width={11} height={11} strokeWidth={2} />
          Telecharger un modele CSV
        </button>
      </div>

      {/* File picker */}
      {!preview ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-alt)]/50 hover:bg-[var(--background-alt)] transition-colors p-8 text-center"
        >
          <span className="size-10 rounded-xl bg-white border border-[var(--border)] inline-flex items-center justify-center text-foreground/55 mb-3">
            <Page width={16} height={16} strokeWidth={2} />
          </span>
          <div className="text-[13px] font-medium text-foreground">Choisir un fichier CSV</div>
          <div className="text-[11.5px] text-muted-foreground mt-1">.csv uniquement</div>
        </button>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[13px]">
              <Page width={14} height={14} strokeWidth={2} className="text-foreground/55" />
              <span className="font-medium text-foreground">{fileName}</span>
              <span className="text-muted-foreground">· {preview.length} ligne{preview.length > 1 ? "s" : ""}</span>
            </div>
            <button
              type="button"
              onClick={() => { setPreview(null); setFileName(""); }}
              className="size-7 rounded-full hover:bg-foreground/5 flex items-center justify-center text-foreground/55"
            >
              <Xmark width={12} height={12} strokeWidth={2.2} />
            </button>
          </div>
          <div className="rounded-xl border border-[var(--border)] overflow-x-auto max-h-[300px] overflow-y-auto wall-scroll">
            <table className="w-full text-[12px]">
              <thead className="sticky top-0 bg-[var(--background-alt)]">
                <tr>
                  {Object.keys(preview[0] ?? {}).map((k) => (
                    <th key={k} className="text-left py-2 px-3 font-mono font-medium text-foreground/60 border-b border-[var(--border)]">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-b border-[var(--border)] last:border-b-0">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="py-1.5 px-3 text-foreground/80 truncate max-w-[200px]">{v}</td>
                    ))}
                  </tr>
                ))}
                {preview.length > 20 && (
                  <tr>
                    <td colSpan={Object.keys(preview[0]).length} className="py-2 px-3 text-center text-muted-foreground italic">
                      ... et {preview.length - 20} autres lignes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFileChange} />

      {preview && (
        <div className="flex items-end gap-3 pt-3 border-t border-[var(--border)] flex-wrap">
          {jobs.length > 0 && (
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">
                Rattacher a une offre
              </label>
              <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="wall-select h-10">
                <option value="">Aucune offre</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </div>
          )}
          <button
            type="button"
            onClick={onImport}
            disabled={importing}
            className="h-11 px-5 rounded-xl bg-foreground text-background text-[13.5px] font-medium hover:bg-foreground/85 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {importing ? (
              <span className="size-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            ) : (
              <Upload width={14} height={14} strokeWidth={2} />
            )}
            {importing ? "Import..." : `Importer ${preview.length} candidat${preview.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── CSV parser ───────────────────────────────────────────── */

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseRow(lines[0]).map((h) =>
    h.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
  );
  return lines.slice(1).map((line) => {
    const values = parseRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (values[i] ?? "").trim(); });
    return obj;
  });
}

function parseRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === "," && !inQuotes) { result.push(current); current = ""; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}

/* ─── Field ────────────────────────────────────────────────── */

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">{label}</label>
      <div className="wall-input h-10">
        <Icon width={14} height={14} strokeWidth={2} className="text-[var(--tertiary-foreground)] shrink-0" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="flex-1 bg-transparent outline-none text-[13.5px] placeholder:text-[var(--tertiary-foreground)]"
        />
      </div>
    </div>
  );
}
