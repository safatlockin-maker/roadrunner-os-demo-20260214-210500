import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { BellRing, Search, Send, Tag, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import LocationFilter from './filters/LocationFilter';
import QuickChips from './filters/QuickChips';
import {
  applyInventoryFilters,
  buildInventoryKpis,
  buildInventoryRows,
  buildLeadRows,
  DEMO_SNAPSHOT_DATE_LABEL,
  formatCountLabel,
  formatCurrency,
  getBodyStyleOptions,
  getFuelTypeOptions,
  getInventoryLocationCounts,
  getLeadNameById,
  getVehicleStatusOptions,
} from '../../services/demoSectionDerivations';
import type { InventoryFilterState, InventoryQuickChip, InventoryRowModel } from '../../types/demoSections';

const inventoryChipOptions: Array<{ key: InventoryQuickChip; label: string }> = [
  { key: 'aging_risk', label: 'Aging Risk' },
  { key: 'high_demand', label: 'High Demand' },
  { key: 'luxury', label: 'Luxury' },
  { key: 'budget', label: 'Budget' },
];

export default function InventoryBoard() {
  const leads = useMemo(() => buildLeadRows(), []);
  const leadNameMap = useMemo(() => getLeadNameById(leads), [leads]);

  const [rows, setRows] = useState<InventoryRowModel[]>(() => buildInventoryRows(leads));
  const [filters, setFilters] = useState<InventoryFilterState>({
    location: 'all',
    bodyStyle: 'all',
    fuelType: 'all',
    status: 'all',
    search: '',
    chips: [],
  });
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [activityNotice, setActivityNotice] = useState<string>('');

  const locationCounts = useMemo(() => getInventoryLocationCounts(rows), [rows]);
  const filteredRows = useMemo(() => applyInventoryFilters(rows, filters), [rows, filters]);
  const kpis = useMemo(() => buildInventoryKpis(filteredRows), [filteredRows]);

  const bodyStyleOptions = useMemo(() => getBodyStyleOptions(rows), [rows]);
  const fuelTypeOptions = useMemo(() => getFuelTypeOptions(rows), [rows]);
  const statusOptions = useMemo(() => getVehicleStatusOptions(rows), [rows]);

  const selectedVehicle = useMemo(() => {
    if (selectedVehicleId) {
      const row = rows.find((item) => item.id === selectedVehicleId);
      if (row) return row;
    }

    return filteredRows[0] ?? null;
  }, [filteredRows, rows, selectedVehicleId]);

  function toggleChip(chip: InventoryQuickChip) {
    setFilters((current) => ({
      ...current,
      chips: current.chips.includes(chip)
        ? current.chips.filter((existing) => existing !== chip)
        : [...current.chips, chip],
    }));
  }

  function handleNotify(vehicle: InventoryRowModel) {
    const message =
      vehicle.matchingLeadIds.length > 0
        ? `Queued outreach to ${vehicle.matchingLeadIds.length} matching leads for ${vehicle.label}.`
        : `No direct matches found for ${vehicle.label}; suggest broader alternatives.`;

    setActivityNotice(message);
    toast.success(message);
  }

  function handleMarkSold(vehicle: InventoryRowModel) {
    setRows((current) =>
      current.map((row) =>
        row.id === vehicle.id
          ? {
              ...row,
              status: 'sold',
            }
          : row,
      ),
    );

    const message =
      vehicle.alternativeBlastCount > 0
        ? `${vehicle.label} marked sold. Auto-alternative campaign would target ${vehicle.alternativeBlastCount} leads.`
        : `${vehicle.label} marked sold.`;

    setActivityNotice(message);
    toast.success(message);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vehicle Inventory</h1>
            <p className="mt-1 text-sm text-gray-500">Data as of {DEMO_SNAPSHOT_DATE_LABEL}. Actions run in local demo state.</p>
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-2 md:w-auto md:grid-cols-4">
            <KpiTile label="Total units" value={kpis.totalUnits.toString()} helper="Filtered inventory" />
            <KpiTile label="Aging units" value={kpis.agingUnits.toString()} helper=">= 30 days in stock" />
            <KpiTile label="High demand" value={kpis.highDemandUnits.toString()} helper="Inquiry-driven hot units" />
            <KpiTile label="Avg list price" value={formatCurrency(kpis.averageListPrice)} helper="Current filter average" />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <LocationFilter value={filters.location} onChange={(value) => setFilters((current) => ({ ...current, location: value }))} counts={locationCounts} />

            <label className="text-sm text-gray-600">
              Body style
              <select
                value={filters.bodyStyle}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    bodyStyle: event.target.value as InventoryFilterState['bodyStyle'],
                  }))
                }
                className="ml-2 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800"
              >
                {bodyStyleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All body styles' : option.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-gray-600">
              Fuel
              <select
                value={filters.fuelType}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    fuelType: event.target.value as InventoryFilterState['fuelType'],
                  }))
                }
                className="ml-2 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800"
              >
                {fuelTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All fuel types' : option.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-gray-600">
              Status
              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    status: event.target.value as InventoryFilterState['status'],
                  }))
                }
                className="ml-2 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All statuses' : option}
                  </option>
                ))}
              </select>
            </label>

            <label className="relative ml-auto block min-w-[220px]">
              <Search size={14} className="pointer-events-none absolute left-2 top-2.5 text-gray-400" />
              <input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Search year, make, model"
                className="w-full rounded-md border border-gray-300 py-2 pl-7 pr-2 text-sm text-gray-800"
              />
            </label>
          </div>

          <QuickChips options={inventoryChipOptions} active={filters.chips} onToggle={toggleChip} title="Quick Filters" />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2">Vehicle</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Mileage</th>
                  <th className="px-3 py-2">Body/Fuel</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">Days</th>
                  <th className="px-3 py-2">Inquiries</th>
                  <th className="px-3 py-2">Badges</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-gray-500">
                      No inventory matches the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-b border-gray-100 transition hover:bg-gray-50 ${selectedVehicle?.id === row.id ? 'bg-red-50/40' : ''}`}
                      onClick={() => setSelectedVehicleId(row.id)}
                    >
                      <td className="px-3 py-2 font-medium text-gray-900">{row.label}</td>
                      <td className="px-3 py-2 text-gray-700">{formatCurrency(row.listPrice)}</td>
                      <td className="px-3 py-2 text-gray-700">{row.mileage.toLocaleString()}</td>
                      <td className="px-3 py-2 text-gray-700">
                        {row.bodyStyle.toUpperCase()} / {row.fuelType.replace('_', ' ')}
                      </td>
                      <td className="px-3 py-2 text-gray-700">{row.location.toUpperCase()}</td>
                      <td className="px-3 py-2 text-gray-700">{row.daysInInventory}</td>
                      <td className="px-3 py-2 text-gray-700">{row.inquiryCount}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {row.isHot ? <Badge text="Hot" className="border-emerald-200 bg-emerald-50 text-emerald-700" /> : null}
                          {row.isAging ? <Badge text="Aging" className="border-amber-200 bg-amber-50 text-amber-700" /> : null}
                          {row.isPriceDropCandidate ? (
                            <Badge text="Price Drop" className="border-purple-200 bg-purple-50 text-purple-700" />
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedVehicleId(row.id);
                            }}
                            className="rounded border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                          >
                            View Matches
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleNotify(row);
                            }}
                            className="rounded border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                          >
                            Notify Leads
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleMarkSold(row);
                            }}
                            className="rounded border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                          >
                            Mark Sold
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          {selectedVehicle ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Sales Impact Panel</h2>
                <p className="mt-1 text-sm text-gray-600">{selectedVehicle.label}</p>
              </div>

              <div className="grid gap-2 text-sm">
                <ImpactRow icon={<TrendingUp size={14} />} label="Matching open leads" value={selectedVehicle.matchingLeadIds.length.toString()} />
                <ImpactRow
                  icon={<Send size={14} />}
                  label="Alt-outreach if sold"
                  value={formatCountLabel(selectedVehicle.alternativeBlastCount, 'lead')}
                />
                <ImpactRow icon={<Tag size={14} />} label="Current list price" value={formatCurrency(selectedVehicle.listPrice)} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Matched lead list</p>
                <div className="mt-2 space-y-1">
                  {selectedVehicle.matchingLeadIds.length === 0 ? (
                    <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-2 py-3 text-sm text-gray-500">
                      No direct lead matches in current demand set.
                    </p>
                  ) : (
                    selectedVehicle.matchingLeadIds.slice(0, 6).map((leadId) => (
                      <p key={leadId} className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm text-gray-700">
                        {leadNameMap.get(leadId) ?? leadId}
                      </p>
                    ))
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleNotify(selectedVehicle)}
                className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                <BellRing size={14} />
                Trigger alternative outreach simulation
              </button>

              {activityNotice ? (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{activityNotice}</p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-8 text-center text-sm text-gray-500">
              Select a vehicle to view matching lead impact.
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function KpiTile({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{helper}</p>
    </article>
  );
}

function Badge({ text, className }: { text: string; className: string }) {
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${className}`}>{text}</span>;
}

function ImpactRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-2 py-2">
      <span className="inline-flex items-center gap-1 text-gray-600">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}
