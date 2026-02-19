import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarPlus,
  Clock3,
  Filter,
  Flame,
  HandCoins,
  MessageSquare,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import LocationFilter from './filters/LocationFilter';
import QuickChips from './filters/QuickChips';
import {
  applyLeadFilters,
  buildLeadKpis,
  buildLeadRows,
  DEMO_SNAPSHOT_DATE_LABEL,
  formatMinutesLabel,
  formatRelativeTime,
  getLeadLocationCounts,
  getLeadWaitMinutes,
  getSourceOptions,
  getStatusOptions,
  isLeadSlaRisk,
} from '../../services/demoSectionDerivations';
import type { LeadStatus } from '../../types/lead';
import type { LeadFilterState, LeadQuickChip, LeadRowModel } from '../../types/demoSections';

const leadChipOptions: Array<{ key: LeadQuickChip; label: string }> = [
  { key: 'sla_risk', label: 'SLA Risk' },
  { key: 'high_intent', label: 'High Intent' },
  { key: 'trade_in', label: 'Has Trade-In' },
  { key: 'needs_finance', label: 'Needs Finance' },
];

const sourceOptions = getSourceOptions();
const statusOptions = getStatusOptions();

function statusFilterFromStatus(status: LeadStatus): LeadRowModel['statusFilter'] {
  if (status === 'new') return 'new';
  if (status === 'contacted' || status === 'interested') return 'contacted';
  if (status === 'test_drive') return 'appointment';
  if (status === 'negotiating') return 'negotiating';
  if (status === 'financing_review') return 'finance';
  return 'closed';
}

function statusLabelFromStatus(status: LeadStatus): string {
  if (status === 'new') return 'New';
  if (status === 'contacted') return 'Contacted';
  if (status === 'interested') return 'Interested';
  if (status === 'test_drive') return 'Appointment';
  if (status === 'negotiating') return 'Negotiating';
  if (status === 'financing_review') return 'Financing Review';
  if (status === 'closed_won') return 'Closed Won';
  return 'Closed Lost';
}

function getStatusPillClass(statusFilter: LeadRowModel['statusFilter']): string {
  if (statusFilter === 'new') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (statusFilter === 'contacted') return 'border-indigo-200 bg-indigo-50 text-indigo-700';
  if (statusFilter === 'appointment') return 'border-cyan-200 bg-cyan-50 text-cyan-700';
  if (statusFilter === 'negotiating') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (statusFilter === 'finance') return 'border-purple-200 bg-purple-50 text-purple-700';
  return 'border-gray-200 bg-gray-100 text-gray-700';
}

function getUrgencyPillClass(urgency: LeadRowModel['urgency']): string {
  if (urgency === 'high') return 'bg-red-50 text-red-700';
  if (urgency === 'medium') return 'bg-amber-50 text-amber-700';
  return 'bg-gray-100 text-gray-600';
}

