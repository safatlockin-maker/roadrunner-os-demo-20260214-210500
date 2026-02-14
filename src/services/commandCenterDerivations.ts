import { addDays, addHours, addMinutes, format, isSameMonth, isWithinInterval } from 'date-fns';
import type { Lead } from '../types/lead';
import type { Vehicle } from '../types/inventory';
import type {
  ActionSeverity,
  CommandAction,
  CommandMetric,
  MorningBrief,
  RevenueForecast,
} from '../types/commandCenter';

type ScoredAction = {
  action: CommandAction;
  dueAt: Date;
};

const severityWeight: Record<ActionSeverity, number> = {
  critical: 50,
  high: 30,
  medium: 15,
  admin: 5,
};

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function toActionTitle(lead: Lead): string {
  return `${lead.first_name} ${lead.last_name}`;
}

function leadExpectedValue(lead: Lead): number {
  return lead.deal_value ?? lead.budget_max ?? lead.budget_min ?? 0;
}

function actionDueLabel(dueAt: Date, now: Date): string {
  const deltaHours = (dueAt.getTime() - now.getTime()) / 3600000;
  if (deltaHours <= 0) return 'Due now';
  if (deltaHours <= 24) return `Due in ${Math.ceil(deltaHours)}h`;

  const deltaDays = deltaHours / 24;
  if (deltaDays <= 7) return `Due in ${Math.ceil(deltaDays)}d`;

  return `Due ${format(dueAt, 'MMM d')}`;
}

function actionUrgencyWeight(dueAt: Date, now: Date): number {
  const deltaHours = (dueAt.getTime() - now.getTime()) / 3600000;
  if (deltaHours <= 24) return 20;
  if (deltaHours <= 72) return 10;
  return 0;
}

function scoreAction(action: Omit<CommandAction, 'impactScore'>, dueAt: Date, now: Date): CommandAction {
  const valueWeight = Math.min((action.expectedValue ?? 0) / 1000, 25);
  const urgencyWeight = actionUrgencyWeight(dueAt, now);
  const impactScore = Math.round(severityWeight[action.severity] + valueWeight + urgencyWeight);

  return {
    ...action,
    impactScore,
  };
}

function leadReferenceDate(lead: Lead, now: Date): Date {
  return parseDate(lead.closed_at) ?? parseDate(lead.updated_at) ?? parseDate(lead.created_at) ?? now;
}

function isHotLeadUncontacted(lead: Lead, now: Date): boolean {
  const createdAt = parseDate(lead.created_at);
  if (!createdAt) return false;
  if ((lead.lead_score ?? 0) < 80) return false;
  if (lead.first_contact_at) return false;
  return now.getTime() - createdAt.getTime() > 10 * 60 * 1000;
}

function isDealAtRisk(lead: Lead, now: Date): boolean {
  if (lead.status !== 'negotiating' && lead.status !== 'financing_review') return false;

  const createdAt = parseDate(lead.created_at);
  const lastContactAt = parseDate(lead.last_contact_at);
  const ageHours = createdAt ? (now.getTime() - createdAt.getTime()) / 3600000 : 0;

  return !lead.deal_value || !lastContactAt || ageHours > 72;
}

function isFollowUpOverdue(lead: Lead, now: Date): boolean {
  if (!['new', 'contacted', 'interested'].includes(lead.status)) return false;

  const lastTouch = parseDate(lead.last_contact_at) ?? parseDate(lead.first_contact_at) ?? parseDate(lead.created_at);
  if (!lastTouch) return false;

  const staleHours = (now.getTime() - lastTouch.getTime()) / 3600000;
  return staleHours > 24;
}

function buildLeadSubtitle(lead: Lead): string {
  const status = lead.status.replace('_', ' ');
  return `${status.toUpperCase()} • Score ${lead.lead_score ?? 0}`;
}

function buildLeadActionId(lead: Lead, kind: string): string {
  return `${kind}-${lead.id}`;
}

