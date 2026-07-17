/**
 * Dashboard renderer schema — re-exports from the skill-local canonical
 * dashboard-types module at shared/dashboard-types.ts.
 *
 * All dashboard data types are defined there as the single source of truth
 * for the contract between the genomic pipeline and dashboard renderer.
 */

export type {
  DashboardData, Meta, Gli, InnateStrength,
  Category, CategorySubitem, StatusColor,
  Insight, ActionItem, ActionPriority,
  Protocol, ProtocolPhase,
  Ancestry, AncestryRegion,
  ClinVarVariantCard, PRSScore, GeneticVariantsSection,
  VEPMissenseCall, VEPMissenseSection,
  PRSWellnessScore, PRSExpandedSection,
  SignificanceColor, VariantCategory,
  MultiModalPlan, ModalityCard, BiomarkerDomain, WearableDomain,
  HealthDataModality, ModalityStatus, UploadPathStep,
  SignalStatus, CrossModalAction,
  BiomarkerFinding, BiomarkerDomainScore, BiomarkerAnalysisSummary,
  WearableFinding, WearableDomainScore, WearableAnalysisSummary,
} from '../../shared/dashboard-types.js';
