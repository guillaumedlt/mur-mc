/**
 * Articles editoriaux du magazine Mur.mc.
 * Types et helpers — les donnees viendront de Supabase.
 */

export type StoryCategory =
  | "Marché"
  | "Métier"
  | "Profil"
  | "Coulisses"
  | "Données";

export type Story = {
  id: string;
  slug: string;
  category: StoryCategory;
  title: string;
  excerpt: string;
  lead: string;
  body: Array<
    | { type: "p"; text: string }
    | { type: "h2"; text: string }
    | { type: "quote"; text: string; author?: string }
    | { type: "table"; headers: string[]; rows: string[][] }
    | { type: "stats"; items: Array<{ label: string; value: string }> }
    | { type: "list"; items: string[] }
    | { type: "callout"; text: string; tone?: "info" | "warning" | "tip" }
  >;
  authorName: string;
  authorRole: string;
  publishedAt: string;
  updatedAt?: string;
  readingMinutes: number;
  featured?: boolean;
  tags: string[];
};

export function storyCover(story: Story, w = 1600, h = 900): string {
  return `https://picsum.photos/seed/story-${story.slug}/${w}/${h}`;
}

export const stories: Story[] = [];

export function getStory(slug: string): Story | undefined {
  return stories.find((s) => s.slug === slug);
}

export function relatedStories(story: Story, limit = 3): Story[] {
  return stories
    .filter((s) => s.id !== story.id && s.category === story.category)
    .concat(
      stories.filter(
        (s) => s.id !== story.id && s.category !== story.category,
      ),
    )
    .slice(0, limit);
}

export function formatStoryDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