export function buildCommandActions(leads: Lead[], inventory: Vehicle[], now: Date): CommandAction[] {
  const scoredActions: ScoredAction[] = [];

  leads.forEach((lead) => {
    const createdAt = parseDate(lead.created_at) ?? now;
    const expectedValue = leadExpectedValue(lead);

    if (isHotLeadUncontacted(lead, now)) {
      const dueAt = addMinutes(createdAt, 10);
      const baseAction: Omit<CommandAction, 'impactScore'> = {
        id: buildLeadActionId(lead, 'hot-uncontacted'),
        leadId: lead.id,
        title: toActionTitle(lead),
        subtitle: buildLeadSubtitle(lead),
        reason: 'Hot lead has no first contact and is at risk of going cold.',
        severity: lead.urgency === 'high' ? 'critical' : 'high',
        actionKind: 'call',
        actionLabel: 'Call',
        dueLabel: actionDueLabel(dueAt, now),
        expectedValue,
      };

      scoredActions.push({
        action: scoreAction(baseAction, dueAt, now),
        dueAt,
      });
    }

    if (isDealAtRisk(lead, now)) {
      const lastContactAt = parseDate(lead.last_contact_at);
      const dueAt = lastContactAt ? addHours(lastContactAt, 24) : now;
      const missing: string[] = [];

      if (!lead.deal_value) missing.push('deal value');
      if (!lead.last_contact_at) missing.push('recent follow-up');
      if ((now.getTime() - createdAt.getTime()) / 3600000 > 72) missing.push('fresh activity');

      const reason = `Deal near close is missing ${missing.join(', ')}.`;

      const baseAction: Omit<CommandAction, 'impactScore'> = {
        id: buildLeadActionId(lead, 'deal-risk'),
        leadId: lead.id,
        title: toActionTitle(lead),
        subtitle: `${buildLeadSubtitle(lead)} • ${formatCurrency(expectedValue)}`,
        reason,
        severity: 'critical',
        actionKind: lead.status === 'financing_review' ? 'docs' : 'assignment',
        actionLabel: lead.status === 'financing_review' ? 'Request Documents' : 'Reassign',
        dueLabel: actionDueLabel(dueAt, now),
        expectedValue,
      };

      scoredActions.push({
        action: scoreAction(baseAction, dueAt, now),
        dueAt,
      });
    }

    if (isFollowUpOverdue(lead, now)) {
      const lastTouch = parseDate(lead.last_contact_at) ?? parseDate(lead.first_contact_at) ?? createdAt;
      const dueAt = addHours(lastTouch, 24);
      const baseAction: Omit<CommandAction, 'impactScore'> = {
        id: buildLeadActionId(lead, 'followup-overdue'),
        leadId: lead.id,
        title: toActionTitle(lead),
        subtitle: buildLeadSubtitle(lead),
        reason: 'Lead has gone more than 24h without follow-up.',
        severity: lead.urgency === 'high' ? 'high' : 'medium',
        actionKind: 'sms',
        actionLabel: 'Send AI Text',
        dueLabel: actionDueLabel(dueAt, now),
        expectedValue,
      };

      scoredActions.push({
        action: scoreAction(baseAction, dueAt, now),
        dueAt,
      });
    }
  });

  inventory.forEach((vehicle, idx) => {
    if (vehicle.status !== 'available') return;
    if ((vehicle.days_in_inventory ?? 0) < 45) return;

    const daysInInventory = vehicle.days_in_inventory ?? 0;
    const dueAt = addDays(now, 1);
    const severity: ActionSeverity = daysInInventory >= 75 ? 'medium' : 'admin';
    const vehicleLabel = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    const expectedValue = vehicle.list_price ?? 0;

    const baseAction: Omit<CommandAction, 'impactScore'> = {
      id: `inventory-risk-${idx + 1}`,
      title: vehicleLabel,
      subtitle: `${formatCurrency(expectedValue)} • ${daysInInventory} days in stock`,
      reason: 'Aging inventory needs pricing, placement, or merchandising action.',
      severity,
      actionKind: 'status_update',
      actionLabel: 'Open Inventory',
      dueLabel: `${daysInInventory} days in stock`,
      expectedValue,
    };

    scoredActions.push({
      action: scoreAction(baseAction, dueAt, now),
      dueAt,
    });
  });

  return scoredActions
    .sort((a, b) => {
      if (b.action.impactScore !== a.action.impactScore) {
        return b.action.impactScore - a.action.impactScore;
      }
      return a.dueAt.getTime() - b.dueAt.getTime();
    })
    .map(({ action }) => action);
}

