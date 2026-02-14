import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Layout from '../components/layout/Layout';
import DashboardMetrics from '../components/dashboard/DashboardMetrics';
import LeadInbox from '../components/dashboard/LeadInbox';
import LeadDetailModal from '../components/dashboard/LeadDetailModal';
import CommandUtilityBar from '../components/dashboard/command-center/CommandUtilityBar';
import CommandCenterContent from '../components/dashboard/command-center/CommandCenterContent';
import { demoLeads, demoInventory } from '../data/demoData';
import { osAppointments, osFinanceApplications, osLeads, osOpportunities } from '../data/roadrunnerOSDemo';
import { calculateLeadScore } from '../services/aiService';
import {
  buildCommandActions,
  buildCommandMetrics,
  buildMorningBrief,
  buildRevenueForecast,
} from '../services/commandCenterDerivations';
import { isConvexConfigured } from '../services/roadrunnerConvex';
import { buildOperationalKpis } from '../services/roadrunnerOS';
import type { CommandAction } from '../types/commandCenter';
import type { Lead } from '../types/lead';
import type { Vehicle } from '../types/inventory';

const COMMAND_CENTER_V2 = true;

function trackDashboardEvent(event: string, payload?: Record<string, unknown>): void {
  if (!import.meta.env.DEV) return;
  console.info(`[analytics] ${event}`, payload ?? {});
}

