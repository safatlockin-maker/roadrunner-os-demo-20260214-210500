import { z } from 'zod';

// Zod schemas for validation
export const CommunicationTypeSchema = z.enum(['email', 'sms', 'phone_call', 'form_submission', 'note']);
export const CommunicationDirectionSchema = z.enum(['inbound', 'outbound']);
export const SentimentSchema = z.enum(['positive', 'neutral', 'negative']);

// Communication schema
export const CommunicationSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),

  // Relationship
  lead_id: z.string().uuid(),

  // Communication Details
  type: CommunicationTypeSchema,
  direction: CommunicationDirectionSchema,
  sender: z.string().optional().nullable(),
  recipient: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  content: z.string(),

  // AI Features
  ai_generated: z.boolean().default(false),
  sentiment: SentimentSchema.optional().nullable(),

  // Tracking
  read_at: z.string().datetime().optional().nullable(),
  responded_at: z.string().datetime().optional().nullable(),
});

// TypeScript types inferred from schemas
export type CommunicationType = z.infer<typeof CommunicationTypeSchema>;
export type CommunicationDirection = z.infer<typeof CommunicationDirectionSchema>;
export type Sentiment = z.infer<typeof SentimentSchema>;
export type Communication = z.infer<typeof CommunicationSchema>;

// Communication creation type (without generated fields)
export type CreateCommunicationInput = Omit<Communication, 'id' | 'created_at'>;

// Communication update type
export type UpdateCommunicationInput = Partial<Omit<Communication, 'id' | 'created_at' | 'lead_id'>>;

// Communication with lead info
export interface CommunicationWithLead extends Communication {
  lead?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
}

// Communication timeline item (for display)
export interface TimelineItem {
  id: string;
  timestamp: string;
  type: CommunicationType;
  direction: CommunicationDirection;
  content: string;
  sender?: string;
  recipient?: string;
  subject?: string;
  ai_generated?: boolean;
  sentiment?: Sentiment;
  icon?: string; // Icon name for display
  color?: string; // Color for timeline dot
}

// Communication filters for queries
export interface CommunicationFilters {
  lead_id?: string;
  type?: CommunicationType | CommunicationType[];
  direction?: CommunicationDirection;
  ai_generated?: boolean;
  sentiment?: Sentiment | Sentiment[];
  created_after?: string;
  created_before?: string;
  unread?: boolean; // read_at is null
  needs_response?: boolean; // direction=inbound && responded_at is null
}

// Communication metrics
export interface CommunicationMetrics {
  total_communications: number;
  inbound_count: number;
  outbound_count: number;
  ai_generated_count: number;
  avg_response_time_seconds: number;
  unread_count: number;
  needs_response_count: number;
  communications_by_type: Record<CommunicationType, number>;
  sentiment_distribution: Record<Sentiment, number>;
}