export function buildRevenueForecast(leads: Lead[], now: Date): RevenueForecast {
  const nowPlus7 = addDays(now, 7);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthAfterNextStart = new Date(now.getFullYear(), now.getMonth() + 2, 1);

  const toValue = (lead: Lead): number => lead.deal_value ?? lead.budget_max ?? lead.budget_min ?? 0;

  const next7Days = leads.reduce((sum, lead) => {
    const ref = leadReferenceDate(lead, now);
    if (!isWithinInterval(ref, { start: now, end: nowPlus7 })) return sum;
    if (lead.status === 'closed_won') return sum + toValue(lead);
    if (lead.status === 'negotiating') return sum + toValue(lead) * 0.35;
    return sum;
  }, 0);

  const thisMonth = leads.reduce((sum, lead) => {
    const ref = leadReferenceDate(lead, now);
    if (!isSameMonth(ref, now)) return sum;

    if (lead.status === 'closed_won') return sum + toValue(lead);
    if (lead.status === 'negotiating') return sum + toValue(lead) * 0.35;
    if (lead.status === 'financing_review') return sum + toValue(lead) * 0.2;
    return sum;
  }, 0);

  const nextMonth = leads.reduce((sum, lead) => {
    const ref = leadReferenceDate(lead, now);
    if (!isWithinInterval(ref, { start: nextMonthStart, end: addHours(monthAfterNextStart, -1) })) {
      return sum;
    }

    if (lead.status === 'closed_won') return sum + toValue(lead);
    if (lead.status === 'negotiating') return sum + toValue(lead) * 0.35;
    if (lead.status === 'financing_review') return sum + toValue(lead) * 0.2;
    return sum;
  }, 0);

  return {
    next7Days: Math.round(next7Days),
    thisMonth: Math.round(thisMonth),
    nextMonth: Math.round(nextMonth),
  };
}

export function buildCommandMetrics(leads: Lead[], inventory: Vehicle[], now: Date): CommandMetric[] {
  const appointmentsNext7 = leads.filter((lead) => lead.status === 'test_drive').length;
  const dealsAtRisk = leads.filter((lead) => isDealAtRisk(lead, now)).length;
  const forecast = buildRevenueForecast(leads, now);
  const agingInventory = inventory.filter(
    (vehicle) => vehicle.status === 'available' && (vehicle.days_in_inventory ?? 0) >= 45
  ).length;

  return [
    {
      id: 'appointments_7d',
      label: 'Appointments Next 7 Days',
      value: String(appointmentsNext7),
      helper: `${agingInventory} aging units need inventory attention`,
    },
    {
      id: 'deals_at_risk',
      label: 'Deals At Risk',
      value: String(dealsAtRisk),
      helper: 'Deals in negotiating or financing review missing key progress',
    },
    {
      id: 'gross_month',
      label: 'Expected Gross This Month',
      value: formatCurrency(forecast.thisMonth),
      helper: 'Closed won + weighted active pipeline forecast',
    },
  ];
}

export function buildMorningBrief(actions: CommandAction[], metrics: CommandMetric[]): MorningBrief {
  const topAction = actions[0];
  const criticalCount = actions.filter((action) => action.severity === 'critical').length;
  const highCount = actions.filter((action) => action.severity === 'high').length;
  const riskMetric = metrics.find((metric) => metric.id === 'deals_at_risk');
  const grossMetric = metrics.find((metric) => metric.id === 'gross_month');

  return {
    headline: topAction
      ? `Focus first on ${topAction.title}. ${topAction.reason}`
      : 'No urgent blockers detected. Keep momentum with proactive follow-up.',
    bullets: [
      `${criticalCount} critical and ${highCount} high-priority actions are currently in queue.`,
      `${riskMetric?.value ?? '0'} deals are in at-risk stages and need immediate movement.`,
      `${grossMetric?.label ?? 'Expected Gross'} is tracking at ${grossMetric?.value ?? '$0'}.`,
    ],
    primaryActionId: topAction?.id,
    footer: topAction
      ? `Primary focus: ${topAction.actionLabel} for ${topAction.title}.`
      : 'Use this window to clean stale statuses and schedule upcoming test drives.',
  };
}