export default function LeadsBoard() {
  const [rows, setRows] = useState<LeadRowModel[]>(() => buildLeadRows());
  const [filters, setFilters] = useState<LeadFilterState>({
    location: 'all',
    source: 'all',
    status: 'all',
    chips: [],
  });
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string>('');

  const locationCounts = useMemo(() => getLeadLocationCounts(rows), [rows]);

  const filteredRows = useMemo(() => applyLeadFilters(rows, filters, new Date()), [rows, filters]);

  const selectedLead = useMemo(() => {
    if (selectedLeadId) {
      const match = rows.find((row) => row.id === selectedLeadId);
      if (match) return match;
    }

    return filteredRows[0] ?? null;
  }, [filteredRows, rows, selectedLeadId]);

  const kpis = useMemo(() => buildLeadKpis(filteredRows, new Date()), [filteredRows]);

  function toggleChip(chip: LeadQuickChip) {
    setFilters((current) => ({
      ...current,
      chips: current.chips.includes(chip)
        ? current.chips.filter((activeChip) => activeChip !== chip)
        : [...current.chips, chip],
    }));
  }

  function updateSelectedLead(action: 'sms' | 'call' | 'appointment' | 'pipeline') {
    if (!selectedLead) return;

    const nowIso = new Date().toISOString();
    const leadName = selectedLead.name;

    setRows((current) =>
      current.map((row) => {
        if (row.id !== selectedLead.id) return row;

        const firstContactAt = row.firstContactAt ?? nowIso;
        let nextStatus: LeadStatus = row.status;
        let nextAction = row.nextAction;
        let timelineLabel = 'Rep note';
        let timelineDetail = '';
        let timelineType: LeadRowModel['timeline'][number]['type'] = 'note';

        if (action === 'sms') {
          nextStatus = row.status === 'new' ? 'contacted' : row.status;
          nextAction = 'Wait for reply, then lock appointment time';
          timelineLabel = 'SMS sent';
          timelineDetail = 'Shared two matching units and asked for preferred visit time.';
          timelineType = 'sms';
        }

        if (action === 'call') {
          nextStatus = row.status === 'new' ? 'contacted' : row.status;
          nextAction = 'Send recap text with next-step options';
          timelineLabel = 'Call placed';
          timelineDetail = 'Discussed budget and trade-in condition; requested callback window.';
          timelineType = 'call';
        }

        if (action === 'appointment') {
          nextStatus = row.statusFilter === 'closed' ? row.status : 'test_drive';
          nextAction = 'Confirm T-24h reminder and reserve unit';
          timelineLabel = 'Appointment booked';
          timelineDetail = 'Tentatively booked a test drive and shared check-in instructions.';
          timelineType = 'note';
        }

        if (action === 'pipeline') {
          nextStatus = row.status === 'new' ? 'contacted' : row.status;
          nextAction = 'Move into negotiation after quote review';
          timelineLabel = 'Pipeline update';
          timelineDetail = 'Lead marked ready for active pipeline management.';
          timelineType = 'note';
        }

        const updatedTimeline = [
          {
            id: `${row.id}-timeline-${Date.now()}`,
            type: timelineType,
            direction: 'outbound' as const,
            label: timelineLabel,
            detail: timelineDetail,
            timestamp: nowIso,
          },
          ...row.timeline,
        ]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 6);

        return {
          ...row,
          status: nextStatus,
          statusLabel: statusLabelFromStatus(nextStatus),
          statusFilter: statusFilterFromStatus(nextStatus),
          firstContactAt,
          lastActivityAt: nowIso,
          nextAction,
          timeline: updatedTimeline,
        };
      }),
    );

    const actionLabel =
      action === 'sms'
        ? 'SMS sent'
        : action === 'call'
          ? 'Call logged'
          : action === 'appointment'
            ? 'Appointment staged'
            : 'Pipeline updated';

    setActionNotice(`${actionLabel} for ${leadName}.`);
    toast.success(`${actionLabel} for ${leadName}.`);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Leads</h1>
            <p className="mt-1 text-sm text-gray-500">Data as of {DEMO_SNAPSHOT_DATE_LABEL}. Local demo actions only.</p>
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-2 md:w-auto md:grid-cols-4">
            <KpiTile label="Total active" value={kpis.totalActive.toString()} helper="Open opportunities" />
            <KpiTile label="SLA > 5 min" value={kpis.slaBreaches.toString()} helper="Needs first response" danger={kpis.slaBreaches > 0} />
            <KpiTile label="Hot leads" value={kpis.hotLeads.toString()} helper="Score 80+" />
            <KpiTile label="Contacted today" value={kpis.contactedToday.toString()} helper="First touch logged" />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <LocationFilter
              value={filters.location}
              onChange={(value) => setFilters((current) => ({ ...current, location: value }))}
              counts={locationCounts}
            />

            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
              <Filter size={14} />
              Source
              <select
                value={filters.source}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    source: event.target.value as LeadFilterState['source'],
                  }))
                }
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800"
              >
                {sourceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
              Stage
              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    status: event.target.value as LeadFilterState['status'],
                  }))
                }
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <QuickChips options={leadChipOptions} active={filters.chips} onToggle={toggleChip} title="Quick Filters" />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Stage</th>
                  <th className="px-3 py-2">Wait Time</th>
                  <th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2">Last Activity</th>
                  <th className="px-3 py-2">Next Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-8 text-center text-sm text-gray-500">
                      No leads match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const now = new Date();
                    const waitMinutes = getLeadWaitMinutes(row, now);
                    const slaRisk = isLeadSlaRisk(row, now);
                    const selected = row.id === selectedLead?.id;

                    return (
                      <tr
                        key={row.id}
                        className={`cursor-pointer border-b border-gray-100 align-top transition hover:bg-gray-50 ${
                          selected ? 'bg-red-50/40' : ''
                        }`}
                        onClick={() => setSelectedLeadId(row.id)}
                      >
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-1">
                            <p className="font-semibold text-gray-900">{row.name}</p>
                            <div className="flex flex-wrap items-center gap-1">
                              <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${getUrgencyPillClass(row.urgency)}`}>
                                {row.urgency}
                              </span>
                              {slaRisk ? (
                                <span className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-700">
                                  <AlertTriangle size={11} />
                                  SLA
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-gray-700">{row.phone}</td>
                        <td className="px-3 py-2 text-gray-700">{row.sourceLabel}</td>
                        <td className="px-3 py-2 text-gray-700">{row.location.toUpperCase()}</td>
                        <td className="px-3 py-2">
                          <span className={`font-semibold ${row.leadScore >= 80 ? 'text-red-600' : 'text-gray-800'}`}>
                            {row.leadScore}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getStatusPillClass(row.statusFilter)}`}>
                            {row.statusLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`${slaRisk ? 'font-semibold text-red-700' : 'text-gray-700'}`}>
                            {formatMinutesLabel(waitMinutes)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-700">{row.owner}</td>
                        <td className="px-3 py-2 text-gray-700">{formatRelativeTime(row.lastActivityAt, now)}</td>
                        <td className="px-3 py-2 text-gray-700">{row.nextAction}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          {selectedLead ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedLead.name}</h2>
                <p className="text-sm text-gray-600">{selectedLead.phone}</p>
                {selectedLead.email ? <p className="text-sm text-gray-600">{selectedLead.email}</p> : null}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <DetailField label="Location" value={selectedLead.location.toUpperCase()} />
                <DetailField label="Owner" value={selectedLead.owner} />
                <DetailField label="Score" value={selectedLead.leadScore.toString()} />
                <DetailField label="Trade-In" value={selectedLead.hasTradeIn ? 'Yes' : 'No'} />
                <DetailField
                  label="Budget"
                  value={`$${(selectedLead.budgetMin ?? 0).toLocaleString()} - $${(selectedLead.budgetMax ?? 0).toLocaleString()}`}
                />
                <DetailField label="Stage" value={selectedLead.statusLabel} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Vehicle Intent</p>
                <p className="mt-1 text-sm text-gray-700">{selectedLead.vehicleInterest}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Latest Timeline</p>
                <div className="mt-2 space-y-2">
                  {selectedLead.timeline.slice(0, 3).map((event) => (
                    <article key={event.id} className="rounded-md border border-gray-200 bg-gray-50 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-gray-700">
                          {event.label} • {event.type.toUpperCase()}
                        </p>
                        <p className="text-[11px] text-gray-500">{formatRelativeTime(event.timestamp)}</p>
                      </div>
                      <p className="mt-1 text-sm text-gray-700">{event.detail}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <ActionButton icon={<MessageSquare size={14} />} label="Send SMS" onClick={() => updateSelectedLead('sms')} />
                <ActionButton icon={<Phone size={14} />} label="Call" onClick={() => updateSelectedLead('call')} />
                <ActionButton icon={<CalendarPlus size={14} />} label="Book Appointment" onClick={() => updateSelectedLead('appointment')} />
                <ActionButton icon={<ArrowRight size={14} />} label="Move to Pipeline" onClick={() => updateSelectedLead('pipeline')} />
              </div>

              {actionNotice ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {actionNotice}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-8 text-center text-sm text-gray-500">
              Select a lead to view details.
            </div>
          )}
        </aside>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-3">
          <ImpactBadge icon={<Clock3 size={14} />} text="Prioritize uncontacted leads over 5 minutes to prevent deal decay." />
          <ImpactBadge icon={<Flame size={14} />} text="High-intent leads are ranked first so reps can act where close probability is highest." />
          <ImpactBadge icon={<HandCoins size={14} />} text="Finance-flagged leads stay visible to keep funding blockers from stalling deals." />
        </div>
      </section>
    </div>
  );
}

function KpiTile({ label, value, helper, danger = false }: { label: string; value: string; helper: string; danger?: boolean }) {
  return (
    <article className={`rounded-lg border px-3 py-2 ${danger ? 'border-red-200 bg-red-50/40' : 'border-gray-200 bg-gray-50'}`}>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${danger ? 'text-red-700' : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-500">{helper}</p>
    </article>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 px-2 py-2">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

function ActionButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-2 text-xs font-semibold text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
    >
      {icon}
      {label}
    </button>
  );
}

function ImpactBadge({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="inline-flex items-start gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
      <span className="mt-0.5 text-gray-600">{icon}</span>
      <p>{text}</p>
    </div>
  );
}
