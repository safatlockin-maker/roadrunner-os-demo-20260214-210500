import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, GaugeCircle, TrendingUp } from 'lucide-react';
import Layout from '../components/layout/Layout';
import {
  osAppointments,
  osFinanceApplications,
  osLeads,
  osOpportunities,
} from '../data/roadrunnerOSDemo';
import { websiteIntelligence } from '../data/websiteIntelligence';
import {
  buildFinanceReadinessScores,
  buildLeadIntentScores,
  buildOperationalKpis,
} from '../services/roadrunnerOS';

interface KpiTarget {
  key: string;
  label: string;
  value: string;
  target: string;
  met: boolean;
}

export default function Reports() {
  const kpis = useMemo(() => buildOperationalKpis(osLeads, osOpportunities, osAppointments, osFinanceApplications), []);
  const intentScores = useMemo(() => buildLeadIntentScores(osLeads), []);
  const financeScores = useMemo(() => buildFinanceReadinessScores(osFinanceApplications), []);

  const targetRows = useMemo<KpiTarget[]>(
    () => [
      {
        key: 'response',
        label: 'Time to first response',
        value: `${kpis.time_to_first_response_minutes} min`,
        target: '<= 5 min',
        met: kpis.time_to_first_response_minutes <= 5,
      },
      {
        key: 'contact-rate',
        label: 'Contact rate',
        value: `${kpis.contact_rate_percent}%`,
        target: '>= 20% lift baseline',
        met: kpis.contact_rate_percent >= 70,
      },
      {
        key: 'appointment-rate',
        label: 'Appointment set rate',
        value: `${kpis.appointment_set_rate_percent}%`,
        target: '>= 15% lift baseline',
        met: kpis.appointment_set_rate_percent >= 35,
      },
      {
        key: 'show-rate',
        label: 'Show rate',
        value: `${kpis.show_rate_percent}%`,
        target: '>= 10% no-show reduction',
        met: kpis.show_rate_percent >= 65,
      },
      {
        key: 'sold-rate',
        label: 'Sold rate',
        value: `${kpis.sold_rate_percent}%`,
        target: 'Monthly growth trend',
        met: kpis.sold_rate_percent >= 10,
      },
      {
        key: 'finance',
        label: 'Finance completion',
        value: `${kpis.finance_completion_percent}%`,
        target: '>= 15% lift baseline',
        met: kpis.finance_completion_percent >= 60,
      },
    ],
    [kpis],
  );

  return (
    <Layout variant="command-center" hideTopBar>
      <div className="space-y-5 px-5 pb-8 pt-5 sm:px-6 lg:px-8 xl:px-10">
        <section className="rounded-2xl border border-[#2A3B64] bg-[linear-gradient(180deg,#0F1A37_0%,#0A132A_100%)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#90A5D0]">Roadrunner OS Reports</p>
          <h1 className="mt-1 text-3xl font-semibold text-[#ECF2FF]">Operational KPI Dashboard</h1>
          <p className="mt-2 text-sm text-[#9EB0D4]">
            Conversion, speed-to-lead, appointment performance, and finance readiness in one operating view.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="Response Time" value={`${kpis.time_to_first_response_minutes} min`} helper="Median to first contact" />
          <KpiCard title="Contact Rate" value={`${kpis.contact_rate_percent}%`} helper="Leads with first contact logged" />
          <KpiCard title="Show Rate" value={`${kpis.show_rate_percent}%`} helper="Showed / showed + no-show" />
          <KpiCard title="Avg Days to Close" value={`${kpis.avg_days_to_close}`} helper="Closed-won lifecycle average" />
        </section>

        <section className="rounded-2xl border border-[#273B63] bg-[#0D172F] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#90A5D0]">
            Live Website Snapshot ({websiteIntelligence.snapshotDate})
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[#ECF2FF]">Roadrunner Public Site Intelligence</h2>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <article className="rounded-xl border border-[#2A406A] bg-[#111C38] p-3">
              <p className="text-sm font-semibold text-[#EAF0FF]">Wayne Inventory Pulse</p>
              <p className="mt-1 text-xs text-[#9AB0D9]">
                Observed {websiteIntelligence.inventoryHighlights.wayne.listingCountObserved}+ listings.
              </p>
              <ul className="mt-2 space-y-1 text-xs text-[#C9D7F4]">
                {websiteIntelligence.inventoryHighlights.wayne.topBodyStyles.map((style) => (
                  <li key={`wayne-${style.bodyStyle}`}>
                    {style.bodyStyle}: {style.count}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-xl border border-[#2A406A] bg-[#111C38] p-3">
              <p className="text-sm font-semibold text-[#EAF0FF]">Taylor Inventory Pulse</p>
              <p className="mt-1 text-xs text-[#9AB0D9]">
                Observed {websiteIntelligence.inventoryHighlights.taylor.listingCountObserved}+ listings.
              </p>
              <ul className="mt-2 space-y-1 text-xs text-[#C9D7F4]">
                {websiteIntelligence.inventoryHighlights.taylor.topBodyStyles.map((style) => (
                  <li key={`taylor-${style.bodyStyle}`}>
                    {style.bodyStyle}: {style.count}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-2xl border border-[#273B63] bg-[#0D172F] p-4">
            <h2 className="text-lg font-semibold text-[#EAF0FF]">Business Acceptance Targets</h2>
            <div className="mt-3 space-y-3">
              {targetRows.map((row) => (
                <article
                  key={row.key}
                  className="rounded-xl border border-[#2B426F] bg-[linear-gradient(180deg,#142347_0%,#0E1A37_100%)] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#EAF0FF]">{row.label}</p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] uppercase ${
                        row.met
                          ? 'border-[#4B9A7B] bg-[#1B4537] text-[#C1F1DD]'
                          : 'border-[#8E6B6B] bg-[#3D2626] text-[#E9CACA]'
                      }`}
                    >
                      <CheckCircle2 size={11} />
                      {row.met ? 'on track' : 'at risk'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#DDE7FA]">
                    {row.value} <span className="text-[#8CA4D2]">target {row.target}</span>
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <ScorePanel
              title="Lead Intent Scores"
              icon={<TrendingUp size={16} />}
              rows={intentScores.map((score) => ({
                key: score.lead_id,
                label: score.lead_id,
                value: `${score.score}`,
              }))}
            />
            <ScorePanel
              title="Finance Readiness"
              icon={<GaugeCircle size={16} />}
              rows={financeScores.map((score) => ({
                key: score.lead_id,
                label: score.lead_id,
                value: `${score.score}%`,
              }))}
            />
          </div>
        </section>
      </div>
    </Layout>
  );
}

function KpiCard({ title, value, helper }: { title: string; value: string; helper: string }) {
  return (
    <article className="rounded-2xl border border-[#283C63] bg-[linear-gradient(180deg,#121F42_0%,#0C1732_100%)] p-4">
      <p className="text-xs uppercase tracking-[0.08em] text-[#8EA5D3]">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-[#EAF0FF]">{value}</p>
      <p className="mt-1 text-sm text-[#9BB0D8]">{helper}</p>
    </article>
  );
}

function ScorePanel({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: ReactNode;
  rows: Array<{ key: string; label: string; value: string }>;
}) {
  return (
    <article className="rounded-2xl border border-[#273B63] bg-[#0D172F] p-4">
      <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#EAF0FF]">
        {icon}
        {title}
      </div>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between rounded-lg border border-[#2A3F69] bg-[#111C38] px-3 py-2">
            <span className="text-xs text-[#8EA5D3]">{row.label}</span>
            <span className="text-sm font-semibold text-[#EAF0FF]">{row.value}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
