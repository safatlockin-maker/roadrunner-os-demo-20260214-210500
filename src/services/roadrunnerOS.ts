import type {
  AppointmentBookingPayload,
  AppointmentRecord,
  ConsentEvent,
  FinanceApplicationRecord,
  FinanceReadinessScore,
  FinanceStartPayload,
  InboundCallPayload,
  InboundSmsPayload,
  LeadIntentScore,
  LeadIntakePayload,
  LeadIntakeResult,
  LeadLifecycleRecord,
  LeadMergeSuggestion,
  LocationCode,
  OperationalKpiSnapshot,
  OpportunityRecord,
  OpportunityStage,
  ReputationRequestPayload,
  ReviewRequestRecord,
  ShowProbabilityScore,
  SlaAlert,
  WorkflowExecutePayload,
  WorkflowRun,
} from '../types/roadrunnerOS';

const DEFAULT_BUSINESS_HOURS_START = 9;
const DEFAULT_BUSINESS_HOURS_END = 19;

function normalizeEmail(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

function normalizePhone(value?: string | null): string {
  return (value ?? '').replace(/\D/g, '');
}

function isBusinessHours(now: Date): boolean {
  const day = now.getDay();
  if (day === 0) return false;
  if (day === 6) {
    return now.getHours() >= DEFAULT_BUSINESS_HOURS_START && now.getHours() < 17;
  }

  return now.getHours() >= DEFAULT_BUSINESS_HOURS_START && now.getHours() < DEFAULT_BUSINESS_HOURS_END;
}

function mapMinutesToSeverity(minutesWaiting: number): SlaAlert['severity'] {
  if (minutesWaiting >= 20) return 'critical';
  if (minutesWaiting >= 10) return 'high';
  return 'medium';
}

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

function routeLocation(payload: LeadIntakePayload): LocationCode {
  if (payload.location_intent) return payload.location_intent;

  const pageUrl = payload.page_url.toLowerCase();
  if (pageUrl.includes('taylor')) return 'taylor';
  return 'wayne';
}

function findDirectDedupeMatch(payload: LeadIntakePayload, existingLeads: LeadLifecycleRecord[]): LeadLifecycleRecord | null {
  const incomingPhone = normalizePhone(payload.phone);
  const incomingEmail = normalizeEmail(payload.email);

  if (!incomingPhone && !incomingEmail) return null;

  for (const lead of existingLeads) {
    const samePhone = incomingPhone && normalizePhone(lead.phone) === incomingPhone;
    const sameEmail = incomingEmail && normalizeEmail(lead.email) === incomingEmail;
    if (samePhone || sameEmail) {
      return lead;
    }
  }

  return null;
}

function buildMergeSuggestions(payload: LeadIntakePayload, existingLeads: LeadLifecycleRecord[]): LeadMergeSuggestion[] {
  const lastName = payload.last_name.trim().toLowerCase();
  const incomingPhone = normalizePhone(payload.phone);
  const suggestions: LeadMergeSuggestion[] = [];

  for (const lead of existingLeads) {
    const leadLastName = lead.last_name.trim().toLowerCase();
    const phoneMatch = incomingPhone && normalizePhone(lead.phone).endsWith(incomingPhone.slice(-7));
    const nameMatch = lastName && leadLastName === lastName;

    if (!nameMatch && !phoneMatch) continue;

    const confidence = nameMatch && phoneMatch ? 0.92 : nameMatch ? 0.72 : 0.64;
    const reason = nameMatch && phoneMatch ? 'Matching last name and phone digits' : nameMatch ? 'Matching last name' : 'Similar phone digits';
    suggestions.push({
      matched_lead_id: lead.id,
      confidence,
      reason,
    });
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

async function postWithFallback<TRequest, TResponse>(
  path: string,
  payload: TRequest,
  fallbackFactory: () => TResponse,
): Promise<TResponse> {
  const apiBase =
    ((import.meta.env.VITE_ROADRUNNER_API_BASE as string | undefined)?.trim() ??
      (import.meta.env.VITE_CONVEX_SITE_URL as string | undefined)?.trim() ??
      '');
  const endpoint = `${apiBase}${path}`;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (response.ok) {
      return (await response.json()) as TResponse;
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.info(`[roadrunner-os] Falling back for ${path}`, error);
    }
  } finally {
    window.clearTimeout(timeout);
  }

  return fallbackFactory();
}

export async function intakeLead(
  payload: LeadIntakePayload,
  existingLeads: LeadLifecycleRecord[],
): Promise<LeadIntakeResult> {
  const directMatch = findDirectDedupeMatch(payload, existingLeads);
  const mergeSuggestions = buildMergeSuggestions(payload, existingLeads);
  const routedLocation = routeLocation(payload);

  return postWithFallback('/api/leads/intake', payload, () => ({
    lead_id: directMatch?.id ?? `lead-intake-${Date.now()}`,
    routed_location: routedLocation,
    dedupe_match_id: directMatch?.id,
    merge_suggestions: mergeSuggestions,
    created_new_lead: !directMatch,
  }));
}

export async function ingestInboundSms(payload: InboundSmsPayload): Promise<{ stored: boolean; trigger_workflow: string }> {
  return postWithFallback('/api/comms/inbound/sms', payload, () => ({
    stored: true,
    trigger_workflow: 'missed_call_text_back',
  }));
}

export async function ingestInboundCall(payload: InboundCallPayload): Promise<{ stored: boolean; missed_call_follow_up: boolean }> {
  return postWithFallback('/api/comms/inbound/call', payload, () => ({
    stored: true,
    missed_call_follow_up: payload.outcome === 'missed',
  }));
}

export async function bookAppointment(payload: AppointmentBookingPayload): Promise<AppointmentRecord> {
  return postWithFallback('/api/appointments/book', payload, () => ({
    id: `appt-${Date.now()}`,
    lead_id: payload.lead_id,
    location: payload.location,
    vehicle_label: payload.vehicle_label,
    starts_at: payload.starts_at,
    status: 'booked',
    created_at: new Date().toISOString(),
  }));
}

export async function executeWorkflow(payload: WorkflowExecutePayload): Promise<WorkflowRun> {
  return postWithFallback('/api/workflows/execute', payload, () => ({
    id: `run-${Date.now()}`,
    workflow_key: payload.workflow_key,
    lead_id: payload.lead_id,
    status: 'queued',
    created_at: new Date().toISOString(),
    detail: 'Workflow queued through local fallback executor.',
  }));
}

export async function requestReputation(payload: ReputationRequestPayload): Promise<ReviewRequestRecord> {
  return postWithFallback('/api/reputation/request', payload, () => ({
    id: `review-${Date.now()}`,
    lead_id: payload.lead_id,
    status: 'sent',
    channel: payload.channel,
    sent_at: new Date().toISOString(),
  }));
}

export async function startFinanceJourney(payload: FinanceStartPayload): Promise<FinanceApplicationRecord> {
  return postWithFallback('/api/finance/start', payload, () => ({
    id: `finance-${Date.now()}`,
    lead_id: payload.lead_id,
    status: 'started',
    completion_percent: 10,
    missing_items: ['Driver license', 'Proof of income', 'Residence verification'],
    started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

export function validateOpportunityStageTransition(
  opportunity: OpportunityRecord,
  nextStage: OpportunityStage,
  consentEvents: ConsentEvent[],
): { allowed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const hasSmsConsent = consentEvents.some((event) => event.lead_id === opportunity.lead_id && event.channel === 'sms' && event.consented);

  if (nextStage === 'negotiating' && !opportunity.checklist.quote_shared) {
    reasons.push('Quote must be shared before entering negotiating stage.');
  }

  if (nextStage === 'financing_review') {
    if (!opportunity.checklist.docs_requested) {
      reasons.push('Documents must be requested before financing review.');
    }
    if (!opportunity.checklist.consent_verified || !hasSmsConsent) {
      reasons.push('SMS consent verification is required before financing review.');
    }
  }

  if (nextStage === 'closed_won') {
    if (!opportunity.checklist.quote_shared || !opportunity.checklist.docs_requested) {
      reasons.push('Cannot mark closed won until quote and documents are complete.');
    }
  }

  return { allowed: reasons.length === 0, reasons };
}

export function buildSlaAlerts(leads: LeadLifecycleRecord[], now = new Date()): SlaAlert[] {
  if (!isBusinessHours(now)) return [];

  const alerts: SlaAlert[] = [];

  for (const lead of leads) {
    if (lead.first_contact_at) continue;

    const createdAt = new Date(lead.created_at);
    const minutesWaiting = Math.round((now.getTime() - createdAt.getTime()) / 60_000);
    if (minutesWaiting < 5) continue;

    alerts.push({
      lead_id: lead.id,
      lead_name: `${lead.first_name} ${lead.last_name}`,
      minutes_waiting: minutesWaiting,
      severity: mapMinutesToSeverity(minutesWaiting),
      reason: 'No first response within 5-minute target.',
    });
  }

  return alerts.sort((a, b) => b.minutes_waiting - a.minutes_waiting);
}

export function buildLeadIntentScores(leads: LeadLifecycleRecord[]): LeadIntentScore[] {
  return leads.map((lead) => {
    const sourceWeight = lead.source === 'website_form' ? 10 : lead.source === 'phone' ? 8 : 6;
    const tradeWeight = lead.has_trade_in ? 8 : 0;
    const score = Math.min(100, Math.round(lead.lead_score * 0.75 + sourceWeight + tradeWeight));
    return {
      lead_id: lead.id,
      score,
      rationale: `Base lead score ${lead.lead_score} adjusted by source + trade-in signals.`,
    };
  });
}

export function buildFinanceReadinessScores(applications: FinanceApplicationRecord[]): FinanceReadinessScore[] {
  return applications.map((application) => {
    const docsPenalty = application.missing_items.length * 7;
    const statusBonus = application.status === 'approved' ? 20 : application.status === 'submitted' ? 10 : 0;
    const score = Math.max(0, Math.min(100, application.completion_percent + statusBonus - docsPenalty));

    return {
      lead_id: application.lead_id,
      score,
      rationale: `${application.completion_percent}% completion with ${application.missing_items.length} missing item(s).`,
    };
  });
}

export function buildShowProbabilityScores(appointments: AppointmentRecord[]): ShowProbabilityScore[] {
  return appointments.map((appointment) => {
    const hoursUntil = (new Date(appointment.starts_at).getTime() - Date.now()) / 3_600_000;
    const statusWeight = appointment.status === 'confirmed' ? 20 : appointment.status === 'booked' ? 10 : 0;
    const proximityWeight = hoursUntil <= 24 ? 18 : hoursUntil <= 48 ? 12 : 6;
    const score = Math.max(0, Math.min(100, 55 + statusWeight + proximityWeight));

    return {
      appointment_id: appointment.id,
      score,
      rationale: `Status ${appointment.status} and ${Math.max(0, Math.round(hoursUntil))}h until appointment.`,
    };
  });
}

export function buildOperationalKpis(
  leads: LeadLifecycleRecord[],
  opportunities: OpportunityRecord[],
  appointments: AppointmentRecord[],
  financeApplications: FinanceApplicationRecord[],
): OperationalKpiSnapshot {
  const responseMinutes = leads
    .filter((lead) => lead.first_contact_at)
    .map((lead) => {
      const created = new Date(lead.created_at).getTime();
      const firstContact = new Date(lead.first_contact_at as string).getTime();
      return Math.max(0, (firstContact - created) / 60_000);
    });

  const contactedCount = leads.filter((lead) => Boolean(lead.first_contact_at)).length;
  const appointmentSetCount = opportunities.filter((opportunity) =>
    ['appointment_set', 'appointment_showed', 'negotiating', 'financing_review', 'closed_won'].includes(opportunity.stage),
  ).length;
  const showedCount = appointments.filter((appointment) => appointment.status === 'showed').length;
  const showDenominator = appointments.filter((appointment) => ['showed', 'no_show'].includes(appointment.status)).length;
  const soldCount = leads.filter((lead) => lead.status === 'closed_won').length;
  const completedFinanceCount = financeApplications.filter((application) =>
    ['submitted', 'approved'].includes(application.status),
  ).length;

  const avgDaysToClose = leads
    .filter((lead) => lead.status === 'closed_won')
    .map((lead) => {
      const created = new Date(lead.created_at).getTime();
      return (Date.now() - created) / 86_400_000;
    });

  return {
    time_to_first_response_minutes: median(responseMinutes),
    contact_rate_percent: safePercent(contactedCount, leads.length),
    appointment_set_rate_percent: safePercent(appointmentSetCount, leads.length),
    show_rate_percent: safePercent(showedCount, showDenominator),
    sold_rate_percent: safePercent(soldCount, leads.length),
    finance_completion_percent: safePercent(completedFinanceCount, financeApplications.length),
    avg_days_to_close: avgDaysToClose.length ? Math.round((avgDaysToClose.reduce((a, b) => a + b, 0) / avgDaysToClose.length) * 10) / 10 : 0,
  };
}
