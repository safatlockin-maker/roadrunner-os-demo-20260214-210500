import { query } from './_generated/server';

function safePercent(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const half = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[half];
  return Math.round(((sorted[half - 1] + sorted[half]) / 2) * 10) / 10;
}

type Snapshot = {
  key: 'time_to_first_response' | 'contact_rate' | 'appointment_set_rate' | 'show_rate' | 'finance_completion';
  label: string;
  baseline: number;
  current: number;
  delta: number;
  target_delta: number;
  target_direction: 'up' | 'down';
  status: 'met' | 'on_track' | 'at_risk';
  unit: 'minutes' | 'percent';
  note: string;
};

function status(current: number, baseline: number, targetDelta: number, direction: 'up' | 'down'): Snapshot['status'] {
  const delta = direction === 'up' ? current - baseline : baseline - current;
  if (delta >= targetDelta) return 'met';
  if (delta >= targetDelta * 0.6) return 'on_track';
  return 'at_risk';
}

const BASELINES: Record<Snapshot['key'], number> = {
  time_to_first_response: 14.2,
  contact_rate: 52.1,
  appointment_set_rate: 24.6,
  show_rate: 57.2,
  finance_completion: 48.4,
};

export const parallelRun = query({
  args: {},
  handler: async (ctx) => {
    const leads = await ctx.db.query('leads').collect();
    const opportunities = await ctx.db.query('opportunities').collect();
    const appointments = await ctx.db.query('appointments').collect();
    const financeApplications = await ctx.db.query('financeApplications').collect();

    const responseMinutes = leads
      .filter((lead) => Boolean(lead.firstContactAt))
      .map((lead) => {
        const created = new Date(lead.createdAt).getTime();
        const firstContact = new Date(lead.firstContactAt as string).getTime();
        return Math.max(0, (firstContact - created) / 60_000);
      });

    const contactedCount = leads.filter((lead) => Boolean(lead.firstContactAt)).length;
    const appointmentSetCount = opportunities.filter((opportunity) =>
      ['appointment_set', 'appointment_showed', 'negotiating', 'financing_review', 'closed_won'].includes(opportunity.stage),
    ).length;

    const showedCount = appointments.filter((appointment) => appointment.status === 'showed').length;
    const showDenominator = appointments.filter((appointment) => ['showed', 'no_show'].includes(appointment.status)).length;

    const completedFinanceCount = financeApplications.filter((application) =>
      ['submitted', 'approved'].includes(application.status),
    ).length;

    const current = {
      time_to_first_response: median(responseMinutes),
      contact_rate: safePercent(contactedCount, leads.length),
      appointment_set_rate: safePercent(appointmentSetCount, leads.length),
      show_rate: safePercent(showedCount, showDenominator),
      finance_completion: safePercent(completedFinanceCount, financeApplications.length),
    };

    const snapshots: Snapshot[] = [
      {
        key: 'time_to_first_response',
        label: 'Time to first response',
        baseline: BASELINES.time_to_first_response,
        current: current.time_to_first_response,
        delta: Math.round((BASELINES.time_to_first_response - current.time_to_first_response) * 10) / 10,
        target_delta: 5,
        target_direction: 'down',
        status: status(current.time_to_first_response, BASELINES.time_to_first_response, 5, 'down'),
        unit: 'minutes',
        note: 'Target median <= 5 minutes',
      },
      {
        key: 'contact_rate',
        label: 'Contact rate',
        baseline: BASELINES.contact_rate,
        current: current.contact_rate,
        delta: Math.round((current.contact_rate - BASELINES.contact_rate) * 10) / 10,
        target_delta: 20,
        target_direction: 'up',
        status: status(current.contact_rate, BASELINES.contact_rate, 20, 'up'),
        unit: 'percent',
        note: 'Target +20% versus baseline',
      },
      {
        key: 'appointment_set_rate',
        label: 'Appointment set rate',
        baseline: BASELINES.appointment_set_rate,
        current: current.appointment_set_rate,
        delta: Math.round((current.appointment_set_rate - BASELINES.appointment_set_rate) * 10) / 10,
        target_delta: 15,
        target_direction: 'up',
        status: status(current.appointment_set_rate, BASELINES.appointment_set_rate, 15, 'up'),
        unit: 'percent',
        note: 'Target +15% versus baseline',
      },
      {
        key: 'show_rate',
        label: 'Show rate',
        baseline: BASELINES.show_rate,
        current: current.show_rate,
        delta: Math.round((current.show_rate - BASELINES.show_rate) * 10) / 10,
        target_delta: 10,
        target_direction: 'up',
        status: status(current.show_rate, BASELINES.show_rate, 10, 'up'),
        unit: 'percent',
        note: 'Target +10% improvement',
      },
      {
        key: 'finance_completion',
        label: 'Finance completion',
        baseline: BASELINES.finance_completion,
        current: current.finance_completion,
        delta: Math.round((current.finance_completion - BASELINES.finance_completion) * 10) / 10,
        target_delta: 15,
        target_direction: 'up',
        status: status(current.finance_completion, BASELINES.finance_completion, 15, 'up'),
        unit: 'percent',
        note: 'Target +15% versus baseline',
      },
    ];

    const atRiskCount = snapshots.filter((snapshot) => snapshot.status === 'at_risk').length;
    const recommendation =
      atRiskCount === 0
        ? 'All guarantee tracks are healthy. Continue parallel run and prepare cutover.'
        : 'Keep parallel run active and close at-risk KPI gaps before cutover.';

    return {
      generated_at: new Date().toISOString(),
      snapshots,
      recommendation,
    };
  },
});
