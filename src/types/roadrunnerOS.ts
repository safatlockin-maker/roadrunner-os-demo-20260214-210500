import { z } from 'zod';
import type { LeadSource, UrgencyLevel } from './lead';

export const LocationCodeSchema = z.enum(['wayne', 'taylor']);
export type LocationCode = z.infer<typeof LocationCodeSchema>;

export const OpportunityStageSchema = z.enum([
  'new',
  'contacted',
  'appointment_set',
  'appointment_showed',
  'negotiating',
  'financing_review',
  'closed_won',
  'closed_lost',
]);
export type OpportunityStage = z.infer<typeof OpportunityStageSchema>;

export const AppointmentStatusSchema = z.enum([
  'booked',
  'confirmed',
  'showed',
  'no_show',
  'rescheduled',
  'cancelled',
]);
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

export const FinanceStatusSchema = z.enum([
  'started',
  'incomplete',
  'submitted',
  'approved',
  'declined',
  'needs_docs',
]);
export type FinanceStatus = z.infer<typeof FinanceStatusSchema>;

export const ReviewStatusSchema = z.enum([
  'pending',
  'sent',
  'completed',
  'suppressed',
  'failed',
]);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const ConsentChannelSchema = z.enum(['sms', 'phone', 'email']);
export type ConsentChannel = z.infer<typeof ConsentChannelSchema>;

export const MessageDirectionSchema = z.enum(['inbound', 'outbound']);
export type MessageDirection = z.infer<typeof MessageDirectionSchema>;

export interface LeadLifecycleRecord {
  id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  source: LeadSource;
  status: OpportunityStage;
  urgency: UrgencyLevel;
  lead_score: number;
  created_at: string;
  first_contact_at?: string | null;
  last_contact_at?: string | null;
  budget_max?: number | null;
  has_trade_in: boolean;
  location_intent: LocationCode;
}

export interface ConversationThread {
  id: string;
  lead_id: string;
  location: LocationCode;
  assigned_rep: string;
  has_unread: boolean;
  last_message_at: string;
  context?: ConversationContext;
  sla_state?: ChannelSlaState;
}

export interface MessageEvent {
  id: string;
  thread_id: string;
  lead_id: string;
  direction: MessageDirection;
  channel: 'sms' | 'web_form' | 'note';
  body: string;
  created_at: string;
  template_key?: string;
  ai_assist_used?: boolean;
}

export interface CallEvent {
  id: string;
  lead_id: string;
  direction: MessageDirection;
  outcome: 'answered' | 'missed' | 'voicemail' | 'no_answer';
  duration_seconds: number;
  created_at: string;
}

export interface StageChecklist {
  quote_shared: boolean;
  docs_requested: boolean;
  consent_verified: boolean;
}

export interface OpportunityRecord {
  id: string;
  lead_id: string;
  title: string;
  stage: OpportunityStage;
  expected_value: number;
  location: LocationCode;
  assigned_rep: string;
  next_action: string;
  updated_at: string;
  checklist: StageChecklist;
}

export interface AppointmentRecord {
  id: string;
  lead_id: string;
  location: LocationCode;
  vehicle_label: string;
  starts_at: string;
  status: AppointmentStatus;
  created_at: string;
}

export interface ConsentEvent {
  id: string;
  lead_id: string;
  channel: ConsentChannel;
  consented: boolean;
  source: 'finance_form' | 'website_form' | 'verbal_recording' | 'manual';
  proof: string;
  created_at: string;
}

export interface FinanceApplicationRecord {
  id: string;
  lead_id: string;
  status: FinanceStatus;
  completion_percent: number;
  missing_items: string[];
  started_at: string;
  updated_at: string;
}

export interface ReviewRequestRecord {
  id: string;
  lead_id: string;
  status: ReviewStatus;
  channel: 'sms';
  sent_at?: string;
  completed_at?: string;
  suppression_reason?: string;
}

export interface WorkflowDefinition {
  id: string;
  key: string;
  name: string;
  trigger: string;
  is_active: boolean;
  action_count: number;
}

export interface WorkflowRun {
  id: string;
  workflow_key: string;
  lead_id?: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  created_at: string;
  detail: string;
}

export interface ConversationContext {
  page_url: string;
  clicked_vehicle?: string;
  utm_source?: string;
  utm_campaign?: string;
  session_source: 'webchat' | 'sms' | 'phone' | 'form';
  viewed_pages?: string[];
}

export interface ChannelSlaState {
  thread_id: string;
  lead_id: string;
  owner: string;
  location: LocationCode;
  first_response_due_at: string;
  breached_at?: string;
  minutes_open: number;
  is_breached: boolean;
  severity: 'none' | 'medium' | 'high' | 'critical';
}

