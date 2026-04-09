"use client";

import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Clock,
  HandCard,
  SendMail,
  Sparks,
  Xmark,
} from "iconoir-react";
import { addApplicationEvent, moveApplication } from "@/lib/employer-store";

/* ─── Templates de reponse rapide ────────────────────────── */

type TemplateCategory = "interview" | "rejection" | "hold" | "offer" | "custom";

type Template = {
  id: string;
  category: TemplateCategory;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** Generateur de contenu — recoit le nom du candidat et du recruteur. */
  generate: (candidateName: string, recruiterName: string, jobTitle: string) => string;
  /** Si le template doit aussi changer le statut de la candidature. */
  moveToStatus?: "interview" | "offer" | "rejected";
};

const TEMPLATES: Template[] = [
  {
    id: "interview-propose",
    category: "interview",
    label: "Proposer un entretien",
    icon: Calendar,
    generate: (cand, rec, job) =>
      `Bonjour ${cand.split(" ")[0]},\n\nMerci pour votre candidature au poste de ${job}. Votre profil a retenu notre attention.\n\nSeriez-vous disponible pour un premier echange cette semaine ? Voici quelques creneaux :\n\n- Mardi 10h-11h\n- Mercredi 14h-15h\n- Jeudi 11h-12h\n\nN'hesitez pas a me proposer d'autres disponibilites si cela ne convient pas.\n\nCordialement,\n${rec}`,
    moveToStatus: "interview",
  },
  {
    id: "interview-visio",
    category: "interview",
    label: "Entretien visio",
    icon: Calendar,
    generate: (cand, rec, job) =>
      `Bonjour ${cand.split(" ")[0]},\n\nSuite a l'etude de votre candidature pour le poste de ${job}, nous souhaiterions organiser un entretien en visio.\n\nPouvez-vous me communiquer vos disponibilites pour la semaine prochaine ?\n\nLe lien de connexion vous sera envoye 24h avant.\n\nBien cordialement,\n${rec}`,
    moveToStatus: "interview",
  },
  {
    id: "hold-patience",
    category: "hold",
    label: "Mise en attente",
    icon: Clock,
    generate: (cand, rec, job) =>
      `Bonjour ${cand.split(" ")[0]},\n\nMerci pour votre candidature au poste de ${job}. Nous souhaitons vous informer que le processus de selection est toujours en cours.\n\nVotre profil reste dans notre shortlist et nous reviendrons vers vous des que possible.\n\nN'hesitez pas a nous contacter si vous avez des questions.\n\nCordialement,\n${rec}`,
  },
  {
    id: "hold-complement",
    category: "hold",
    label: "Demander un complement",
    icon: Clock,
    generate: (cand, rec, job) =>
      `Bonjour ${cand.split(" ")[0]},\n\nMerci pour votre interet pour le poste de ${job}.\n\nAvant de poursuivre le processus, pourriez-vous nous fournir :\n- Vos references de vos deux derniers employeurs\n- Vos pretentions salariales\n\nMerci par avance,\n${rec}`,
  },
  {
    id: "reject-soft",
    category: "rejection",
    label: "Refus bienveillant",
    icon: HandCard,
    generate: (cand, rec, job) =>
      `Bonjour ${cand.split(" ")[0]},\n\nMerci d'avoir pris le temps de postuler au poste de ${job}. Apres etude attentive de votre candidature, nous avons decide de poursuivre le processus avec d'autres profils qui correspondent davantage a nos besoins actuels.\n\nCette decision ne remet pas en cause la qualite de votre parcours. Nous conservons votre profil et n'hesiterons pas a revenir vers vous si une opportunite plus adaptee se presente.\n\nNous vous souhaitons bonne continuation dans vos recherches.\n\nCordialement,\n${rec}`,
    moveToStatus: "rejected",
  },
  {
    id: "reject-overqualified",
    category: "rejection",
    label: "Refus (surqualifie)",
    icon: HandCard,
    generate: (cand, rec, job) =>
      `Bonjour ${cand.split(" ")[0]},\n\nMerci pour votre candidature au poste de ${job}. Votre profil est impressionnant, mais nous estimons que ce poste ne serait pas a la hauteur de votre experience et de vos competences.\n\nNous preferons etre transparents plutot que de vous proposer un role qui pourrait s'averer limitant pour votre carriere.\n\nSi un poste plus senior se libere, nous penserons naturellement a vous.\n\nBien a vous,\n${rec}`,
    moveToStatus: "rejected",
  },
  {
    id: "offer-send",
    category: "offer",
    label: "Envoyer une offre",
    icon: Sparks,
    generate: (cand, rec, job) =>
      `Bonjour ${cand.split(" ")[0]},\n\nNous avons le plaisir de vous informer que votre candidature pour le poste de ${job} a ete retenue !\n\nNous souhaitons vous adresser une proposition d'embauche. Seriez-vous disponible pour un dernier echange afin de discuter des conditions ?\n\nDans l'attente de votre retour, n'hesitez pas a nous contacter pour toute question.\n\nFelicitations et a tres bientot,\n${rec}`,
    moveToStatus: "offer",
  },
];

const CATEGORIES: Array<{
  key: TemplateCategory;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}> = [
  { key: "interview", label: "Entretien", icon: Calendar },
  { key: "hold", label: "Mise en attente", icon: Clock },
  { key: "rejection", label: "Refus", icon: HandCard },
  { key: "offer", label: "Offre", icon: Sparks },
];

/* ─── Props ──────────────────────────────────────────────── */

type Props = {
  appId: string;
  candidateName: string;
  recruiterName: string;
  jobTitle: string;
  open: boolean;
  onClose: () => void;
};

