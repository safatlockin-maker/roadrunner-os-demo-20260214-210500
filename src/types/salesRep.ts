import { z } from 'zod';

// Sales Rep schema
export const SalesRepSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),

  // Basic Info
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),

  // Performance Metrics
  active_leads_count: z.number().min(0).default(0),
  conversion_rate: z.number().min(0).max(100).optional().nullable(),
  avg_response_time_seconds: z.number().min(0).optional().nullable(),
  deals_this_month: z.number().min(0).default(0),
  revenue_this_month: z.number().min(0).default(0),

  // Status
  is_active: z.boolean().default(true),
});

// TypeScript types inferred from schemas
export type SalesRep = z.infer<typeof SalesRepSchema>;

// Sales Rep creation type (without generated fields)
export type CreateSalesRepInput = Omit<SalesRep, 'id' | 'created_at' | 'updated_at' | 'active_leads_count' | 'deals_this_month' | 'revenue_this_month'>;

// Sales Rep update type
export type UpdateSalesRepInput = Partial<Omit<SalesRep, 'id' | 'created_at'>>;

// Sales Rep with performance data
export interface SalesRepWithPerformance extends SalesRep {
  total_deals_closed: number;
  total_revenue: number;
  avg_deal_value: number;
  win_rate: number;
  leads_by_status: Record<string, number>;
  recent_deals: Array<{
    lead_id: string;
    customer_name: string;
    deal_value: number;
    closed_at: string;
  }>;
}

// Sales Rep metrics for leaderboard
export interface SalesRepMetrics {
  rep_id: string;
  rep_name: string;
  deals_closed: number;
  revenue: number;
  conversion_rate: number;
  avg_response_time_seconds: number;
  active_leads: number;
  rank: number;
}
