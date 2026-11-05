import { APPLICATION_STAGES, EVIDENCE_STATUSES, type ApplicationRecord, type ApplicationStage, type EvidenceRecord, type EvidenceStatus } from "./types";
import { daysBetweenDates } from "./dates";

export interface StageMetric {
  stage: ApplicationStage;
  count: number;
  percentage: number;
}

export interface EvidenceReadinessMetrics {
  planned: number;
  inProgress: number;
  completed: number;
  completionPercentage: number;
  linked: number;
  linkedPercentage: number;
}

export function getApplicationStageMetrics(applications: ApplicationRecord[]): StageMetric[] {
  return APPLICATION_STAGES.map((stage) => {
    const count = applications.filter((application) => (application.stage ?? "saved") === stage).length;
    return {
      stage,
      count,
      percentage: applications.length === 0 ? 0 : Math.round((count / applications.length) * 100),
    };
  });
}

export function getEvidenceReadinessMetrics(evidence: EvidenceRecord[]): EvidenceReadinessMetrics {
  const counts = Object.fromEntries(
    EVIDENCE_STATUSES.map((status) => [status, evidence.filter((item) => item.status === status).length]),
  ) as Record<EvidenceStatus, number>;
  const total = evidence.length;
  const linked = evidence.filter((item) => Boolean(item.applicationId)).length;

  return {
    planned: counts.planned,
    inProgress: counts.in_progress,
    completed: counts.completed,
    completionPercentage: total === 0 ? 0 : Math.round((counts.completed / total) * 100),
    linked,
    linkedPercentage: total === 0 ? 0 : Math.round((linked / total) * 100),
  };
}

export interface StaleApplicationMetric {
  application: ApplicationRecord;
  daysSinceUpdate: number;
}

export function getStaleApplications(
  applications: ApplicationRecord[],
  today: string,
  thresholdDays = 14,
): StaleApplicationMetric[] {
  if (!Number.isInteger(thresholdDays) || thresholdDays < 1) {
    throw new Error("The stale threshold must be a positive whole number of days.");
  }
  return applications
    .filter((application) => application.stage !== "offer" && application.stage !== "rejected")
    .map((application) => ({
      application,
      daysSinceUpdate: daysBetweenDates(application.updatedAt.slice(0, 10), today),
    }))
    .filter((item) => item.daysSinceUpdate > thresholdDays)
    .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);
}
