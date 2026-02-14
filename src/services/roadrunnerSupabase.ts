import { supabase } from './supabase';
import type {
  AppointmentRecord,
  ConsentEvent,
  ConversationThread,
  FinanceApplicationRecord,
  LeadIntakePayload,
  MessageEvent,
  OpportunityRecord,
  ReviewRequestRecord,
  WorkflowDefinition,
  WorkflowRun,
} from '../types/roadrunnerOS';

export async function insertLeadSourceEvent(payload: LeadIntakePayload, leadId: string) {
  const { data, error } = await supabase
    .from('lead_source_events')
    .insert({
      lead_id: leadId,
      source: payload.source,
      page_url: payload.page_url,
      utm_source: payload.utm_source ?? null,
      utm_campaign: payload.utm_campaign ?? null,
      clicked_vehicle: payload.clicked_vehicle ?? null,
      location_intent: payload.location_intent ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getOpportunities(): Promise<OpportunityRecord[]> {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data as OpportunityRecord[];
}

export async function updateOpportunityStage(id: string, stage: OpportunityRecord['stage']) {
  const { data, error } = await supabase
    .from('opportunities')
    .update({ stage })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as OpportunityRecord;
}

export async function getConversationThreads(): Promise<ConversationThread[]> {
  const { data, error } = await supabase
    .from('conversation_threads')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data as ConversationThread[];
}

export async function createMessageEvent(message: Omit<MessageEvent, 'id'>): Promise<MessageEvent> {
  const { data, error } = await supabase
    .from('message_events')
    .insert(message)
    .select()
    .single();

  if (error) throw error;
  return data as MessageEvent;
}

export async function getAppointments(): Promise<AppointmentRecord[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('starts_at', { ascending: true });

  if (error) throw error;
  return data as AppointmentRecord[];
}

export async function createAppointment(
  appointment: Omit<AppointmentRecord, 'id' | 'created_at' | 'status'>,
): Promise<AppointmentRecord> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      lead_id: appointment.lead_id,
      location: appointment.location,
      vehicle_label: appointment.vehicle_label,
      starts_at: appointment.starts_at,
      status: 'booked',
    })
    .select()
    .single();

  if (error) throw error;
  return data as AppointmentRecord;
}

export async function getConsentEventsByLead(leadId: string): Promise<ConsentEvent[]> {
  const { data, error } = await supabase
    .from('consent_events')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ConsentEvent[];
}

export async function getFinanceApplications(): Promise<FinanceApplicationRecord[]> {
  const { data, error } = await supabase
    .from('finance_applications')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data as FinanceApplicationRecord[];
}

export async function createWorkflowRun(payload: {
  workflow_key: string;
  lead_id?: string;
  status?: WorkflowRun['status'];
  detail?: string;
}): Promise<WorkflowRun> {
  const { data, error } = await supabase
    .from('workflow_runs')
    .insert({
      workflow_key: payload.workflow_key,
      lead_id: payload.lead_id ?? null,
      status: payload.status ?? 'queued',
      detail: payload.detail ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as WorkflowRun;
}

export async function getWorkflowDefinitions(): Promise<WorkflowDefinition[]> {
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as WorkflowDefinition[];
}

export async function createReviewRequest(leadId: string): Promise<ReviewRequestRecord> {
  const { data, error } = await supabase
    .from('review_requests')
    .insert({
      lead_id: leadId,
      channel: 'sms',
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as ReviewRequestRecord;
}
