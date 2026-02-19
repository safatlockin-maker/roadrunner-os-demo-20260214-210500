import type { LeadSource, LeadStatus, UrgencyLevel } from './lead';
import type { BodyStyle, FuelType, VehicleStatus } from './inventory';
import type { LocationCode, OpportunityStage } from './roadrunnerOS';

export type DemoLocationFilter = 'all' | LocationCode;

export type LeadStatusFilter =
  | 'all'
  | 'new'
  | 'contacted'
  | 'appointment'
  | 'negotiating'
  | 'finance'
  | 'closed';

export type LeadQuickChip = 'sla_risk' | 'high_intent' | 'trade_in' | 'needs_finance';

export interface LeadTimelineEvent {
  id: string;
  type: 'sms' | 'call' | 'note';
  direction: 'inbound' | 'outbound';
  label: string;
  detail: string;
  timestamp: string;
}

export interface LeadRowModel {
  id: string;
  sourceLeadId: string;
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  sourceLabel: string;
  status: LeadStatus;
  statusLabel: string;
  statusFilter: LeadStatusFilter;
  urgency: UrgencyLevel;
  leadScore: number;
  location: LocationCode;
  owner: string;
  nextAction: string;
  createdAt: string;
  firstContactAt?: string;
  lastActivityAt: string;
  hasTradeIn: boolean;
  needsFinance: boolean;
  budgetMin?: number;
  budgetMax?: number;
  vehicleInterest: string;
  timeline: LeadTimelineEvent[];
}

export interface LeadsKpiSnapshot {
  totalActive: number;
  slaBreaches: number;
  hotLeads: number;
  contactedToday: number;
}

export interface LeadFilterState {
  location: DemoLocationFilter;
  source: 'all' | LeadSource;
  status: LeadStatusFilter;
  chips: LeadQuickChip[];
}

export interface StageChecklistModel {
  quote_shared: boolean;
  docs_requested: boolean;
  consent_verified: boolean;
}

export interface PipelineCardModel {
  id: string;
  sourceLeadId: string;
  leadName: string;
  stage: OpportunityStage;
  expectedValue: number;
  location: LocationCode;
  owner: string;
  nextAction: string;
  updatedAt: string;
  stageAgeDays: number;
  checklist: StageChecklistModel;
}

export interface PipelineMetricsSnapshot {
  openPipelineValue: number;
  contactedToAppointmentRate: number;
  appointmentShowRate: number;
  closedWonThisMonth: number;
}

export type InventoryQuickChip = 'aging_risk' | 'high_demand' | 'luxury' | 'budget';

export interface InventoryRowModel {
  id: string;
  sourceVehicleId: string;
  label: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage: number;
  listPrice: number;
  bodyStyle: BodyStyle;
  fuelType: FuelType;
  status: VehicleStatus;
  location: LocationCode;
  daysInInventory: number;
  inquiryCount: number;
  isHot: boolean;
  isAging: boolean;
  isPriceDropCandidate: boolean;
  matchingLeadIds: string[];
  alternativeBlastCount: number;
}

export interface InventoryKpiSnapshot {
  totalUnits: number;
  agingUnits: number;
  highDemandUnits: number;
  averageListPrice: number;
}

export interface InventoryFilterState {
  location: DemoLocationFilter;
  bodyStyle: 'all' | BodyStyle;
  fuelType: 'all' | FuelType;
  status: 'all' | VehicleStatus;
  search: string;
  chips: InventoryQuickChip[];
}
