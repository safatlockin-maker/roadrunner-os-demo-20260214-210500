import type {
  AppointmentBookingPayload,
  AppointmentRecord,
  CallSummaryPayload,
  CallSummaryResult,
  ChannelSlaState,
  ChatMessagePayload,
  ChatMessageResult,
  ChatSessionStartPayload,
  ChatSessionStartResult,
  ConversationThread,
  ConsentEvent,
  DealDecayRiskScore,
  FinanceApplicationRecord,
  FinanceReadinessScore,
  FinanceStartPayload,
  GuaranteeKpiSnapshot,
  InboundCallPayload,
  InboundSmsPayload,
  LeadIntentScore,
  LeadIntakePayload,
  LeadIntakeResult,
  LeadLifecycleRecord,
  LeadMergeSuggestion,
  LocationCode,
  OperationalKpiSnapshot,
  OutboundReviewInvitePayload,
  OutboundReviewInviteResult,
  OutboundSmsPayload,
  OutboundSmsResult,
  ParallelRunScorecardResult,
  PodiumImportPayload,
  PodiumImportResult,
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

async function getWithFallback<TResponse>(path: string, fallbackFactory: () => TResponse): Promise<TResponse> {
  const apiBase =
    ((import.meta.env.VITE_ROADRUNNER_API_BASE as string | undefined)?.trim() ??
      (import.meta.env.VITE_CONVEX_SITE_URL as string | undefined)?.trim() ??
      '');
  const endpoint = `${apiBase}${path}`;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
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

export async function startChatSession(payload: ChatSessionStartPayload): Promise<ChatSessionStartResult> {
  return postWithFallback('/api/chat/session/start', payload, () => ({
    session_id: `chat-session-${Date.now()}`,
    thread_id: `thread-${Date.now()}`,
    created_at: new Date().toISOString(),
  }));
}

export async function sendChatMessage(payload: ChatMessagePayload): Promise<ChatMessageResult> {
  return postWithFallback('/api/chat/message', payload, () => ({
    stored: true,
    event_id: `chat-event-${Date.now()}`,
    created_at: new Date().toISOString(),
  }));
}

export async function sendOutboundSms(payload: OutboundSmsPayload): Promise<OutboundSmsResult> {
  return postWithFallback('/api/comms/outbound/sms', payload, () => ({
    queued: true,
    event_id: `outbound-sms-${Date.now()}`,
    delivery_status: 'queued',
  }));
}

export async function sendOutboundReviewInvite(payload: OutboundReviewInvitePayload): Promise<OutboundReviewInviteResult> {
  return postWithFallback('/api/comms/outbound/review-invite', payload, () => ({
    queued: true,
    event_id: `review-invite-${Date.now()}`,
    review_request_id: `review-${Date.now()}`,
  }));
}

export async function summarizeCall(payload: CallSummaryPayload): Promise<CallSummaryResult> {
  return postWithFallback('/api/comms/call-summary', payload, () => ({
    stored: true,
    event_id: `call-summary-${Date.now()}`,
  }));
}

export async function importPodiumRecords(payload: PodiumImportPayload): Promise<PodiumImportResult> {
  return postWithFallback('/api/migration/podium-import', payload, () => {
    const mappings = payload.records.slice(0, 10).map((record, index) => ({
      id: `map-${Date.now()}-${index}`,
      podium_contact_id: record.podium_contact_id,
      roadrunner_lead_id: `lead-import-${index + 1}`,
      confidence: 0.9,
      source: payload.source,
      created_at: new Date().toISOString(),
    }));

    return {
      imported: payload.records.length,
      duplicates: 0,
      mappings,
    };
  });
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

function kpiStatus(current: number, baseline: number, targetDelta: number, direction: 'up' | 'down'): GuaranteeKpiSnapshot['status'] {
  const delta = direction === 'up' ? current - baseline : baseline - current;
  if (delta >= targetDelta) return 'met';
  if (delta >= targetDelta * 0.6) return 'on_track';
  return 'at_risk';
}

export function buildGuaranteeSnapshots(
  kpis: OperationalKpiSnapshot,
  baselines: Record<GuaranteeKpiSnapshot['key'], number>,
): GuaranteeKpiSnapshot[] {
  const rows: Array<{
    key: GuaranteeKpiSnapshot['key'];
    label: string;
    current: number;
    targetDelta: number;
    direction: 'up' | 'down';
    unit: GuaranteeKpiSnapshot['unit'];
    note: string;
  }> = [
    {
      key: 'time_to_first_response',
      label: 'Time to first response',
      current: kpis.time_to_first_response_minutes,
      targetDelta: 5,
      direction: 'down',
      unit: 'minutes',
      note: 'Target median <= 5 minutes.',
    },
    {
      key: 'contact_rate',
      label: 'Contact rate',
      current: kpis.contact_rate_percent,
      targetDelta: 20,
      direction: 'up',
      unit: 'percent',
      note: 'Target +20% versus baseline.',
    },
    {
      key: 'appointment_set_rate',
      label: 'Appointment set rate',
      current: kpis.appointment_set_rate_percent,
      targetDelta: 15,
      direction: 'up',
      unit: 'percent',
      note: 'Target +15% versus baseline.',
    },
    {
      key: 'show_rate',
      label: 'Show rate',
      current: kpis.show_rate_percent,
      targetDelta: 10,
      direction: 'up',
      unit: 'percent',
      note: 'Target +10% improvement.',
    },
    {
      key: 'finance_completion',
      label: 'Finance completion',
      current: kpis.finance_completion_percent,
      targetDelta: 15,
      direction: 'up',
      unit: 'percent',
      note: 'Target +15% versus baseline.',
    },
  ];

  return rows.map((row) => {
    const baseline = baselines[row.key];
    const delta = row.direction === 'up' ? row.current - baseline : baseline - row.current;
    return {
      key: row.key,
      label: row.label,
      baseline: Math.round(baseline * 10) / 10,
      current: Math.round(row.current * 10) / 10,
      delta: Math.round(delta * 10) / 10,
      target_delta: row.targetDelta,
      target_direction: row.direction,
      status: kpiStatus(row.current, baseline, row.targetDelta, row.direction),
      unit: row.unit,
      note: row.note,
    };
  });
}

export async function getParallelRunScorecard(
  kpis: OperationalKpiSnapshot,
  baselines: Record<GuaranteeKpiSnapshot['key'], number>,
): Promise<ParallelRunScorecardResult> {
  return getWithFallback('/api/scorecard/parallel-run', () => {
    const snapshots = buildGuaranteeSnapshots(kpis, baselines);
    const atRiskCount = snapshots.filter((snapshot) => snapshot.status === 'at_risk').length;
    const recommendation =
      atRiskCount === 0
        ? 'All guarantee tracks are healthy. Continue parallel run and prepare cutover.'
        : 'Keep parallel run active. Focus coaching on at-risk channels before cutover.';

    return {
      generated_at: new Date().toISOString(),
      snapshots,
      recommendation,
    };
  });
}

export function buildChannelSlaStates(
  threads: ConversationThread[],
  leads: LeadLifecycleRecord[],
  now = new Date(),
): ChannelSlaState[] {
  const leadsById = new Map(leads.map((lead) => [lead.id, lead]));
  const states: ChannelSlaState[] = [];

  for (const thread of threads) {
    const lead = leadsById.get(thread.lead_id);
    if (!lead) continue;

    const createdAt = new Date(lead.created_at);
    const firstResponseDueAt = new Date(createdAt.getTime() + 5 * 60_000);
    const minutesOpen = Math.max(0, Math.round((now.getTime() - createdAt.getTime()) / 60_000));
    const isBreached = !lead.first_contact_at && now.getTime() > firstResponseDueAt.getTime();
    const severity: ChannelSlaState['severity'] = isBreached ? mapMinutesToSeverity(minutesOpen) : 'none';

    states.push({
      thread_id: thread.id,
      lead_id: thread.lead_id,
      owner: thread.assigned_rep,
      location: thread.location,
      first_response_due_at: firstResponseDueAt.toISOString(),
      breached_at: isBreached ? now.toISOString() : undefined,
      minutes_open: minutesOpen,
      is_breached: isBreached,
      severity,
    });
  }

  return states.sort((a, b) => b.minutes_open - a.minutes_open);
}

export function buildDealDecayRiskScores(
  leads: LeadLifecycleRecord[],
  opportunities: OpportunityRecord[],
  financeApplications: FinanceApplicationRecord[],
  now = new Date(),
): DealDecayRiskScore[] {
  const opportunitiesByLead = new Map(opportunities.map((opportunity) => [opportunity.lead_id, opportunity]));
  const financeByLead = new Map(financeApplications.map((application) => [application.lead_id, application]));

  return leads
    .filter((lead) => ['appointment_set', 'appointment_showed', 'negotiating', 'financing_review'].includes(lead.status))
    .map((lead) => {
      const drivers: string[] = [];
      let score = 25;

      const opportunity = opportunitiesByLead.get(lead.id);
      const finance = financeByLead.get(lead.id);
      const lastContact = lead.last_contact_at ? new Date(lead.last_contact_at) : new Date(lead.created_at);
      const staleHours = (now.getTime() - lastContact.getTime()) / 3_600_000;

      if (staleHours > 24) {
        score += 20;
        drivers.push('No rep touch in over 24h');
      }

      if (staleHours > 48) {
        score += 15;
        drivers.push('No rep touch in over 48h');
      }

      if (opportunity && !opportunity.checklist.quote_shared) {
        score += 15;
        drivers.push('Quote not shared');
      }

      if (opportunity && !opportunity.checklist.docs_requested && lead.status === 'financing_review') {
        score += 20;
        drivers.push('Finance docs not requested');
      }

      if (finance && finance.missing_items.length > 0) {
        score += Math.min(20, finance.missing_items.length * 6);
        drivers.push(`${finance.missing_items.length} finance item(s) missing`);
      }

      if (lead.urgency === 'high') {
        score += 10;
        drivers.push('High urgency buyer');
      }

      score = Math.min(100, Math.round(score));
      const nextBestAction =
        lead.status === 'financing_review'
          ? 'Call and collect missing documents now.'
          : lead.status === 'negotiating'
            ? 'Send revised payment terms and trade value today.'
            : 'Confirm appointment commitment and reminder cadence.';

      return {
        lead_id: lead.id,
        score,
        drivers,
        next_best_action: nextBestAction,
      };
    })
    .sort((a, b) => b.score - a.score);
}