function hydrateLeads(baseNow: Date, inventory: Vehicle[]): Lead[] {
  return demoLeads.map((lead, idx) => {
    const normalizedLead = lead as Lead;
    const createdAt = new Date(baseNow.getTime() - idx * 3600000).toISOString();
    const updatedAt = new Date(baseNow.getTime() - idx * 1800000).toISOString();
    const closedAt =
      normalizedLead.closed_at ??
      (normalizedLead.status === 'closed_won' || normalizedLead.status === 'closed_lost'
        ? new Date(baseNow.getTime() - (idx + 1) * 86400000).toISOString()
        : undefined);

    return {
      ...normalizedLead,
      id: `lead-${idx + 1}`,
      created_at: createdAt,
      updated_at: updatedAt,
      closed_at: closedAt,
      lead_score: calculateLeadScore(normalizedLead, inventory),
    };
  });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [dataAsOf, setDataAsOf] = useState<Date>(() => new Date());
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedAction, setSelectedAction] = useState<CommandAction | null>(null);
  const [firstActionTracked, setFirstActionTracked] = useState(false);

  const inventory = useMemo(() => demoInventory as Vehicle[], []);

  const leads = useMemo<Lead[]>(() => hydrateLeads(dataAsOf, inventory), [dataAsOf, inventory]);

  const actions = useMemo(() => buildCommandActions(leads, inventory, dataAsOf), [leads, inventory, dataAsOf]);
  const metrics = useMemo(() => buildCommandMetrics(leads, inventory, dataAsOf), [leads, inventory, dataAsOf]);
  const revenue = useMemo(() => buildRevenueForecast(leads, dataAsOf), [leads, dataAsOf]);
  const brief = useMemo(() => buildMorningBrief(actions, metrics), [actions, metrics]);
  const operationalKpis = useMemo(
    () => buildOperationalKpis(osLeads, osOpportunities, osAppointments, osFinanceApplications),
    [],
  );

  const actionById = useMemo(() => new Map(actions.map((action) => [action.id, action])), [actions]);
  const leadsById = useMemo(() => new Map(leads.map((lead) => [lead.id, lead])), [leads]);

  const todoActions = useMemo(() => actions.slice(0, 10), [actions]);
  const riskActions = useMemo(
    () => actions.filter((action) => action.actionKind === 'docs' || action.actionKind === 'assignment').slice(0, 3),
    [actions]
  );

  const topDeals = useMemo(() => {
    return leads
      .filter((lead) => ['negotiating', 'financing_review', 'closed_won'].includes(lead.status))
      .map((lead) => ({
        id: lead.id,
        customer: `${lead.first_name} ${lead.last_name}`,
        amount: lead.deal_value ?? lead.budget_max ?? lead.budget_min ?? 0,
        statusLabel: lead.status.replace('_', ' ').toUpperCase(),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [leads]);

  const handleRefresh = useCallback(() => {
    const refreshedAt = new Date();
    setDataAsOf(refreshedAt);
    setFirstActionTracked(false);
    trackDashboardEvent('refresh', { refreshedAt: refreshedAt.toISOString() });
    toast.success('Command center refreshed');
  }, []);

  const handleOpenInventory = useCallback(() => {
    trackDashboardEvent('open_inventory');
    navigate('/inventory');
  }, [navigate]);

  const handleActionClick = useCallback(
    (action: CommandAction) => {
      trackDashboardEvent('cta_click', {
        actionId: action.id,
        actionKind: action.actionKind,
        severity: action.severity,
      });

      if (!firstActionTracked) {
        trackDashboardEvent('time_to_first_action', {
          milliseconds: Date.now() - dataAsOf.getTime(),
        });
        setFirstActionTracked(true);
      }

      if (action.leadId) {
        const lead = leadsById.get(action.leadId);
        if (lead) {
          setSelectedLead(lead);
          setSelectedAction(action);
          return;
        }
      }

      if (action.actionKind === 'status_update') {
        navigate('/inventory');
        return;
      }

      toast.message('No lead context available for this action.');
    },
    [dataAsOf, firstActionTracked, leadsById, navigate]
  );

  const handlePrimaryAction = useCallback(() => {
    const primaryAction = brief.primaryActionId ? actionById.get(brief.primaryActionId) : actions[0];
    if (!primaryAction) {
      toast.message('No actions available right now.');
      return;
    }
    handleActionClick(primaryAction);
  }, [actions, actionById, brief.primaryActionId, handleActionClick]);

  const closeLeadModal = useCallback(() => {
    setSelectedLead(null);
    setSelectedAction(null);
    trackDashboardEvent('action_completed');
  }, []);

  if (!COMMAND_CENTER_V2) {
    return <LegacyDashboard leads={leads} />;
  }

  return (
    <Layout variant="command-center" hideTopBar>
      <div className="px-5 pb-8 pt-5 sm:px-6 lg:px-8 xl:px-10">
        <CommandUtilityBar
          connected={isConvexConfigured()}
          dealCount={leads.filter((lead) => lead.status !== 'closed_lost').length}
          dataAsOf={dataAsOf}
          onOpenInventory={handleOpenInventory}
          onRefresh={handleRefresh}
        />

        <section className="mt-4 rounded-2xl border border-[#274070] bg-[linear-gradient(180deg,#112247_0%,#0D1731_100%)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#8EA5D4]">Command Center v3</p>
          <h2 className="mt-1 font-sora text-2xl font-semibold text-[#EAF0FF]">Operational KPI Stack</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <KpiTile
              label="Time to first response"
              value={`${operationalKpis.time_to_first_response_minutes} min`}
              helper="Target <= 5m"
            />
            <KpiTile label="Contact rate" value={`${operationalKpis.contact_rate_percent}%`} helper="Lead coverage" />
            <KpiTile
              label="Appointment set rate"
              value={`${operationalKpis.appointment_set_rate_percent}%`}
              helper="Leads to appointments"
            />
            <KpiTile label="Show rate" value={`${operationalKpis.show_rate_percent}%`} helper="Booked to showed" />
            <KpiTile label="Sold rate" value={`${operationalKpis.sold_rate_percent}%`} helper="Closed won ratio" />
            <KpiTile
              label="Finance completion"
              value={`${operationalKpis.finance_completion_percent}%`}
              helper="Submitted + approved"
            />
            <KpiTile label="Avg days to close" value={`${operationalKpis.avg_days_to_close}`} helper="Closed-won average" />
          </div>
        </section>

        <CommandCenterContent
          brief={brief}
          metrics={metrics}
          todoActions={todoActions}
          riskActions={riskActions}
          revenue={revenue}
          topDeals={topDeals}
          onPrimaryAction={handlePrimaryAction}
          onActionClick={handleActionClick}
        />
      </div>

      {selectedLead && (
        <LeadDetailModal lead={selectedLead} onClose={closeLeadModal} recommendedAction={selectedAction} />
      )}
    </Layout>
  );
}

function KpiTile({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="rounded-xl border border-[#2E4B80] bg-[linear-gradient(180deg,#15274F_0%,#10203F_100%)] p-3">
      <p className="text-[11px] uppercase tracking-[0.08em] text-[#8FA5D2]">{label}</p>
      <p className="mt-1 font-jet text-2xl font-bold text-[#ECF2FF]">{value}</p>
      <p className="mt-1 text-xs text-[#9FB1D8]">{helper}</p>
    </article>
  );
}

function LegacyDashboard({ leads }: { leads: Lead[] }) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const newLeadsToday = leads.filter((lead) => new Date(lead.created_at) >= todayStart).length;
  const hotLeads = leads.filter((lead) => lead.urgency === 'high' && (lead.lead_score ?? 0) > 80).length;
  const testDrivesToday = leads.filter((lead) => lead.status === 'test_drive').length;

  const closedDealsToday = leads.filter((lead) => lead.status === 'closed_won' && lead.closed_at);
  const revenueToday = closedDealsToday.reduce((sum, lead) => sum + (lead.deal_value ?? 0), 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here&apos;s your sales overview.</p>
        </div>

        <DashboardMetrics
          newLeads={newLeadsToday}
          hotLeads={hotLeads}
          testDrives={testDrivesToday}
          dealsValue={revenueToday}
        />

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Leads</h2>
            <p className="text-sm text-gray-600 mt-1">Your latest inquiries</p>
          </div>
          <LeadInbox leads={leads} />
        </div>
      </div>
    </Layout>
  );
}
