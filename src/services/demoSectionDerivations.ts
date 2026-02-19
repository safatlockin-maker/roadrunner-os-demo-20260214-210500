import { demoLeads, demoSalesReps } from '../data/demoData';
import { realisticInventory } from '../data/realisticInventory';
import { osAppointments, osConsentEvents } from '../data/roadrunnerOSDemo';
import { websiteIntelligence } from '../data/websiteIntelligence';
import { validateOpportunityStageTransition } from './roadrunnerOS';
import type {
  DemoLocationFilter,
  LeadFilterState,
  LeadQuickChip,
  LeadRowModel,
  LeadsKpiSnapshot,
  InventoryFilterState,
  InventoryKpiSnapshot,
  InventoryRowModel,
  InventoryQuickChip,
  PipelineCardModel,
  PipelineMetricsSnapshot,
  StageChecklistModel,
} from '../types/demoSections';
import type {
  BodyStyle,
  FuelType,
  Vehicle,
  VehicleStatus,
} from '../types/inventory';
import type { Lead, LeadSource, LeadStatus } from '../types/lead';
import type {
  AppointmentRecord,
  ConsentEvent,
  LocationCode,
  OpportunityRecord,
  OpportunityStage,
} from '../types/roadrunnerOS';

const LEAD_LOCATION_BUDGET_THRESHOLD = 30_000;
const INVENTORY_LOCATION_PRICE_THRESHOLD = 30_000;
const APPOINTMENT_PRICE_BAND_BUFFER = 4_000;

const pipelineStageOrder: OpportunityStage[] = [
  'new',
  'contacted',
  'appointment_set',
  'appointment_showed',
  'negotiating',
  'financing_review',
  'closed_won',
  'closed_lost',
];

export const PIPELINE_STAGE_ORDER = pipelineStageOrder;

export const PIPELINE_STAGE_LABELS: Record<OpportunityStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  appointment_set: 'Appointment Set',
  appointment_showed: 'Appointment Showed',
  negotiating: 'Negotiating',
  financing_review: 'Financing Review',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

const sourceLabels: Record<LeadSource, string> = {
  website_form: 'Website',
  phone: 'Phone',
  facebook: 'Facebook',
  walk_in: 'Walk-In',
  sms: 'SMS',
  email: 'Email',
};

const SOURCE_OPTIONS: Array<'all' | LeadSource> = ['all', 'website_form', 'phone', 'facebook', 'walk_in', 'sms', 'email'];

const statusLabels: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  test_drive: 'Appointment',
  negotiating: 'Negotiating',
  financing_review: 'Financing Review',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

const ownerPool = demoSalesReps
  .map((rep) => rep.name?.trim())
  .filter((name): name is string => Boolean(name));

const bodyStyleKeywords: BodyStyle[] = [
  'suv',
  'sedan',
  'truck',
  'coupe',
  'hatchback',
  'van',
  'wagon',
  'convertible',
];

