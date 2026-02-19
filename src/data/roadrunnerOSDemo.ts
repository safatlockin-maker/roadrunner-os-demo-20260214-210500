import type {
  AppointmentRecord,
  CallEvent,
  ConversationContext,
  ConsentEvent,
  ConversationThread,
  FinanceApplicationRecord,
  GuaranteeKpiSnapshot,
  LeadLifecycleRecord,
  MigrationMapping,
  MessageEvent,
  OpportunityRecord,
  ReviewRequestRecord,
  WorkflowDefinition,
  WorkflowRun,
} from '../types/roadrunnerOS';

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function isoHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function isoHoursAhead(hours: number): string {
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

export const osLeads: LeadLifecycleRecord[] = [
  {
    id: 'lead-os-1',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@email.com',
    phone: '734-555-2001',
    source: 'website_form',
    status: 'new',
    urgency: 'high',
    lead_score: 96,
    created_at: isoMinutesAgo(23),
    first_contact_at: null,
    last_contact_at: null,
    budget_max: 23000,
    has_trade_in: false,
    location_intent: 'wayne',
  },
  {
    id: 'lead-os-2',
    first_name: 'Robert',
    last_name: 'Chen',
    email: 'rchen@gmail.com',
    phone: '734-555-2002',
    source: 'phone',
    status: 'contacted',
    urgency: 'high',
    lead_score: 89,
    created_at: isoHoursAgo(5),
    first_contact_at: isoHoursAgo(4.8),
    last_contact_at: isoHoursAgo(2.1),
    budget_max: 35000,
    has_trade_in: true,
    location_intent: 'taylor',
  },
  {
    id: 'lead-os-3',
    first_name: 'Jessica',
    last_name: 'Williams',
    email: 'j.williams@outlook.com',
    phone: '734-555-2003',
    source: 'facebook',
    status: 'appointment_set',
    urgency: 'high',
    lead_score: 91,
    created_at: isoDaysAgo(1),
    first_contact_at: isoDaysAgo(1),
    last_contact_at: isoHoursAgo(10),
    budget_max: 27000,
    has_trade_in: false,
    location_intent: 'wayne',
  },
  {
    id: 'lead-os-4',
    first_name: 'Michael',
    last_name: 'Davis',
    email: 'mdavis@yahoo.com',
    phone: '734-555-2004',
    source: 'website_form',
    status: 'appointment_showed',
    urgency: 'medium',
    lead_score: 78,
    created_at: isoDaysAgo(2),
    first_contact_at: isoDaysAgo(2),
    last_contact_at: isoHoursAgo(12),
    budget_max: 22000,
    has_trade_in: false,
    location_intent: 'taylor',
  },
  {
    id: 'lead-os-5',
    first_name: 'Emily',
    last_name: 'Martinez',
    email: 'emily.m@gmail.com',
    phone: '734-555-2005',
    source: 'website_form',
    status: 'financing_review',
    urgency: 'medium',
    lead_score: 76,
    created_at: isoDaysAgo(4),
    first_contact_at: isoDaysAgo(4),
    last_contact_at: isoHoursAgo(19),
    budget_max: 15000,
    has_trade_in: false,
    location_intent: 'wayne',
  },
  {
    id: 'lead-os-6',
    first_name: 'David',
    last_name: 'Thompson',
    email: 'dthompson@email.com',
    phone: '734-555-2006',
    source: 'phone',
    status: 'negotiating',
    urgency: 'medium',
    lead_score: 84,
    created_at: isoDaysAgo(3),
    first_contact_at: isoDaysAgo(3),
    last_contact_at: isoHoursAgo(27),
    budget_max: 32000,
    has_trade_in: true,
    location_intent: 'taylor',
  },
  {
    id: 'lead-os-7',
    first_name: 'Jennifer',
    last_name: 'Brown',
    email: 'jbrown@gmail.com',
    phone: '734-555-2008',
    source: 'website_form',
    status: 'closed_won',
    urgency: 'medium',
    lead_score: 86,
    created_at: isoDaysAgo(20),
    first_contact_at: isoDaysAgo(20),
    last_contact_at: isoDaysAgo(2),
    budget_max: 28000,
    has_trade_in: true,
    location_intent: 'wayne',
  },
  {
    id: 'lead-os-8',
    first_name: 'William',
    last_name: 'Anderson',
    email: 'w.anderson@email.com',
    phone: '734-555-2010',
    source: 'website_form',
    status: 'closed_lost',
    urgency: 'low',
    lead_score: 66,
    created_at: isoDaysAgo(16),
    first_contact_at: isoDaysAgo(16),
    last_contact_at: isoDaysAgo(13),
    budget_max: 42000,
    has_trade_in: false,
    location_intent: 'wayne',
  },
];

export const osConversationThreads: ConversationThread[] = [
  {
    id: 'thread-1',
    lead_id: 'lead-os-1',
    location: 'wayne',
    assigned_rep: 'Wayne Sales Desk',
    has_unread: true,
    last_message_at: isoMinutesAgo(19),
    context: {
      page_url: '/used-cars-wayne-mi/2020-honda-accord',
      clicked_vehicle: '2020 Honda Accord Sport',
      utm_source: 'google_ads',
      utm_campaign: 'weekend-urgent-buyers',
      session_source: 'webchat',
      viewed_pages: ['/used-cars-wayne-mi', '/financing/index.htm', '/contact'],
    },
  },
  {
    id: 'thread-2',
    lead_id: 'lead-os-6',
    location: 'taylor',
    assigned_rep: 'Taylor Sales Desk',
    has_unread: false,
    last_message_at: isoHoursAgo(9),
    context: {
      page_url: '/cars-for-sale?make=Jeep',
      clicked_vehicle: '2020 Jeep Grand Cherokee',
      utm_source: 'facebook',
      utm_campaign: 'trade-in-upgrade',
      session_source: 'sms',
      viewed_pages: ['/cars-for-sale', '/virtual-financing'],
    },
  },
  {
    id: 'thread-3',
    lead_id: 'lead-os-5',
    location: 'wayne',
    assigned_rep: 'Ali Almo',
    has_unread: true,
    last_message_at: isoHoursAgo(3),
    context: {
      page_url: '/virtual-financing',
      clicked_vehicle: '2018 Chevrolet Malibu LT',
      utm_source: 'organic',
      utm_campaign: 'finance-form',
      session_source: 'form',
      viewed_pages: ['/virtual-financing', '/cars-for-sale?max_price=17000'],
    },
  },
];

export const osConversationContexts: Record<string, ConversationContext> = Object.fromEntries(
  osConversationThreads
    .filter((thread) => thread.context)
    .map((thread) => [thread.id, thread.context as ConversationContext]),
);

export const osMessageEvents: MessageEvent[] = [
  {
    id: 'msg-1',
    thread_id: 'thread-1',
    lead_id: 'lead-os-1',
    direction: 'inbound',
    channel: 'web_form',
    body: 'My car broke down and I need a reliable Accord by the weekend.',
    created_at: isoMinutesAgo(23),
  },
  {
    id: 'msg-2',
    thread_id: 'thread-1',
    lead_id: 'lead-os-1',
    direction: 'outbound',
    channel: 'sms',
    body: 'Thanks Sarah, I can reserve two options today. Is 5:15 PM good for a test drive?',
    created_at: isoMinutesAgo(16),
    template_key: 'hot_lead_fast_response',
    ai_assist_used: true,
  },
  {
    id: 'msg-3',
    thread_id: 'thread-2',
    lead_id: 'lead-os-6',
    direction: 'outbound',
    channel: 'sms',
    body: 'I can send updated terms if we lock your trade value tonight.',
    created_at: isoHoursAgo(9),
    template_key: 'negotiation_push',
    ai_assist_used: true,
  },
  {
    id: 'msg-4',
    thread_id: 'thread-3',
    lead_id: 'lead-os-5',
    direction: 'inbound',
    channel: 'sms',
    body: 'I can submit docs tonight. Which ones do you still need?',
    created_at: isoHoursAgo(3),
  },
];

export const osCallEvents: CallEvent[] = [
  {
    id: 'call-1',
    lead_id: 'lead-os-1',
    direction: 'inbound',
    outcome: 'missed',
    duration_seconds: 0,
    created_at: isoMinutesAgo(21),
  },
  {
    id: 'call-2',
    lead_id: 'lead-os-6',
    direction: 'outbound',
    outcome: 'answered',
    duration_seconds: 430,
    created_at: isoHoursAgo(11),
  },
  {
    id: 'call-3',
    lead_id: 'lead-os-5',
    direction: 'outbound',
    outcome: 'voicemail',
    duration_seconds: 37,
    created_at: isoHoursAgo(18),
  },
];

export const osOpportunities: OpportunityRecord[] = [
  {
    id: 'opp-1',
    lead_id: 'lead-os-1',
    title: 'Sarah Johnson - Accord urgency',
    stage: 'new',
    expected_value: 22500,
    location: 'wayne',
    assigned_rep: 'Wayne Sales Desk',
    next_action: 'Call within 5 minutes and lock appointment',
    updated_at: isoMinutesAgo(17),
    checklist: { quote_shared: false, docs_requested: false, consent_verified: false },
  },
  {
    id: 'opp-2',
    lead_id: 'lead-os-3',
    title: 'Jessica Williams - SUV switch',
    stage: 'appointment_set',
    expected_value: 26800,
    location: 'wayne',
    assigned_rep: 'Ali Almo',
    next_action: 'Send T-24h reminder and confirm vehicle',
    updated_at: isoHoursAgo(6),
    checklist: { quote_shared: true, docs_requested: false, consent_verified: true },
  },
  {
    id: 'opp-3',
    lead_id: 'lead-os-6',
    title: 'David Thompson - Jeep negotiation',
    stage: 'negotiating',
    expected_value: 31400,
    location: 'taylor',
    assigned_rep: 'Taylor Sales Desk',
    next_action: 'Trade appraisal refresh and payment option',
    updated_at: isoHoursAgo(7),
    checklist: { quote_shared: true, docs_requested: true, consent_verified: true },
  },
  {
    id: 'opp-4',
    lead_id: 'lead-os-5',
    title: 'Emily Martinez - first-time buyer',
    stage: 'financing_review',
    expected_value: 14800,
    location: 'wayne',
    assigned_rep: 'Ali Almo',
    next_action: 'Collect proof of income and residence',
    updated_at: isoHoursAgo(4),
    checklist: { quote_shared: true, docs_requested: true, consent_verified: true },
  },
  {
    id: 'opp-5',
    lead_id: 'lead-os-7',
    title: 'Jennifer Brown - minivan',
    stage: 'closed_won',
    expected_value: 27750,
    location: 'wayne',
    assigned_rep: 'Wayne Sales Desk',
    next_action: 'Request review after delivery check-in',
    updated_at: isoDaysAgo(1),
    checklist: { quote_shared: true, docs_requested: true, consent_verified: true },
  },
];

export const osAppointments: AppointmentRecord[] = [
  {
    id: 'appt-1',
    lead_id: 'lead-os-3',
    location: 'wayne',
    vehicle_label: '2020 Honda CR-V EX',
    starts_at: isoHoursAhead(19),
    status: 'booked',
    created_at: isoHoursAgo(6),
  },
  {
    id: 'appt-2',
    lead_id: 'lead-os-4',
    location: 'taylor',
    vehicle_label: '2019 Toyota Camry XLE',
    starts_at: isoHoursAgo(26),
    status: 'showed',
    created_at: isoDaysAgo(2),
  },
  {
    id: 'appt-3',
    lead_id: 'lead-os-2',
    location: 'taylor',
    vehicle_label: '2021 Ford F-150 Lariat',
    starts_at: isoHoursAgo(8),
    status: 'no_show',
    created_at: isoHoursAgo(30),
  },
];

export const osConsentEvents: ConsentEvent[] = [
  {
    id: 'consent-1',
    lead_id: 'lead-os-3',
    channel: 'sms',
    consented: true,
    source: 'website_form',
    proof: 'form_submission#93484',
    created_at: isoDaysAgo(1),
  },
  {
    id: 'consent-2',
    lead_id: 'lead-os-5',
    channel: 'sms',
    consented: true,
    source: 'finance_form',
    proof: 'finance_submission#66291',
    created_at: isoDaysAgo(3),
  },
];

export const osFinanceApplications: FinanceApplicationRecord[] = [
  {
    id: 'finance-1',
    lead_id: 'lead-os-5',
    status: 'needs_docs',
    completion_percent: 72,
    missing_items: ['Proof of income', 'Proof of residence'],
    started_at: isoDaysAgo(3),
    updated_at: isoHoursAgo(4),
  },
  {
    id: 'finance-2',
    lead_id: 'lead-os-7',
    status: 'approved',
    completion_percent: 100,
    missing_items: [],
    started_at: isoDaysAgo(12),
    updated_at: isoDaysAgo(2),
  },
];

export const osWorkflowDefinitions: WorkflowDefinition[] = [
  {
    id: 'wf-1',
    key: 'new_lead_fast_response',
    name: 'New Lead Fast Response',
    trigger: 'lead.created',
    is_active: true,
    action_count: 5,
  },
  {
    id: 'wf-2',
    key: 'missed_call_text_back',
    name: 'Missed Call Text-Back',
    trigger: 'call.missed',
    is_active: true,
    action_count: 3,
  },
  {
    id: 'wf-3',
    key: 'finance_incomplete_rescue',
    name: 'Finance Incomplete Rescue',
    trigger: 'finance.incomplete',
    is_active: true,
    action_count: 6,
  },
  {
    id: 'wf-4',
    key: 'stale_lead_reactivation_30d',
    name: 'Stale Lead Reactivation 30d',
    trigger: 'lead.stale_30d',
    is_active: true,
    action_count: 4,
  },
];

export const osWorkflowRuns: WorkflowRun[] = [
  {
    id: 'run-1',
    workflow_key: 'new_lead_fast_response',
    lead_id: 'lead-os-1',
    status: 'completed',
    created_at: isoMinutesAgo(16),
    detail: 'SMS + rep task + priority queue label applied',
  },
  {
    id: 'run-2',
    workflow_key: 'finance_incomplete_rescue',
    lead_id: 'lead-os-5',
    status: 'running',
    created_at: isoHoursAgo(2),
    detail: '24h reminder sent, waiting on docs',
  },
];

export const osReviewRequests: ReviewRequestRecord[] = [
  {
    id: 'review-1',
    lead_id: 'lead-os-7',
    status: 'sent',
    channel: 'sms',
    sent_at: isoHoursAgo(14),
  },
  {
    id: 'review-2',
    lead_id: 'lead-os-8',
    status: 'suppressed',
    channel: 'sms',
    suppression_reason: 'Closed lost - no review request',
  },
];

export const osMigrationMappings: MigrationMapping[] = [
  {
    id: 'map-1',
    podium_contact_id: 'podium-98231',
    roadrunner_lead_id: 'lead-os-1',
    confidence: 0.96,
    source: 'csv',
    created_at: isoDaysAgo(7),
  },
  {
    id: 'map-2',
    podium_contact_id: 'podium-98154',
    roadrunner_lead_id: 'lead-os-6',
    confidence: 0.91,
    source: 'webhook',
    created_at: isoDaysAgo(5),
  },
];

export const osGuaranteeBaselines: Record<GuaranteeKpiSnapshot['key'], number> = {
  time_to_first_response: 14.2,
  contact_rate: 52.1,
  appointment_set_rate: 24.6,
  show_rate: 57.2,
  finance_completion: 48.4,
};

// ─── Incoming Reviews (for Reputation page AI Respond feature) ───────────────

export interface IncomingReview {
  id: string;
  reviewer_name: string;
  rating: number;
  body: string;
  source: 'Google' | 'Facebook';
  received_at: string;
  responded: boolean;
  ai_response?: string;
}

export const osIncomingReviews: IncomingReview[] = [
  {
    id: 'review-in-1',
    reviewer_name: 'Marcus T.',
    rating: 5,
    body: 'Ali was fantastic from start to finish. Got me into a 2021 F-150 at a payment I could actually afford. No pressure, no games. Will be back for my next truck.',
    source: 'Google',
    received_at: isoHoursAgo(6),
    responded: false,
  },
  {
    id: 'review-in-2',
    reviewer_name: 'Patricia K.',
    rating: 3,
    body: 'The car itself is great but the whole process felt rushed and I waited over an hour in the finance office with no updates. Would have given 5 stars if the communication was better.',
    source: 'Google',
    received_at: isoHoursAgo(14),
    responded: false,
  },
  {
    id: 'review-in-3',
    reviewer_name: 'Jose R.',
    rating: 5,
    body: 'Drove 45 minutes from Dearborn and it was 100% worth it. They had the exact Accord I saw online, price matched it, and got me financed same day. Highly recommend the Taylor location.',
    source: 'Google',
    received_at: isoDaysAgo(1),
    responded: false,
  },
  {
    id: 'review-in-4',
    reviewer_name: 'Angela W.',
    rating: 3,
    body: 'Decent selection and the salesperson was friendly, but I felt like financing took way too long. Almost 3 hours total. The car is nice though.',
    source: 'Facebook',
    received_at: isoDaysAgo(2),
    responded: false,
  },
  {
    id: 'review-in-5',
    reviewer_name: 'Derek M.',
    rating: 5,
    body: 'Best car buying experience I have ever had. They texted me back within minutes of my inquiry and had 3 options ready when I showed up. Closed same day. Ask for Ali!',
    source: 'Google',
    received_at: isoDaysAgo(3),
    responded: true,
    ai_response: 'Thank you so much Derek! We love hearing this — getting you back on the road same day is exactly what we aim for. Ali will be thrilled! See you next time at Road Runner.',
  },
];

// ─── Campaign History (for Campaigns page Revenue Mining feature) ─────────────

export interface CampaignRecord {
  id: string;
  name: string;
  target_audience: string;
  vehicle_spotlight: string;
  goal: string;
  message_preview: string;
  sent_at: string;
  recipient_count: number;
  response_rate_percent: number;
  test_drives_booked: number;
  revenue_attributed: number;
}

export const osCampaignHistory: CampaignRecord[] = [
  {
    id: 'campaign-1',
    name: 'January Cold Lead Revival',
    target_audience: 'Cold leads 30+ days',
    vehicle_spotlight: '2022 Honda CR-V EX-L',
    goal: 'Test Drive',
    message_preview: 'Hey [Name], still looking for a reliable SUV? We just got a 2022 CR-V in under $28k. Weekend slots open — reply YES to grab one.',
    sent_at: isoDaysAgo(18),
    recipient_count: 31,
    response_rate_percent: 22.6,
    test_drives_booked: 7,
    revenue_attributed: 48500,
  },
  {
    id: 'campaign-2',
    name: 'Finance Rescue — December No-Shows',
    target_audience: 'Finance incomplete',
    vehicle_spotlight: '2021 Toyota Camry SE',
    goal: 'Financing Special',
    message_preview: 'Quick update [Name]: rates dropped this week. We can rerun your numbers and likely get your payment under $400/mo. Worth 10 minutes?',
    sent_at: isoDaysAgo(32),
    recipient_count: 18,
    response_rate_percent: 33.3,
    test_drives_booked: 4,
    revenue_attributed: 31200,
  },
  {
    id: 'campaign-3',
    name: 'Black Friday Truck Blitz',
    target_audience: 'All active leads',
    vehicle_spotlight: '2022 Ford F-150 XLT',
    goal: 'Price Drop Alert',
    message_preview: 'ROAD RUNNER DEAL: 2022 F-150 just dropped $2,100 — now $31,900. First come, first served. Reply or call 734-722-9500.',
    sent_at: isoDaysAgo(83),
    recipient_count: 54,
    response_rate_percent: 18.5,
    test_drives_booked: 10,
    revenue_attributed: 74000,
  },
];