export function CandidateMessageModal({
  appId,
  candidateName,
  recruiterName,
  jobTitle,
  open,
  onClose,
}: Props) {
  const [text, setText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Reset on open
  const [prevOpen, setPrevOpen] = useState(false);
  if (open && !prevOpen) {
    setPrevOpen(true);
    setText("");
    setSelectedTemplate(null);
    setGenerating(false);
  }
  if (!open && prevOpen) setPrevOpen(false);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const applyTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setGenerating(true);
    // Simule un petit delai IA (300ms)
    window.setTimeout(() => {
      setText(template.generate(candidateName, recruiterName, jobTitle));
      setGenerating(false);
      inputRef.current?.focus();
    }, 400);
  };

  const onSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    addApplicationEvent(appId, {
      type: "message_sent",
      text: text.trim(),
      by: recruiterName,
    });

    // Auto-move si le template le demande
    if (selectedTemplate?.moveToStatus) {
      moveApplication(appId, selectedTemplate.moveToStatus);
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/15 backdrop-blur-[2px] flex items-start justify-center pt-[6vh] px-4 overflow-y-auto"
      onClick={onClose}
    >
      <form
        onSubmit={onSend}
        className="w-full max-w-[640px] bg-white rounded-2xl border border-[var(--border)] shadow-[0_24px_60px_rgba(10,10,10,0.18)] overflow-hidden mb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <SendMail width={15} height={15} strokeWidth={2} className="text-[var(--accent)] shrink-0" />
            <div className="min-w-0">
              <div className="text-[14px] font-medium text-foreground truncate">
                Message a {candidateName}
              </div>
              <div className="text-[11.5px] text-muted-foreground truncate">
                {jobTitle}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 rounded-full hover:bg-foreground/5 flex items-center justify-center text-foreground/55"
            aria-label="Fermer"
          >
            <Xmark width={13} height={13} strokeWidth={2.2} />
          </button>
        </div>

        {/* Template picker */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background-alt)]/30">
          <div className="flex items-center gap-2 mb-3">
            <Sparks width={12} height={12} strokeWidth={2.2} className="text-[var(--accent)]" />
            <span className="text-[11px] uppercase tracking-[0.09em] font-semibold text-[var(--accent)]">
              Reponses assistees par l&apos;IA
            </span>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {CATEGORIES.map(({ key, label, icon: Icon }) => {
              const count = TEMPLATES.filter((t) => t.category === key).length;
              return (
                <span key={key} className="inline-flex items-center gap-1 text-[10.5px] uppercase tracking-[0.06em] text-foreground/55 font-medium mr-2">
                  <Icon width={10} height={10} strokeWidth={2} />
                  {label} ({count})
                </span>
              );
            })}
          </div>

          {/* Template buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {TEMPLATES.map((t) => {
              const Icon = t.icon;
              const isSelected = selectedTemplate?.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left ${
                    isSelected
                      ? "border-[var(--accent)]/40 bg-[var(--accent)]/[0.06]"
                      : "border-[var(--border)] bg-white hover:border-foreground/20 hover:bg-[var(--background-alt)]"
                  }`}
                >
                  <span
                    className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                      t.category === "rejection"
                        ? "bg-destructive/10 text-destructive"
                        : t.category === "offer"
                          ? "bg-[oklch(0.92_0.12_145_/_0.18)] text-[oklch(0.42_0.13_145)]"
                          : "bg-[var(--accent)]/10 text-[var(--accent)]"
                    }`}
                  >
                    <Icon width={14} height={14} strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-medium text-foreground line-clamp-1">
                      {t.label}
                    </div>
                    {t.moveToStatus && (
                      <div className="text-[10.5px] text-muted-foreground mt-0.5">
                        Deplace automatiquement vers « {statusName(t.moveToStatus)} »
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message body */}
        <div className="px-6 py-5">
          {generating ? (
            <div className="flex items-center gap-3 py-6 justify-center text-[13px] text-muted-foreground">
              <Sparks width={16} height={16} strokeWidth={2} className="text-[var(--accent)] animate-pulse" />
              Generation du message...
            </div>
          ) : (
            <>
              {selectedTemplate && (
                <div className="flex items-center gap-1.5 mb-2 text-[11px] text-[var(--accent)]">
                  <Sparks width={10} height={10} strokeWidth={2.2} />
                  Genere par l&apos;IA — modifiez librement avant d&apos;envoyer
                </div>
              )}
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ecrivez votre message ici, ou selectionnez un modele ci-dessus..."
                rows={8}
                className="w-full bg-white border border-[var(--border)] rounded-xl px-3.5 py-3 text-[13.5px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_oklch(0.355_0.066_247_/_0.12)] transition-all leading-[1.65] resize-y"
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--border)] bg-[var(--background-alt)]/50 flex items-center justify-between gap-3">
          <div className="text-[11px] text-foreground/50">
            {selectedTemplate?.moveToStatus && (
              <span className="inline-flex items-center gap-1">
                Le candidat sera deplace vers « {statusName(selectedTemplate.moveToStatus)} »
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-[12.5px] text-foreground/65 hover:text-foreground transition-colors px-3"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!text.trim() || generating}
              className="h-9 px-4 rounded-xl bg-foreground text-background text-[12.5px] font-medium hover:bg-foreground/85 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              <SendMail width={12} height={12} strokeWidth={2} />
              Envoyer
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function statusName(s: string): string {
  switch (s) {
    case "interview": return "En entretien";
    case "offer": return "Offre envoyee";
    case "rejected": return "Refuse";
    default: return s;
  }
}
