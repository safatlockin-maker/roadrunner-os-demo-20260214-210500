-- Road Runner Auto Sales CRM - Database Schema
-- Copy this entire file and run in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sales Reps
CREATE TABLE sales_reps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  active_leads_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL,
  avg_response_time_seconds INTEGER,
  deals_this_month INTEGER DEFAULT 0,
  revenue_this_month INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Inventory
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  trim TEXT,
  vin TEXT UNIQUE,
  mileage INTEGER,
  exterior_color TEXT,
  interior_color TEXT,
  transmission TEXT,
  fuel_type TEXT,
  body_style TEXT,
  list_price INTEGER NOT NULL,
  cost INTEGER,
  days_in_inventory INTEGER DEFAULT 0,
  status TEXT DEFAULT 'available',
  images JSONB DEFAULT '[]',
  inquiry_count INTEGER DEFAULT 0,
  test_drive_count INTEGER DEFAULT 0,
  last_inquiry_at TIMESTAMPTZ
);

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  preferred_contact TEXT,
  source TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  lead_score INTEGER DEFAULT 50,
  urgency TEXT DEFAULT 'medium',
  vehicle_interest_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
  vehicle_interest_notes TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  has_trade_in BOOLEAN DEFAULT false,
  trade_in_details JSONB,
  assigned_to UUID REFERENCES sales_reps(id) ON DELETE SET NULL,
  first_contact_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  response_time_seconds INTEGER,
  closed_at TIMESTAMPTZ,
  closed_status TEXT,
  lost_reason TEXT,
  deal_value INTEGER
);

-- Communications
CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  direction TEXT NOT NULL,
  sender TEXT,
  recipient TEXT,
  subject TEXT,
  content TEXT NOT NULL,
  ai_generated BOOLEAN DEFAULT false,
  sentiment TEXT,
  read_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_score ON leads(lead_score DESC);
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_communications_lead ON communications(lead_id, created_at);

-- Enable RLS
ALTER TABLE sales_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

-- Allow all access (for demo)
CREATE POLICY "Allow all" ON sales_reps FOR ALL USING (true);
CREATE POLICY "Allow all" ON inventory FOR ALL USING (true);
CREATE POLICY "Allow all" ON leads FOR ALL USING (true);
CREATE POLICY "Allow all" ON communications FOR ALL USING (true);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_timestamp BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- ROADRUNNER OS EXTENSIONS
-- ============================================================================

-- Lead source and attribution event stream
CREATE TABLE lead_source_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  page_url TEXT NOT NULL,
  utm_source TEXT,
  utm_campaign TEXT,
  clicked_vehicle TEXT,
  location_intent TEXT
);

CREATE TABLE attribution_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Opportunities and stage history
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'new',
  expected_value INTEGER DEFAULT 0,
  location TEXT,
  assigned_to UUID REFERENCES sales_reps(id) ON DELETE SET NULL,
  next_action TEXT,
  checklist JSONB DEFAULT '{"quote_shared":false,"docs_requested":false,"consent_verified":false}'::jsonb
);

CREATE TABLE opportunity_stage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  previous_stage TEXT,
  next_stage TEXT NOT NULL,
  changed_by TEXT,
  reason TEXT
);

-- Conversation layer
CREATE TABLE conversation_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  location TEXT,
  assigned_to UUID REFERENCES sales_reps(id) ON DELETE SET NULL,
  has_unread BOOLEAN DEFAULT false,
  last_message_at TIMESTAMPTZ
);

CREATE TABLE message_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  thread_id UUID REFERENCES conversation_threads(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  channel TEXT NOT NULL,
  body TEXT NOT NULL,
  template_key TEXT,
  ai_assist_used BOOLEAN DEFAULT false
);

CREATE TABLE call_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  outcome TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  recording_url TEXT
);

-- Appointments and lifecycle
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  vehicle_label TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'booked',
  reminder_24h_sent_at TIMESTAMPTZ,
  reminder_2h_sent_at TIMESTAMPTZ
);

CREATE TABLE appointment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Workflow engine
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  trigger TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE workflow_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  definition JSONB NOT NULL
);

CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
  workflow_key TEXT NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  detail TEXT
);

-- Consent and finance
CREATE TABLE consent_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  consented BOOLEAN NOT NULL,
  source TEXT NOT NULL,
  proof TEXT NOT NULL
);

CREATE TABLE finance_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'started',
  completion_percent INTEGER DEFAULT 0,
  missing_items JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE finance_checklist_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finance_application_id UUID NOT NULL REFERENCES finance_applications(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  detail TEXT
);

-- Reputation management
CREATE TABLE review_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'sms',
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  suppression_reason TEXT
);

CREATE TABLE review_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  review_request_id UUID NOT NULL REFERENCES review_requests(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  detail TEXT
);

-- Performance indexes
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_lead ON opportunities(lead_id);
CREATE INDEX idx_threads_lead ON conversation_threads(lead_id);
CREATE INDEX idx_messages_thread ON message_events(thread_id, created_at DESC);
CREATE INDEX idx_calls_lead ON call_events(lead_id, created_at DESC);
CREATE INDEX idx_appointments_location_start ON appointments(location, starts_at);
CREATE INDEX idx_workflow_runs_status ON workflow_runs(status, created_at DESC);
CREATE INDEX idx_finance_status ON finance_applications(status);
CREATE INDEX idx_review_status ON review_requests(status);
CREATE INDEX idx_consent_lead_channel ON consent_events(lead_id, channel);

-- Row level security for new tables
ALTER TABLE lead_source_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribution_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_stage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_checklist_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_events ENABLE ROW LEVEL SECURITY;

-- Demo-open policies for new tables
CREATE POLICY "Allow all" ON lead_source_events FOR ALL USING (true);
CREATE POLICY "Allow all" ON attribution_events FOR ALL USING (true);
CREATE POLICY "Allow all" ON opportunities FOR ALL USING (true);
CREATE POLICY "Allow all" ON opportunity_stage_events FOR ALL USING (true);
CREATE POLICY "Allow all" ON conversation_threads FOR ALL USING (true);
CREATE POLICY "Allow all" ON message_events FOR ALL USING (true);
CREATE POLICY "Allow all" ON call_events FOR ALL USING (true);
CREATE POLICY "Allow all" ON appointments FOR ALL USING (true);
CREATE POLICY "Allow all" ON appointment_events FOR ALL USING (true);
CREATE POLICY "Allow all" ON workflows FOR ALL USING (true);
CREATE POLICY "Allow all" ON workflow_versions FOR ALL USING (true);
CREATE POLICY "Allow all" ON workflow_runs FOR ALL USING (true);
CREATE POLICY "Allow all" ON consent_events FOR ALL USING (true);
CREATE POLICY "Allow all" ON finance_applications FOR ALL USING (true);
CREATE POLICY "Allow all" ON finance_checklist_events FOR ALL USING (true);
CREATE POLICY "Allow all" ON review_requests FOR ALL USING (true);
CREATE POLICY "Allow all" ON review_events FOR ALL USING (true);

-- Auto-updated timestamps for extension tables
CREATE TRIGGER update_opportunities_timestamp BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_threads_timestamp BEFORE UPDATE ON conversation_threads
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_appointments_timestamp BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_finance_applications_timestamp BEFORE UPDATE ON finance_applications
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_review_requests_timestamp BEFORE UPDATE ON review_requests
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
