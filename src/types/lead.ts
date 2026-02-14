import { z } from 'zod';

// Zod schemas for validation
export const LeadSourceSchema = z.enum(['website_form', 'phone', 'facebook', 'walk_in', 'sms', 'email']);
export const LeadStatusSchema = z.enum(['new', 'contacted', 'interested', 'test_drive', 'negotiating', 'financing_review', 'closed_won', 'closed_lost']);
export const UrgencyLevelSchema = z.enum(['high', 'medium', 'low']);
export const PreferredContactSchema = z.enum(['email', 'phone', 'sms']);

// Trade-in details
export const TradeInDetailsSchema = z.object({
  year: z.number().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  mileage: z.number().optional(),
  condition: z.string().optional(),
  estimated_value: z.number().optional(),
  vin: z.string().optional(),
});

// Lead schema
export const LeadSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),

  // Contact Info
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  preferred_contact: PreferredContactSchema.optional(),

  // Lead Details
  source: LeadSourceSchema,
  status: LeadStatusSchema,
  lead_score: z.number().min(0).max(100),
  urgency: UrgencyLevelSchema,

  // Vehicle Interest
  vehicle_interest_id: z.string().uuid().optional().nullable(),
  vehicle_interest_notes: z.string().optional(),
  budget_min: z.number().optional().nullable(),
  budget_max: z.number().optional().nullable(),

  // Trade-In
  has_trade_in: z.boolean().default(false),
  trade_in_details: TradeInDetailsSchema.optional().nullable(),

  // Assignment
  assigned_to: z.string().uuid().optional().nullable(),

  // Tracking
  first_contact_at: z.string().datetime().optional().nullable(),
  last_contact_at: z.string().datetime().optional().nullable(),
  response_time_seconds: z.number().optional().nullable(),

  // Outcome
  closed_at: z.string().datetime().optional().nullable(),
  closed_status: z.enum(['won', 'lost']).optional().nullable(),
  lost_reason: z.string().optional().nullable(),
  deal_value: z.number().optional().nullable(),
});

// TypeScript types inferred from schemas
export type LeadSource = z.infer<typeof LeadSourceSchema>;
export type LeadStatus = z.infer<typeof LeadStatusSchema>;
export type UrgencyLevel = z.infer<typeof UrgencyLevelSchema>;
export type PreferredContact = z.infer<typeof PreferredContactSchema>;
export type TradeInDetails = z.infer<typeof TradeInDetailsSchema>;
export type Lead = z.infer<typeof LeadSchema>;

// Lead creation type (without generated fields)
export type CreateLeadInput = Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'lead_score'>;

// Lead update type
export type UpdateLeadInput = Partial<Omit<Lead, 'id' | 'created_at'>>;

// Lead with related data
export interface LeadWithRelations extends Lead {
  vehicle_interest?: {
    id: string;
    year: number;
    make: string;
    model: string;
    trim?: string;
    list_price: number;
  };
  assigned_sales_rep?: {
    id: string;
    name: string;
    email: string;
  };
  communications_count?: number;
  latest_communication?: string;
}

// Lead filters for queries
export interface LeadFilters {
  status?: LeadStatus | LeadStatus[];
  source?: LeadSource | LeadSource[];
  urgency?: UrgencyLevel | UrgencyLevel[];
  assigned_to?: string;
  min_score?: number;
  created_after?: string;
  created_before?: string;
  has_uncontacted?: boolean; // Leads without first_contact_at
}

// Lead metrics for dashboard
export interface LeadMetrics {
  total_leads: number;
  new_leads: number;
  hot_leads: number; // urgency=high && score>80
  uncontacted_leads: number;
  conversion_rate: number;
  avg_response_time_seconds: number;
  leads_by_status: Record<LeadStatus, number>;
  leads_by_source: Record<LeadSource, number>;
}