export interface DealDecayRiskScore {
  lead_id: string;
  score: number;
  drivers: string[];
  next_best_action: string;
}

export interface MigrationMapping {
  id: string;
  podium_contact_id: string;
  roadrunner_lead_id: string;
  confidence: number;
  source: 'csv' | 'webhook';
  created_at: string;
}

export interface GuaranteeKpiSnapshot {
  key:
    | 'time_to_first_response'
    | 'contact_rate'
    | 'appointment_set_rate'
    | 'show_rate'
    | 'finance_completion';
  label: string;
  baseline: number;
  current: number;
  delta: number;
  target_delta: number;
  target_direction: 'up' | 'down';
  status: 'met' | 'on_track' | 'at_risk';
  unit: 'percent' | 'minutes';
  note?: string;
}

export interface LeadIntentScore {
  lead_id: string;
  score: number;
  rationale: string;
}

export interface FinanceReadinessScore {
  lead_id: string;
  score: number;
  rationale: string;
}

export interface ShowProbabilityScore {
  appointment_id: string;
  score: number;
  rationale: string;
}

export interface SlaAlert {
  lead_id: string;
  lead_name: string;
  minutes_waiting: number;
  severity: 'critical' | 'high' | 'medium';
  reason: string;
}

export interface LeadIntakePayload {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  message?: string;
  page_url: string;
  utm_source?: string;
  utm_campaign?: string;
  clicked_vehicle?: string;
  location_intent?: LocationCode;
  consent_sms?: boolean;
  consent_phone?: boolean;
}

export interface LeadMergeSuggestion {
  matched_lead_id: string;
  confidence: number;
  reason: string;
}

export interface LeadIntakeResult {
  lead_id: string;
  routed_location: LocationCode;
  dedupe_match_id?: string;
  merge_suggestions: LeadMergeSuggestion[];
  created_new_lead: boolean;
}

export interface InboundSmsPayload {
  phone: string;
  body: string;
  received_at: string;
}

export interface InboundCallPayload {
  phone: string;
  outcome: CallEvent['outcome'];
  duration_seconds: number;
  received_at: string;
}

export interface AppointmentBookingPayload {
  lead_id: string;
  location: LocationCode;
  vehicle_label: string;
  starts_at: string;
}

export interface WorkflowExecutePayload {
  workflow_key: string;
  lead_id?: string;
  context?: Record<string, unknown>;
}

export interface ChatSessionStartPayload {
  lead_id?: string;
  phone?: string;
  location?: LocationCode;
  session_source: ConversationContext['session_source'];
  page_url: string;
  clicked_vehicle?: string;
  utm_source?: string;
  utm_campaign?: string;
}

export interface ChatSessionStartResult {
  session_id: string;
  thread_id: string;
  created_at: string;
}

export interface ChatMessagePayload {
  session_id: string;
  direction: MessageDirection;
  channel: 'sms' | 'webchat' | 'note';
  body: string;
  ai_assist_used?: boolean;
}

export interface ChatMessageResult {
  stored: boolean;
  event_id: string;
  created_at: string;
}

export interface OutboundSmsPayload {
  lead_id: string;
  body: string;
  template_key?: string;
}

export interface OutboundSmsResult {
  queued: boolean;
  event_id: string;
  delivery_status: 'queued' | 'sent' | 'failed';
}

export interface OutboundReviewInvitePayload {
  lead_id: string;
  channel: 'sms';
  review_link?: string;
}

export interface OutboundReviewInviteResult {
  queued: boolean;
  event_id: string;
  review_request_id?: string;
}

export interface CallSummaryPayload {
  lead_id: string;
  summary: string;
  outcome?: CallEvent['outcome'];
  duration_seconds?: number;
  follow_up_action?: string;
}

export interface CallSummaryResult {
  stored: boolean;
  event_id: string;
}

export interface PodiumImportRecord {
  podium_contact_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  stage?: OpportunityStage;
  last_message_at?: string;
  location?: LocationCode;
}

export interface PodiumImportPayload {
  source: 'csv' | 'webhook';
  records: PodiumImportRecord[];
}

export interface PodiumImportResult {
  imported: number;
  duplicates: number;
  mappings: MigrationMapping[];
}

export interface ParallelRunScorecardResult {
  generated_at: string;
  snapshots: GuaranteeKpiSnapshot[];
  recommendation: string;
}

export interface ReputationRequestPayload {
  lead_id: string;
  channel: 'sms';
}

export interface FinanceStartPayload {
  lead_id: string;
  location: LocationCode;
}

export interface OperationalKpiSnapshot {
  time_to_first_response_minutes: number;
  contact_rate_percent: number;
  appointment_set_rate_percent: number;
  show_rate_percent: number;
  sold_rate_percent: number;
  finance_completion_percent: number;
  avg_days_to_close: number;
}
