import { AlertTriangle, CalendarClock, CheckSquare, DollarSign, ArrowRight } from 'lucide-react';
import type { CommandAction, CommandMetric, MorningBrief, RevenueForecast } from '../../../types/commandCenter';

interface TopDealRow {
  id: string;
  customer: string;
  amount: number;
  statusLabel: string;
}

interface CommandCenterContentProps {
  brief: MorningBrief;
  metrics: CommandMetric[];
  todoActions: CommandAction[];
  riskActions: CommandAction[];
  revenue: RevenueForecast;
  topDeals: TopDealRow[];
  onPrimaryAction: () => void;
  onActionClick: (action: CommandAction) => void;
}

const metricIcon = {
  appointments_7d: CalendarClock,
  deals_at_risk: AlertTriangle,
  gross_month: DollarSign,
} as const;

const severityStyles: Record<CommandAction['severity'], string> = {
  critical: 'cc-chip-critical',
  high: 'cc-chip-high',
  medium: 'cc-chip-medium',
  admin: 'cc-chip-admin',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CommandCenterContent({
  brief,
  metrics,
  todoActions,
  riskActions,
  revenue,
  topDeals,
  onPrimaryAction,
  onActionClick,
}: CommandCenterContentProps) {
  return (
    <section className="cc-shell">
      <div className="cc-hero">
        <div className="flex items-center gap-3">
          <div className="cc-icon-box">
            <CheckSquare size={18} />
          </div>
          <div>
            <h1 className="font-sora text-[42px] font-semibold tracking-[-0.02em] text-[#E9EEF8] sm:text-[48px]">
              Today&apos;s Command Center
            </h1>
            <p className="mt-1 text-[15px] text-[#92A2C4]">Built for action speed across leads, deals, and inventory.</p>
          </div>
        </div>

        <div className="cc-morning-card">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="cc-eyebrow">Morning Brief</p>
              <h2 className="mt-1 font-sora text-2xl font-semibold text-[#ECF1FF]">{brief.headline}</h2>
            </div>
            <button type="button" onClick={onPrimaryAction} className="cc-primary-button">
              Do This First
              <ArrowRight size={16} />
            </button>
          </div>

          <ul className="mt-5 space-y-2 text-[15px] text-[#B8C4E0]">
            {brief.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-2">
                <span className="mt-[10px] h-1.5 w-1.5 rounded-full bg-[#4462FF]" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <p className="mt-5 text-sm text-[#7D8FB8]">{brief.footer}</p>
        </div>
      </div>

      <div className="cc-metrics-strip">
        {metrics.map((metric) => {
          const Icon = metricIcon[metric.id];
          return (
            <article key={metric.id} className="cc-metric-card">
              <div className="cc-metric-icon">
                <Icon size={18} />
              </div>
              <p className="cc-eyebrow mt-4">{metric.label}</p>
              <p className="font-sora text-[34px] font-semibold text-[#EAF0FF]">{metric.value}</p>
              <p className="mt-1 text-sm text-[#91A3C8]">{metric.helper}</p>
            </article>
          );
        })}
      </div>

      <div className="cc-grid mt-6">
        <div className="cc-panel">
          <PanelHeader
            title="Today's To-Do"
            subtitle="Ranked by urgency and expected impact."
            countLabel={`${todoActions.length} items`}
          />
          {todoActions.length === 0 ? (
            <EmptyPanel message="No actions right now. You are clear to work proactive outreach." />
          ) : (
            <div className="mt-4 space-y-3">
              {todoActions.map((action) => (
                <ActionCard key={action.id} action={action} onClick={() => onActionClick(action)} />
              ))}
            </div>
          )}
        </div>

        <div className="cc-panel">
          <PanelHeader
            title="Deals Near Close — Needs Attention"
            subtitle="Deals that can slip without immediate action."
            countLabel={`${riskActions.length} deals`}
          />
          {riskActions.length === 0 ? (
            <EmptyPanel message="No critical deal blockers in the close window." />
          ) : (
            <div className="mt-4 space-y-3">
              {riskActions.map((action) => (
                <ActionCard key={action.id} action={action} onClick={() => onActionClick(action)} emphasis="risk" />
              ))}
            </div>
          )}

          <div className="cc-subpanel mt-6">
            <p className="cc-eyebrow">Money Coming In</p>
            <p className="mt-1 text-sm text-[#95A6C9]">Weighted gross from near-term closed and active pipeline stages.</p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FinanceTile label="Next 7 Days" value={formatCurrency(revenue.next7Days)} />
              <FinanceTile label="This Month" value={formatCurrency(revenue.thisMonth)} />
              <FinanceTile label="Next Month" value={formatCurrency(revenue.nextMonth)} />
            </div>
          </div>

          <div className="cc-subpanel mt-4">
            <p className="cc-eyebrow">Top Deals This Month</p>
            <p className="mt-1 text-sm text-[#95A6C9]">Highest expected gross opportunities currently in motion.</p>

            {topDeals.length === 0 ? (
              <p className="mt-4 text-sm text-[#7D8FB8]">No qualifying deals yet.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {topDeals.map((deal) => (
                  <div key={deal.id} className="cc-row">
                    <div>
                      <p className="font-sora text-[17px] font-semibold text-[#EAF0FF]">{deal.customer}</p>
                      <p className="text-sm text-[#98A9CB]">{deal.statusLabel}</p>
                    </div>
                    <p className="font-jet text-[20px] font-bold text-[#EAF0FF]">{formatCurrency(deal.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PanelHeader({ title, subtitle, countLabel }: { title: string; subtitle: string; countLabel: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="font-sora text-[28px] font-semibold text-[#EAF0FF]">{title}</h3>
        <p className="mt-1 text-[15px] text-[#97A8CA]">{subtitle}</p>
      </div>
      <span className="cc-count">{countLabel}</span>
    </div>
  );
}

function ActionCard({
  action,
  onClick,
  emphasis,
}: {
  action: CommandAction;
  onClick: () => void;
  emphasis?: 'risk';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cc-action-card text-left transition ${emphasis === 'risk' ? 'cc-action-risk' : ''}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-sora text-[24px] font-semibold text-[#EDF2FF]">{action.title}</p>
        <span className={`cc-chip ${severityStyles[action.severity]}`}>{action.severity.toUpperCase()}</span>
      </div>
      <p className="mt-1 text-sm text-[#A5B4D3]">{action.subtitle}</p>
      <p className={`mt-2 text-[17px] ${emphasis === 'risk' ? 'text-[#FF5B76]' : 'text-[#9DB2FF]'}`}>{action.reason}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#8396BC]">
          {action.dueLabel} • Impact score: <span className="font-jet text-[#DDE7FF]">{action.impactScore}</span>
        </p>
        <span className="cc-action-link">{action.actionLabel}</span>
      </div>
    </button>
  );
}

function FinanceTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="cc-finance-tile">
      <p className="cc-eyebrow">{label}</p>
      <p className="mt-1 font-jet text-[28px] font-bold text-[#EAF0FF]">{value}</p>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-[#273862] bg-[#0A132B]/80 px-4 py-5 text-sm text-[#8DA0C6]">
      {message}
    </div>
  );
}
