import { createClient } from '@supabase/supabase-js';
import type { Lead, CreateLeadInput, UpdateLeadInput } from '../types/lead';
import type { Vehicle, CreateVehicleInput, UpdateVehicleInput } from '../types/inventory';
import type { Communication, CreateCommunicationInput } from '../types/communication';
import type { SalesRep } from '../types/salesRep';

// Supabase client configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// ============================================================================
// LEADS
// ============================================================================

export async function getLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      vehicle_interest:vehicle_interest_id (
        id, year, make, model, trim, list_price
      ),
      assigned_sales_rep:assigned_to (
        id, name, email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Lead[];
}

export async function getLeadById(id: string) {
  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      vehicle_interest:vehicle_interest_id (
        id, year, make, model, trim, list_price, images
      ),
      assigned_sales_rep:assigned_to (
        id, name, email, phone
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Lead;
}

export async function createLead(lead: CreateLeadInput) {
  const { data, error } = await supabase
    .from('leads')
    .insert(lead)
    .select()
    .single();

  if (error) throw error;
  return data as Lead;
}

export async function updateLead(id: string, updates: UpdateLeadInput) {
  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Lead;
}

export async function deleteLead(id: string) {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================================
// INVENTORY/VEHICLES
// ============================================================================

export async function getInventory() {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Vehicle[];
}

export async function getVehicleById(id: string) {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Vehicle;
}

export async function createVehicle(vehicle: CreateVehicleInput) {
  const { data, error } = await supabase
    .from('inventory')
    .insert(vehicle)
    .select()
    .single();

  if (error) throw error;
  return data as Vehicle;
}

export async function updateVehicle(id: string, updates: UpdateVehicleInput) {
  const { data, error } = await supabase
    .from('inventory')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Vehicle;
}

export async function deleteVehicle(id: string) {
  const { error } = await supabase
    .from('inventory')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================================
// COMMUNICATIONS
// ============================================================================

export async function getCommunicationsByLeadId(leadId: string) {
  const { data, error } = await supabase
    .from('communications')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Communication[];
}

export async function createCommunication(communication: CreateCommunicationInput) {
  const { data, error } = await supabase
    .from('communications')
    .insert(communication)
    .select()
    .single();

  if (error) throw error;
  return data as Communication;
}

// ============================================================================
// SALES REPS
// ============================================================================

export async function getSalesReps() {
  const { data, error } = await supabase
    .from('sales_reps')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data as SalesRep[];
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

export function subscribeToNewLeads(callback: (lead: Lead) => void) {
  return supabase
    .channel('leads_channel')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'leads' },
      (payload) => {
        callback(payload.new as Lead);
      }
    )
    .subscribe();
}

export function subscribeToLeadUpdates(callback: (lead: Lead) => void) {
  return supabase
    .channel('leads_updates_channel')
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'leads' },
      (payload) => {
        callback(payload.new as Lead);
      }
    )
    .subscribe();
}

export function subscribeToNewCommunications(leadId: string, callback: (communication: Communication) => void) {
  return supabase
    .channel(`communications_${leadId}_channel`)
    .on('postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'communications',
        filter: `lead_id=eq.${leadId}`
      },
      (payload) => {
        callback(payload.new as Communication);
      }
    )
    .subscribe();
}

// ============================================================================
// METRICS & ANALYTICS
// ============================================================================

export async function getLeadMetrics() {
  const { data: leads, error } = await supabase
    .from('leads')
    .select('status, source, urgency, lead_score, response_time_seconds, created_at, first_contact_at');

  if (error) throw error;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const newLeads = leads.filter(l => new Date(l.created_at) >= todayStart).length;
  const hotLeads = leads.filter(l => l.urgency === 'high' && l.lead_score > 80).length;
  const uncontacted = leads.filter(l => !l.first_contact_at).length;

  const avgResponseTime = leads
    .filter(l => l.response_time_seconds)
    .reduce((acc, l) => acc + (l.response_time_seconds || 0), 0) / leads.length || 0;

  const closedWon = leads.filter(l => l.status === 'closed_won').length;
  const conversionRate = (closedWon / leads.length) * 100 || 0;

  return {
    total_leads: leads.length,
    new_leads: newLeads,
    hot_leads: hotLeads,
    uncontacted_leads: uncontacted,
    conversion_rate: Math.round(conversionRate * 10) / 10,
    avg_response_time_seconds: Math.round(avgResponseTime),
  };
}

export async function getInventoryMetrics() {
  const { data: vehicles, error } = await supabase
    .from('inventory')
    .select('status, list_price, inquiry_count, days_in_inventory, body_style');

  if (error) throw error;

  const available = vehicles.filter(v => v.status === 'available').length;
  const pending = vehicles.filter(v => v.status === 'pending').length;
  const totalValue = vehicles
    .filter(v => v.status === 'available')
    .reduce((acc, v) => acc + v.list_price, 0);

  const avgDays = vehicles.reduce((acc, v) => acc + (v.days_in_inventory || 0), 0) / vehicles.length || 0;

  return {
    total_vehicles: vehicles.length,
    available_vehicles: available,
    pending_sales: pending,
    total_inventory_value: totalValue,
    avg_days_in_inventory: Math.round(avgDays),
    vehicles_without_inquiries: vehicles.filter(v => v.inquiry_count === 0).length,
  };
}
