import type { NormalizedObservation, RawSourceReference, RetestReminder, SourceCategory } from '../types.js';

// The annual biomarker retest is the core retention loop ("better every year").
// Reminders are computed from the freshest data on file per modality against a
// cadence, so no reminder state needs to be stored.
const DEFAULT_CADENCE_DAYS: Partial<Record<SourceCategory, number>> = {
  biomarkers: 365,
  behavioral: 90,
};

const DAY_MS = 24 * 60 * 60 * 1000;

export interface RetestReminderInput {
  sources: RawSourceReference[];
  observations: NormalizedObservation[];
  now?: string;
  cadenceDays?: Partial<Record<SourceCategory, number>>;
}

export function computeRetestReminders(input: RetestReminderInput): RetestReminder[] {
  const now = input.now ? new Date(input.now) : new Date();
  const cadence = { ...DEFAULT_CADENCE_DAYS, ...input.cadenceDays };
  const reminders: RetestReminder[] = [];

  for (const category of Object.keys(cadence) as SourceCategory[]) {
    const cadenceDays = cadence[category];
    if (!cadenceDays) continue;
    const last = mostRecentDate(category, input.sources, input.observations);
    if (!last) {
      reminders.push({
        category,
        cadence_days: cadenceDays,
        status: 'never_tested',
        reason: category === 'biomarkers'
          ? 'No lab panel on file yet. Establish a baseline so annual trends can start.'
          : `No ${category} data on file yet.`,
      });
      continue;
    }
    const nextDue = new Date(last.getTime() + cadenceDays * DAY_MS);
    const daysUntilDue = Math.round((nextDue.getTime() - now.getTime()) / DAY_MS);
    const status: RetestReminder['status'] = daysUntilDue <= 0 ? 'due' : daysUntilDue <= 30 ? 'upcoming' : 'ok';
    reminders.push({
      category,
      cadence_days: cadenceDays,
      last_observed_at: last.toISOString(),
      next_due_at: nextDue.toISOString(),
      days_until_due: daysUntilDue,
      status,
      reason: reasonFor(category, status, daysUntilDue, cadenceDays),
    });
  }

  // Due items first, then upcoming, then the rest.
  const rank: Record<RetestReminder['status'], number> = { due: 0, never_tested: 1, upcoming: 2, ok: 3 };
  return reminders.sort((a, b) => rank[a.status] - rank[b.status]);
}

function mostRecentDate(category: SourceCategory, sources: RawSourceReference[], observations: NormalizedObservation[]): Date | undefined {
  const times: number[] = [];
  for (const observation of observations) {
    if (observation.category === category && observation.observed_at) {
      const t = Date.parse(observation.observed_at);
      if (!Number.isNaN(t)) times.push(t);
    }
  }
  for (const source of sources) {
    if (source.category === category && source.received_at) {
      const t = Date.parse(source.received_at);
      if (!Number.isNaN(t)) times.push(t);
    }
  }
  if (times.length === 0) return undefined;
  return new Date(Math.max(...times));
}

function reasonFor(category: SourceCategory, status: RetestReminder['status'], daysUntilDue: number, cadenceDays: number): string {
  const label = category === 'biomarkers' ? 'biomarker panel' : `${category} check-in`;
  if (status === 'due') return `Your ${label} is due for a retest (${Math.abs(daysUntilDue)} days past the ${cadenceDays}-day cadence).`;
  if (status === 'upcoming') return `Your ${label} retest is coming up in ${daysUntilDue} days.`;
  return `Your ${label} is current; next retest in about ${daysUntilDue} days.`;
}
