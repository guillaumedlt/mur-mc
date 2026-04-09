import type {
  ExperienceBucket,
  Job,
  JobType,
  Locale,
  Sector,
  WorkTime,
} from "@/lib/data";

export type Density = "comfortable" | "standard" | "dense" | "list";
export type SortKey = "recent" | "old" | "company" | "type" | "match";
export type PostedBucket = "today" | "week" | "month" | "all";
export type MatchFilter = "all" | "excellent" | "good";

export type Filters = {
  query: string;
  contracts: Set<JobType>;
  sectors: Set<Sector>;
  experience: Set<ExperienceBucket>;
  langs: Set<Locale>;
  posted: PostedBucket;
  workTimes: Set<WorkTime>;
  matchMin: MatchFilter;
};

export const emptyFilters = (): Filters => ({
  query: "",
  contracts: new Set(),
  sectors: new Set(),
  experience: new Set(),
  langs: new Set(),
  posted: "all",
  workTimes: new Set(),
  matchMin: "all",
});

export const isFiltersActive = (f: Filters) =>
  f.query.length > 0 ||
  f.contracts.size > 0 ||
  f.sectors.size > 0 ||
  f.experience.size > 0 ||
  f.langs.size > 0 ||
  f.posted !== "all" ||
  f.workTimes.size > 0 ||
  f.matchMin !== "all";

export type WithJob = { job: Job };
