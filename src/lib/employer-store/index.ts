"use client";

/**
 * Barrel export — all existing `import { ... } from "@/lib/employer-store"`
 * continue to work without changes.
 */

// Types
export type {
  EmployerJobStatus,
  EmployerJob,
  EmployerApplicationStatus,
  EmployerCandidate,
  EmployerApplicationEventType,
  EmployerApplicationEvent,
  EmployerApplication,
  TeamRole,
  TeamMember,
  CandidateSource,
  OnboardingStep,
  OnboardingState,
  BlockType,
  CompanyBlock,
  EmployerCompanyProfile,
  EmployerState,
} from "./types";

// Core (hook + reset + ownership)
export { useEmployer, resetEmployer, ensureOwnership, setOwnerId } from "./core";

// Jobs CRUD
export { createJob, updateJob, deleteJob, setJobStatus, getEmployerJob } from "./jobs";

// Applications + kanban
export {
  getEmployerApplication,
  applicationsForJob,
  applicationsByStatus,
  moveApplication,
  reorderApplication,
  addApplicationEvent,
  rateApplication,
} from "./applications";

// Company profile
export {
  getCompanyOverride,
  updateCompanyProfile,
  setCoverFromFile,
  removeCover,
} from "./company";

// Blocks CRUD
export {
  getBlocks,
  setBlocks,
  addBlock,
  updateBlock,
  removeBlock,
  moveBlock,
  addImageToBlock,
  removeImageFromBlock,
} from "./blocks";

// Team
export {
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  teamRoleLabel,
} from "./team";

// Manual candidates + CSV import
export { addManualCandidate, importCandidatesFromCsv } from "./candidates";

// Onboarding
export {
  ONBOARDING_STEPS,
  completeOnboardingStep,
  skipOnboarding,
  onboardingProgress,
  scanCompanyDomain,
} from "./onboarding";

// UI helpers
export {
  KANBAN_STATUSES,
  statusLabel,
  statusTone,
  jobStatusLabel,
  jobStatusTone,
  eventLabel,
  blockTypeLabel,
  candidateSourceLabel,
} from "./helpers";

// Seed
export { seedDemoEmployer } from "./seed";
