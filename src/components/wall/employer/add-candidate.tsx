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
import {
  addManualCandidate,
  importCandidatesFromCsv,
  useEmployer,
} from "@/lib/employer-store";

type Tab = "manual" | "csv";

export function AddCandidate() {
  const user = useUser();
  const { jobs } = useEmployer();
  const [tab, setTab] = useState<Tab>("manual");

  if (!user || user.role !== "employer") return null;

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

        {/* Tab toggle */}
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
        <ManualForm jobs={jobs} userName={user.name} />
      ) : (
        <CsvImport jobs={jobs} userName={user.name} />
      )}
    </div>
  );
}

/* ─── Formulaire manuel ──────────────────────────────────── */

function ManualForm({
  jobs,
  userName,
}: {
  jobs: ReturnType<typeof useEmployer>["jobs"];
  userName: string;
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

  const palette = [
    "#1C3D5A", "#7c1d2c", "#0a4d3a", "#062b3e", "#6B4423",
  ];

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const nameParts = name.trim().split(/\s+/);
    const initials =
      nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : name.trim().slice(0, 2).toUpperCase();

    addManualCandidate({
      fullName: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      location: location.trim() || undefined,
      headline: headline.trim() || undefined,
      skills: skills
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean),
      languages: languages
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean),
      sectors: [],
      avatarColor: palette[Math.floor(Math.random() * palette.length)],
      initials,
      jobId: jobId || undefined,
      coverLetter: coverLetter.trim() || undefined,
      addedBy: userName,
    });
    setDone(true);
  };

  if (done) {
    return (
      <div className="bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
        <BadgeCheck
          width={26}
          height={26}
          strokeWidth={2}
          className="text-[var(--accent)] inline-block"
        />
        <p className="font-display text-[22px] tracking-[-0.01em] text-foreground mt-4">
          Candidat ajouté
        </p>
        <p className="text-[13px] text-muted-foreground mt-2">
          {name} a été ajouté dans le pipeline.
        </p>
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            type="button"
            onClick={() => {
              setDone(false);
              setName("");
              setEmail("");
              setPhone("");
              setLocation("");
              setHeadline("");
              setSkills("");
              setLanguages("");
              setCoverLetter("");
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
        <Field icon={Phone} label="Téléphone" value={phone} onChange={setPhone} placeholder="+377 06 12 34 56" />
        <Field icon={MapPin} label="Lieu" value={location} onChange={setLocation} placeholder="Monaco, Beausoleil…" />
      </div>

      <Field icon={Suitcase} label="Poste / titre" value={headline} onChange={setHeadline} placeholder="Chef de Rang, Concierge…" />
      <Field icon={Suitcase} label="Compétences" value={skills} onChange={setSkills} placeholder="Service, Sommellerie, Anglais… (séparés par des virgules)" />
      <Field icon={Suitcase} label="Langues" value={languages} onChange={setLanguages} placeholder="Français, Anglais, Italien… (séparés par des virgules)" />

      {jobs.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">
            Rattacher à une offre (optionnel)
          </label>
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="wall-select h-10"
          >
            <option value="">Aucune offre</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
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
          placeholder="Contexte, remarques…"
          rows={3}
          className="bg-white border border-[var(--border)] rounded-xl px-3.5 py-3 text-[13.5px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_oklch(0.355_0.066_247_/_0.12)] transition-all leading-[1.6] resize-y"
        />
      </div>

      <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end">
        <button
          type="submit"
          className="h-11 px-5 rounded-xl bg-foreground text-background text-[13.5px] font-medium hover:bg-foreground/85 transition-colors flex items-center gap-2"
        >
          <PlusCircle width={14} height={14} strokeWidth={2} />
          Ajouter le candidat
        </button>
      </div>
    </form>
  );
}

/* ─── Import CSV ─────────────────────────────────────────── */

function CsvImport({
  jobs,
  userName,
}: {
  jobs: ReturnType<typeof useEmployer>["jobs"];
  userName: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [jobId, setJobId] = useState<string>(jobs[0]?.id ?? "");
  const [preview, setPreview] = useState<Array<Record<string, string>> | null>(
    null,
  );
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<number | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const rows = parseCsv(text);
      setPreview(rows);
    };
    reader.readAsText(file);
  };

  const onImport = () => {
    if (!preview) return;
    const count = importCandidatesFromCsv(
      preview,
      jobId || undefined,
      userName,
    );
    setResult(count);
  };

  if (result !== null) {
    return (
      <div className="bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
        <BadgeCheck
          width={26}
          height={26}
          strokeWidth={2}
          className="text-[var(--accent)] inline-block"
        />
        <p className="font-display text-[22px] tracking-[-0.01em] text-foreground mt-4">
          {result} candidat{result > 1 ? "s" : ""} importé{result > 1 ? "s" : ""}
        </p>
        <p className="text-[13px] text-muted-foreground mt-2">
          Depuis {fileName}. Ils sont maintenant dans ton pipeline.
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
            onClick={() => {
              setResult(null);
              setPreview(null);
              setFileName("");
            }}
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
          <code className="font-mono text-[var(--accent)]">nom</code> est
          obligatoire) :
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="text-[11.5px] font-mono border-collapse w-full">
            <thead>
              <tr className="text-foreground/55">
                <th className="text-left py-1 pr-3 border-b border-[var(--border)]">nom</th>
                <th className="text-left py-1 pr-3 border-b border-[var(--border)]">email</th>
                <th className="text-left py-1 pr-3 border-b border-[var(--border)]">telephone</th>
                <th className="text-left py-1 pr-3 border-b border-[var(--border)]">lieu</th>
                <th className="text-left py-1 pr-3 border-b border-[var(--border)]">poste</th>
                <th className="text-left py-1 pr-3 border-b border-[var(--border)]">competences</th>
                <th className="text-left py-1 border-b border-[var(--border)]">langues</th>
              </tr>
            </thead>
            <tbody className="text-foreground/70">
              <tr>
                <td className="py-1 pr-3">Sofia Bianchi</td>
                <td className="py-1 pr-3">sofia@ex.com</td>
                <td className="py-1 pr-3">+377 06…</td>
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
            if (typeof window !== "undefined") {
              const csv = "nom,email,telephone,lieu,poste,competences,langues\nSofia Bianchi,sofia@example.com,+377 06 12 34 56,Monaco,Chef de Rang,\"Service,Anglais\",\"FR,EN,IT\"";
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "modele-import-mur.csv";
              a.click();
              URL.revokeObjectURL(url);
            }
          }}
          className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] text-[var(--accent)] hover:underline underline-offset-2"
        >
          <Download width={11} height={11} strokeWidth={2} />
          Télécharger un modèle CSV
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
          <div className="text-[13px] font-medium text-foreground">
            Choisir un fichier CSV
          </div>
          <div className="text-[11.5px] text-muted-foreground mt-1">
            .csv uniquement
          </div>
        </button>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[13px]">
              <Page width={14} height={14} strokeWidth={2} className="text-foreground/55" />
              <span className="font-medium text-foreground">{fileName}</span>
              <span className="text-muted-foreground">
                · {preview.length} ligne{preview.length > 1 ? "s" : ""}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setFileName("");
              }}
              className="size-7 rounded-full hover:bg-foreground/5 flex items-center justify-center text-foreground/55"
              aria-label="Retirer"
            >
              <Xmark width={12} height={12} strokeWidth={2.2} />
            </button>
          </div>

          {/* Preview table */}
          <div className="rounded-xl border border-[var(--border)] overflow-x-auto max-h-[300px] overflow-y-auto wall-scroll">
            <table className="w-full text-[12px]">
              <thead className="sticky top-0 bg-[var(--background-alt)]">
                <tr>
                  {Object.keys(preview[0] ?? {}).map((k) => (
                    <th
                      key={k}
                      className="text-left py-2 px-3 font-mono font-medium text-foreground/60 border-b border-[var(--border)]"
                    >
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-[var(--border)] last:border-b-0"
                  >
                    {Object.values(row).map((v, j) => (
                      <td
                        key={j}
                        className="py-1.5 px-3 text-foreground/80 truncate max-w-[200px]"
                      >
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
                {preview.length > 20 && (
                  <tr>
                    <td
                      colSpan={Object.keys(preview[0]).length}
                      className="py-2 px-3 text-center text-muted-foreground italic"
                    >
                      … et {preview.length - 20} autres lignes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Job select + import button */}
      {preview && (
        <div className="flex items-end gap-3 pt-3 border-t border-[var(--border)] flex-wrap">
          {jobs.length > 0 && (
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">
                Rattacher à une offre
              </label>
              <select
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="wall-select h-10"
              >
                <option value="">Aucune offre</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="button"
            onClick={onImport}
            className="h-11 px-5 rounded-xl bg-foreground text-background text-[13.5px] font-medium hover:bg-foreground/85 transition-colors flex items-center gap-2"
          >
            <Upload width={14} height={14} strokeWidth={2} />
            Importer {preview.length} candidat
            {preview.length > 1 ? "s" : ""}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── CSV parser simple ──────────────────────────────────── */

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseRow(lines[0]).map((h) =>
    h.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
  );

  return lines.slice(1).map((line) => {
    const values = parseRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (values[i] ?? "").trim();
    });
    return obj;
  });
}

function parseRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/* ─── Field ──────────────────────────────────────────────── */

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
      <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">
        {label}
      </label>
      <div className="wall-input h-10">
        <Icon
          width={14}
          height={14}
          strokeWidth={2}
          className="text-[var(--tertiary-foreground)] shrink-0"
        />
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