function toSnapshotDateLabel(snapshotDate: string): string {
  const parsed = new Date(`${snapshotDate}T12:00:00`);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

export const DEMO_SNAPSHOT_DATE_LABEL = toSnapshotDateLabel(websiteIntelligence.snapshotDate);

function normalizePhone(value?: string | null): string {
  return (value ?? '').replace(/\D/g, '');
}

function normalizeEmail(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function safePercent(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

function minutesBetween(startIso: string, endIso: string): number {
  const start = parseDate(startIso);
  const end = parseDate(endIso);
  if (!start || !end) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
}

function hoursAgo(now: Date, hours: number): string {
  return new Date(now.getTime() - hours * 3_600_000).toISOString();
}

function minutesAgo(now: Date, minutes: number): string {
  return new Date(now.getTime() - minutes * 60_000).toISOString();
}

function daysAgo(now: Date, days: number): string {
  return new Date(now.getTime() - days * 86_400_000).toISOString();
}

function getLeadSource(value: unknown): LeadSource {
  if (typeof value === 'string' && SOURCE_OPTIONS.includes(value as LeadSource)) {
    return value as LeadSource;
  }
  return 'website_form';
}

function getLeadStatus(value: unknown): LeadStatus {
  if (typeof value !== 'string') return 'new';

  if (
    value === 'new' ||
    value === 'contacted' ||
    value === 'interested' ||
    value === 'test_drive' ||
    value === 'negotiating' ||
    value === 'financing_review' ||
    value === 'closed_won' ||
    value === 'closed_lost'
  ) {
    return value;
  }

  return 'new';
}

function toBodyStyle(value: unknown): BodyStyle {
  if (typeof value === 'string' && bodyStyleKeywords.includes(value as BodyStyle)) {
    return value as BodyStyle;
  }
  return 'sedan';
}

function toFuelType(value: unknown): FuelType {
  if (value === 'gasoline' || value === 'diesel' || value === 'hybrid' || value === 'electric' || value === 'plug_in_hybrid') {
    return value;
  }
  return 'gasoline';
}

function toVehicleStatus(value: unknown): VehicleStatus {
  if (value === 'available' || value === 'pending' || value === 'sold' || value === 'service') {
    return value;
  }
  return 'available';
}

function statusToFilter(status: LeadStatus): LeadRowModel['statusFilter'] {
  if (status === 'new') return 'new';
  if (status === 'contacted' || status === 'interested') return 'contacted';
  if (status === 'test_drive') return 'appointment';
  if (status === 'negotiating') return 'negotiating';
  if (status === 'financing_review') return 'finance';
  return 'closed';
}

function statusToPipelineStage(status: LeadStatus, index: number): OpportunityStage {
  switch (status) {
    case 'new':
      return 'new';
    case 'contacted':
    case 'interested':
      return 'contacted';
    case 'test_drive':
      return index % 2 === 0 ? 'appointment_set' : 'appointment_showed';
    case 'negotiating':
      return 'negotiating';
    case 'financing_review':
      return 'financing_review';
    case 'closed_won':
      return 'closed_won';
    case 'closed_lost':
      return 'closed_lost';
    default:
      return 'new';
  }
}

function defaultChecklist(stage: OpportunityStage, index: number): StageChecklistModel {
  if (stage === 'closed_won' || stage === 'closed_lost') {
    return { quote_shared: true, docs_requested: true, consent_verified: true };
  }

  if (stage === 'financing_review') {
    return { quote_shared: true, docs_requested: true, consent_verified: true };
  }

  if (stage === 'negotiating') {
    return {
      quote_shared: true,
      docs_requested: index % 2 === 0,
      consent_verified: true,
    };
  }

  if (stage === 'appointment_showed') {
    return {
      quote_shared: true,
      docs_requested: false,
      consent_verified: index % 3 !== 0,
    };
  }

  if (stage === 'appointment_set') {
    return {
      quote_shared: index % 2 === 0,
      docs_requested: false,
      consent_verified: index % 3 !== 1,
    };
  }

  if (stage === 'contacted') {
    return {
      quote_shared: index % 4 === 0,
      docs_requested: false,
      consent_verified: index % 3 === 0,
    };
  }

  return {
    quote_shared: false,
    docs_requested: false,
    consent_verified: false,
  };
}

function buildCreatedAt(now: Date, status: LeadStatus, index: number): string {
  if (status === 'new') return minutesAgo(now, 8 + index * 7);
  if (status === 'contacted' || status === 'interested') return hoursAgo(now, 2 + index * 1.4);
  if (status === 'test_drive') return hoursAgo(now, 14 + index * 2.2);
  if (status === 'negotiating' || status === 'financing_review') return daysAgo(now, 2 + index);
  return daysAgo(now, 10 + index);
}

function buildFirstContactAt(status: LeadStatus, createdAt: string, index: number): string | undefined {
  if (status === 'new') {
    return index % 3 === 0 ? undefined : new Date(parseDate(createdAt)!.getTime() + (6 + (index % 5)) * 60_000).toISOString();
  }

  return new Date(parseDate(createdAt)!.getTime() + (3 + (index % 8)) * 60_000).toISOString();
}

function buildLastActivityAt(now: Date, status: LeadStatus, createdAt: string, firstContactAt: string | undefined, index: number): string {
  const created = parseDate(createdAt)!;
  const firstContact = parseDate(firstContactAt) ?? created;

  if (!firstContactAt && status === 'new') {
    return createdAt;
  }

  if (status === 'closed_won' || status === 'closed_lost') {
    return new Date(created.getTime() + (3 + (index % 5)) * 86_400_000).toISOString();
  }

  if (status === 'negotiating' || status === 'financing_review') {
    const candidate = hoursAgo(now, 5 + index * 0.8);
    return parseDate(candidate)!.getTime() > firstContact.getTime() ? candidate : firstContact.toISOString();
  }

  const candidate = hoursAgo(now, 1 + index * 0.5);
  return parseDate(candidate)!.getTime() > firstContact.getTime() ? candidate : firstContact.toISOString();
}

function leadLocationFromContact(phone: string, email?: string): LocationCode | null {
  const normalizedPhone = normalizePhone(phone);
  const normalizedEmail = normalizeEmail(email);

  for (const lead of osConsentEvents) {
    if (!normalizedPhone && !normalizedEmail) break;
    if (normalizedEmail && lead.proof.toLowerCase().includes(normalizedEmail)) {
      return lead.source === 'finance_form' ? 'wayne' : 'taylor';
    }
  }

  if (normalizedPhone.endsWith('2002') || normalizedPhone.endsWith('2004') || normalizedPhone.endsWith('2006')) {
    return 'taylor';
  }

  if (normalizedPhone.endsWith('2001') || normalizedPhone.endsWith('2003') || normalizedPhone.endsWith('2005')) {
    return 'wayne';
  }

  return null;
}

function leadNextAction(status: LeadStatus, needsFinance: boolean): string {
  if (status === 'new') return 'Call inside 5 minutes and lock appointment slot';
  if (status === 'contacted' || status === 'interested') return 'Send 2 matching units and push booking';
  if (status === 'test_drive') return 'Confirm visit time and prep vehicle';
  if (status === 'negotiating') return 'Refresh terms and hold trade value';
  if (status === 'financing_review') return 'Collect missing docs and resubmit today';
  if (needsFinance) return 'Offer finance pre-qual assistance';
  if (status === 'closed_won') return 'Request review and referral';
  return 'Queue 30-day reactivation touch';
}

function buildLeadTimeline(
  leadId: string,
  note: string,
  createdAt: string,
  firstContactAt: string | undefined,
  lastActivityAt: string,
): LeadRowModel['timeline'] {
  const records: LeadRowModel['timeline'] = [
    {
      id: `${leadId}-timeline-1`,
      type: 'note',
      direction: 'inbound',
      label: 'Web inquiry',
      detail: truncate(note, 120),
      timestamp: createdAt,
    },
  ];

  if (firstContactAt) {
    records.push({
      id: `${leadId}-timeline-2`,
      type: 'sms',
      direction: 'outbound',
      label: 'Rep SMS',
      detail: 'Shared matching inventory and asked to confirm preferred appointment time.',
      timestamp: firstContactAt,
    });
  }

  records.push({
    id: `${leadId}-timeline-3`,
    type: 'call',
    direction: 'outbound',
    label: 'Call attempt',
    detail: 'Follow-up call to progress next stage and lock deal momentum.',
    timestamp: lastActivityAt,
  });

  return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function statusPriority(status: LeadStatus): number {
  if (status === 'new') return 6;
  if (status === 'contacted' || status === 'interested') return 5;
  if (status === 'test_drive') return 4;
  if (status === 'negotiating') return 3;
  if (status === 'financing_review') return 2;
  return 1;
}

function urgencyPriority(urgency: LeadRowModel['urgency']): number {
  if (urgency === 'high') return 3;
  if (urgency === 'medium') return 2;
  return 1;
}

function includesBodyStyleKeyword(interest: string, bodyStyle: BodyStyle): boolean {
  const normalized = interest.toLowerCase();
  return normalized.includes(bodyStyle.replace('_', ' '));
}

function toLocationCounts<T extends { location: LocationCode }>(records: T[]): Record<DemoLocationFilter, number> {
  return {
    all: records.length,
    wayne: records.filter((record) => record.location === 'wayne').length,
    taylor: records.filter((record) => record.location === 'taylor').length,
  };
}

function resolveLeadLocation(budgetMax: number | undefined, explicitLocation: LocationCode | null): LocationCode {
  if (explicitLocation) return explicitLocation;
  return (budgetMax ?? 0) > LEAD_LOCATION_BUDGET_THRESHOLD ? 'taylor' : 'wayne';
}

function resolveInventoryLocation(price: number): LocationCode {
  return price >= INVENTORY_LOCATION_PRICE_THRESHOLD ? 'taylor' : 'wayne';
}

export function deriveLeadLocationFromBudget(budgetMax: number | undefined, explicitLocation: LocationCode | null): LocationCode {
  return resolveLeadLocation(budgetMax, explicitLocation);
}

export function deriveInventoryLocationFromPrice(price: number): LocationCode {
  return resolveInventoryLocation(price);
}

export function buildLeadRows(now = new Date()): LeadRowModel[] {
  return demoLeads.map((entry, index) => {
    const lead = entry as Partial<Lead>;
    const status = getLeadStatus(lead.status);
    const source = getLeadSource(lead.source);
    const leadId = lead.id ?? `lead-demo-${index + 1}`;

    const firstName = lead.first_name?.trim() || `Lead ${index + 1}`;
    const lastName = lead.last_name?.trim() || 'Customer';
    const name = `${firstName} ${lastName}`;

    const vehicleInterest = lead.vehicle_interest_notes?.trim() || 'Interested in available inventory options.';
    const budgetMin = lead.budget_min ?? undefined;
    const budgetMax = lead.budget_max ?? undefined;

    const explicitLocation = leadLocationFromContact(lead.phone ?? '', lead.email ?? undefined);
    const location = resolveLeadLocation(budgetMax, explicitLocation);

    const needsFinance =
      status === 'financing_review' ||
      /finance|credit|pre-qual|approval|down payment/i.test(vehicleInterest) ||
      (budgetMax ?? Number.POSITIVE_INFINITY) <= 18_000;

    const createdAt = buildCreatedAt(now, status, index);
    const firstContactAt = buildFirstContactAt(status, createdAt, index);
    const lastActivityAt = buildLastActivityAt(now, status, createdAt, firstContactAt, index);

    const owner = ownerPool[index % ownerPool.length] ?? 'Sales Desk';

    return {
      id: leadId,
      sourceLeadId: leadId,
      name,
      phone: lead.phone ?? '(734) 555-0000',
      email: lead.email ?? undefined,
      source,
      sourceLabel: sourceLabels[source],
      status,
      statusLabel: statusLabels[status],
      statusFilter: statusToFilter(status),
      urgency: lead.urgency ?? 'medium',
      leadScore: clamp(lead.lead_score ?? 70, 0, 100),
      location,
      owner,
      nextAction: leadNextAction(status, needsFinance),
      createdAt,
      firstContactAt,
      lastActivityAt,
      hasTradeIn: Boolean(lead.has_trade_in),
      needsFinance,
      budgetMin,
      budgetMax,
      vehicleInterest,
      timeline: buildLeadTimeline(leadId, vehicleInterest, createdAt, firstContactAt, lastActivityAt),
    };
  });
}

export function getLeadWaitMinutes(lead: LeadRowModel, now = new Date()): number {
  if (lead.firstContactAt) {
    return minutesBetween(lead.createdAt, lead.firstContactAt);
  }

  const created = parseDate(lead.createdAt);
  if (!created) return 0;
  return Math.max(0, Math.round((now.getTime() - created.getTime()) / 60_000));
}

export function isLeadSlaRisk(lead: LeadRowModel, now = new Date()): boolean {
  return lead.statusFilter !== 'closed' && !lead.firstContactAt && getLeadWaitMinutes(lead, now) > 5;
}

export function formatRelativeTime(isoTimestamp: string, now = new Date()): string {
  const timestamp = parseDate(isoTimestamp);
  if (!timestamp) return 'n/a';

  const diffMs = now.getTime() - timestamp.getTime();
  const absMinutes = Math.round(Math.abs(diffMs) / 60_000);

  if (absMinutes < 1) return 'just now';
  if (absMinutes < 60) return `${absMinutes}m ago`;

  const hours = Math.round(absMinutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function buildLeadKpis(leads: LeadRowModel[], now = new Date()): LeadsKpiSnapshot {
  const active = leads.filter((lead) => lead.statusFilter !== 'closed');

  const contactedToday = active.filter((lead) => {
    const firstContact = parseDate(lead.firstContactAt);
    if (!firstContact) return false;

    return (
      firstContact.getDate() === now.getDate() &&
      firstContact.getMonth() === now.getMonth() &&
      firstContact.getFullYear() === now.getFullYear()
    );
  }).length;

  return {
    totalActive: active.length,
    slaBreaches: active.filter((lead) => isLeadSlaRisk(lead, now)).length,
    hotLeads: active.filter((lead) => lead.leadScore >= 80).length,
    contactedToday,
  };
}

export function applyLeadFilters(leads: LeadRowModel[], filters: LeadFilterState, now = new Date()): LeadRowModel[] {
  return leads
    .filter((lead) => (filters.location === 'all' ? true : lead.location === filters.location))
    .filter((lead) => (filters.source === 'all' ? true : lead.source === filters.source))
    .filter((lead) => (filters.status === 'all' ? true : lead.statusFilter === filters.status))
    .filter((lead) => matchesLeadChips(lead, filters.chips, now))
    .sort((a, b) => {
      const urgencyDelta = urgencyPriority(b.urgency) - urgencyPriority(a.urgency);
      if (urgencyDelta !== 0) return urgencyDelta;

      const waitDelta = getLeadWaitMinutes(b, now) - getLeadWaitMinutes(a, now);
      if (waitDelta !== 0) return waitDelta;

      const statusDelta = statusPriority(b.status) - statusPriority(a.status);
      if (statusDelta !== 0) return statusDelta;

      return b.leadScore - a.leadScore;
    });
}

function matchesLeadChips(lead: LeadRowModel, chips: LeadQuickChip[], now: Date): boolean {
  return chips.every((chip) => {
    if (chip === 'sla_risk') return isLeadSlaRisk(lead, now);
    if (chip === 'high_intent') return lead.leadScore >= 80;
    if (chip === 'trade_in') return lead.hasTradeIn;
    if (chip === 'needs_finance') return lead.needsFinance;
    return true;
  });
}

export function getLeadLocationCounts<T extends { location: LocationCode }>(leads: T[]): Record<DemoLocationFilter, number> {
  return toLocationCounts(leads);
}

export function buildPipelineCards(leads: LeadRowModel[], now = new Date()): PipelineCardModel[] {
  return leads.map((lead, index) => {
    const stage = statusToPipelineStage(lead.status, index);
    const expectedValue = lead.budgetMax ?? lead.budgetMin ?? 17_500;
    const lastTouch = parseDate(lead.lastActivityAt) ?? now;
    const stageAgeDays = Math.max(0, Math.round((now.getTime() - lastTouch.getTime()) / 86_400_000));

    return {
      id: `pipe-${lead.id}`,
      sourceLeadId: lead.sourceLeadId,
      leadName: lead.name,
      stage,
      expectedValue,
      location: lead.location,
      owner: lead.owner,
      nextAction: lead.nextAction,
      updatedAt: lead.lastActivityAt,
      stageAgeDays,
      checklist: defaultChecklist(stage, index),
    };
  });
}

function isOpenStage(stage: OpportunityStage): boolean {
  return stage !== 'closed_won' && stage !== 'closed_lost';
}

export function buildPipelineMetrics(
  cards: PipelineCardModel[],
  appointments: AppointmentRecord[] = osAppointments,
  now = new Date(),
): PipelineMetricsSnapshot {
  const openPipelineValue = cards
    .filter((card) => isOpenStage(card.stage))
    .reduce((sum, card) => sum + card.expectedValue, 0);

  const contactedCount = cards.filter((card) => card.stage === 'contacted').length;
  const appointmentCount = cards.filter((card) => card.stage === 'appointment_set' || card.stage === 'appointment_showed').length;

  const showedAppointments = appointments.filter((appointment) => appointment.status === 'showed').length;
  const noShowAppointments = appointments.filter((appointment) => appointment.status === 'no_show').length;

  const closedWonThisMonth = cards.filter((card) => {
    if (card.stage !== 'closed_won') return false;
    const updated = parseDate(card.updatedAt);
    if (!updated) return false;

    return updated.getFullYear() === now.getFullYear() && updated.getMonth() === now.getMonth();
  }).length;

  return {
    openPipelineValue,
    contactedToAppointmentRate: safePercent(appointmentCount, contactedCount),
    appointmentShowRate: safePercent(showedAppointments, showedAppointments + noShowAppointments),
    closedWonThisMonth,
  };
}

export function isPipelineCardAtRisk(card: PipelineCardModel): boolean {
  if (card.stage === 'new' || card.stage === 'contacted') {
    return card.stageAgeDays >= 2;
  }

  if (card.stage === 'appointment_set' || card.stage === 'appointment_showed') {
    return card.stageAgeDays >= 3;
  }

  if (card.stage === 'negotiating' || card.stage === 'financing_review') {
    return card.stageAgeDays >= 4;
  }

  return false;
}

export function evaluatePipelineStageTransition(
  card: PipelineCardModel,
  nextStage: OpportunityStage,
): { allowed: boolean; reasons: string[] } {
  const mockOpportunity: OpportunityRecord = {
    id: card.id,
    lead_id: card.sourceLeadId,
    title: card.leadName,
    stage: card.stage,
    expected_value: card.expectedValue,
    location: card.location,
    assigned_rep: card.owner,
    next_action: card.nextAction,
    updated_at: card.updatedAt,
    checklist: card.checklist,
  };

  const syntheticConsent: ConsentEvent[] = card.checklist.consent_verified
    ? [
        {
          id: `consent-${card.id}`,
          lead_id: card.sourceLeadId,
          channel: 'sms',
          consented: true,
          source: 'manual',
          proof: 'demo-checklist-consent',
          created_at: new Date().toISOString(),
        },
      ]
    : [];

  return validateOpportunityStageTransition(mockOpportunity, nextStage, [...osConsentEvents, ...syntheticConsent]);
}

function matchesBudget(lead: LeadRowModel, listPrice: number): boolean {
  const min = lead.budgetMin ?? 0;
  const max = lead.budgetMax ?? (lead.budgetMin ?? 0) + 8_000;
  return listPrice >= min - APPOINTMENT_PRICE_BAND_BUFFER && listPrice <= max + APPOINTMENT_PRICE_BAND_BUFFER;
}

function estimateVehicleMatchLeadIds(listPrice: number, bodyStyle: BodyStyle, leads: LeadRowModel[]): string[] {
  return leads
    .filter((lead) => lead.statusFilter !== 'closed')
    .filter((lead) => matchesBudget(lead, listPrice))
    .filter((lead) => {
      const interest = lead.vehicleInterest.toLowerCase();
      const hasSpecificPreference = bodyStyleKeywords.some((style) => interest.includes(style));
      if (!hasSpecificPreference) return true;
      return includesBodyStyleKeyword(interest, bodyStyle);
    })
    .map((lead) => lead.id);
}

function inventoryAlternativeCount(matchCount: number): number {
  if (matchCount === 0) return 0;
  return Math.max(1, Math.round(matchCount * 0.65));
}

export function buildInventoryRows(leads: LeadRowModel[]): InventoryRowModel[] {
  return realisticInventory.map((entry, index) => {
    const vehicle = entry as Partial<Vehicle>;

    const listPrice = vehicle.list_price ?? 15_995;
    const bodyStyle = toBodyStyle(vehicle.body_style);
    const matchLeadIds = estimateVehicleMatchLeadIds(listPrice, bodyStyle, leads);

    const id = vehicle.id ?? `inventory-demo-${index + 1}`;
    const sourceVehicleId = vehicle.id ?? id;

    return {
      id,
      sourceVehicleId,
      label: `${vehicle.year ?? 2020} ${vehicle.make ?? 'Vehicle'} ${vehicle.model ?? 'Unit'}${vehicle.trim ? ` ${vehicle.trim}` : ''}`,
      year: vehicle.year ?? 2020,
      make: vehicle.make ?? 'Unknown',
      model: vehicle.model ?? 'Model',
      trim: vehicle.trim ?? undefined,
      mileage: vehicle.mileage ?? 0,
      listPrice,
      bodyStyle,
      fuelType: toFuelType(vehicle.fuel_type),
      status: toVehicleStatus(vehicle.status),
      location: resolveInventoryLocation(listPrice),
      daysInInventory: vehicle.days_in_inventory ?? 0,
      inquiryCount: vehicle.inquiry_count ?? 0,
      isHot: (vehicle.inquiry_count ?? 0) >= 9,
      isAging: (vehicle.days_in_inventory ?? 0) >= 30,
      isPriceDropCandidate: (vehicle.days_in_inventory ?? 0) >= 24 && (vehicle.inquiry_count ?? 0) <= 6,
      matchingLeadIds: matchLeadIds,
      alternativeBlastCount: inventoryAlternativeCount(matchLeadIds.length),
    };
  });
}

export function applyInventoryFilters(rows: InventoryRowModel[], filters: InventoryFilterState): InventoryRowModel[] {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return rows
    .filter((row) => (filters.location === 'all' ? true : row.location === filters.location))
    .filter((row) => (filters.bodyStyle === 'all' ? true : row.bodyStyle === filters.bodyStyle))
    .filter((row) => (filters.fuelType === 'all' ? true : row.fuelType === filters.fuelType))
    .filter((row) => (filters.status === 'all' ? true : row.status === filters.status))
    .filter((row) =>
      normalizedSearch.length === 0
        ? true
        : `${row.year} ${row.make} ${row.model} ${row.trim ?? ''}`.toLowerCase().includes(normalizedSearch),
    )
    .filter((row) => matchesInventoryChips(row, filters.chips))
    .sort((a, b) => {
      if (a.status !== b.status) {
        if (a.status === 'available') return -1;
        if (b.status === 'available') return 1;
      }

      if (b.inquiryCount !== a.inquiryCount) return b.inquiryCount - a.inquiryCount;
      return a.daysInInventory - b.daysInInventory;
    });
}

function matchesInventoryChips(row: InventoryRowModel, chips: InventoryQuickChip[]): boolean {
  return chips.every((chip) => {
    if (chip === 'aging_risk') return row.isAging;
    if (chip === 'high_demand') return row.isHot;
    if (chip === 'luxury') return row.listPrice >= 50_000;
    if (chip === 'budget') return row.listPrice <= 20_000;
    return true;
  });
}

export function buildInventoryKpis(rows: InventoryRowModel[]): InventoryKpiSnapshot {
  if (rows.length === 0) {
    return {
      totalUnits: 0,
      agingUnits: 0,
      highDemandUnits: 0,
      averageListPrice: 0,
    };
  }

  const totalValue = rows.reduce((sum, row) => sum + row.listPrice, 0);

  return {
    totalUnits: rows.length,
    agingUnits: rows.filter((row) => row.isAging).length,
    highDemandUnits: rows.filter((row) => row.isHot).length,
    averageListPrice: Math.round(totalValue / rows.length),
  };
}

export function getInventoryLocationCounts(rows: InventoryRowModel[]): Record<DemoLocationFilter, number> {
  return toLocationCounts(rows);
}

export function getLeadNameById(leads: LeadRowModel[]): Map<string, string> {
  return new Map(leads.map((lead) => [lead.id, lead.name]));
}

export function getSourceOptions(): Array<{ value: 'all' | LeadSource; label: string }> {
  return SOURCE_OPTIONS.map((source) => ({
    value: source,
    label: source === 'all' ? 'All Sources' : sourceLabels[source],
  }));
}

export function getStatusOptions(): Array<{ value: LeadFilterState['status']; label: string }> {
  return [
    { value: 'all', label: 'All Stages' },
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'appointment', label: 'Appointment' },
    { value: 'negotiating', label: 'Negotiating' },
    { value: 'finance', label: 'Finance' },
    { value: 'closed', label: 'Closed' },
  ];
}

export function getBodyStyleOptions(rows: InventoryRowModel[]): Array<'all' | BodyStyle> {
  const set = new Set<BodyStyle>();
  rows.forEach((row) => set.add(row.bodyStyle));
  return ['all', ...Array.from(set)];
}

export function getFuelTypeOptions(rows: InventoryRowModel[]): Array<'all' | FuelType> {
  const set = new Set<FuelType>();
  rows.forEach((row) => set.add(row.fuelType));
  return ['all', ...Array.from(set)];
}

export function getVehicleStatusOptions(rows: InventoryRowModel[]): Array<'all' | VehicleStatus> {
  const set = new Set<VehicleStatus>();
  rows.forEach((row) => set.add(row.status));
  return ['all', ...Array.from(set)];
}

export function nextStage(currentStage: OpportunityStage): OpportunityStage {
  const currentIndex = pipelineStageOrder.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === pipelineStageOrder.length - 1) return currentStage;
  return pipelineStageOrder[currentIndex + 1];
}

export function formatCountLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}

export function formatMinutesLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours}h`;
  return `${hours}h ${remaining}m`;
}
