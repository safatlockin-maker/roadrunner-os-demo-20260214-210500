import { useMemo, useState } from 'react';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '../components/layout/Layout';
import { osConsentEvents, osLeads, osOpportunities } from '../data/roadrunnerOSDemo';
import { startFinanceJourney, validateOpportunityStageTransition } from '../services/roadrunnerOS';
import type { OpportunityRecord, OpportunityStage } from '../types/roadrunnerOS';

const stages: OpportunityStage[] = [
  'new',
  'contacted',
  'appointment_set',
  'appointment_showed',
  'negotiating',
  'financing_review',
  'closed_won',
  'closed_lost',
];

const stageLabel: Record<OpportunityStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  appointment_set: 'Appointment Set',
  appointment_showed: 'Appointment Showed',
  negotiating: 'Negotiating',
  financing_review: 'Financing Review',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState<OpportunityRecord[]>(osOpportunities);

  const leadsById = useMemo(() => new Map(osLeads.map((lead) => [lead.id, lead])), []);
  const grouped = useMemo(
    () =>
      stages.reduce<Record<OpportunityStage, OpportunityRecord[]>>(
        (acc, stage) => ({
          ...acc,
          [stage]: opportunities.filter((opportunity) => opportunity.stage === stage),
        }),
        {
          new: [],
          contacted: [],
          appointment_set: [],
          appointment_showed: [],
          negotiating: [],
          financing_review: [],
          closed_won: [],
          closed_lost: [],
        },
      ),
    [opportunities],
  );

  function moveStage(opportunity: OpportunityRecord, nextStage: OpportunityStage) {
    const guard = validateOpportunityStageTransition(opportunity, nextStage, osConsentEvents);
    if (!guard.allowed) {
      toast.error(guard.reasons.join(' '));
      return;
    }

    setOpportunities((current) =>
      current.map((record) =>
        record.id === opportunity.id
          ? {
              ...record,
              stage: nextStage,
              updated_at: new Date().toISOString(),
            }
          : record,
      ),
    );
    toast.success(`Moved ${opportunity.title} to ${stageLabel[nextStage]}.`);
  }

  function toggleChecklist(opportunityId: string, key: keyof OpportunityRecord['checklist']) {
    setOpportunities((current) =>
      current.map((opportunity) =>
        opportunity.id === opportunityId
          ? {
              ...opportunity,
              checklist: {
                ...opportunity.checklist,
                [key]: !opportunity.checklist[key],
              },
            }
          : opportunity,
      ),
    );
  }

  async function handleStartFinance(opportunity: OpportunityRecord) {
    try {
      const result = await startFinanceJourney({ lead_id: opportunity.lead_id, location: opportunity.location });
      toast.success(`Finance journey started (${result.completion_percent}% complete).`);
    } catch (error) {
      toast.error('Could not start finance journey.');
      console.error(error);
    }
  }

  return (
    <Layout variant="command-center" hideTopBar>
      <div className="space-y-5 px-5 pb-8 pt-5 sm:px-6 lg:px-8 xl:px-10">
        <section className="rounded-2xl border border-[#2A3B64] bg-[linear-gradient(180deg,#0F1A37_0%,#0A132A_100%)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#90A5D0]">Pipeline + Deal Room</p>
          <h1 className="mt-1 text-3xl font-semibold text-[#ECF2FF]">Opportunities Board</h1>
          <p className="mt-2 text-sm text-[#9EB0D4]">
            Stage gates enforce quote, docs, and consent checks before higher-risk transitions.
          </p>
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
          {stages.map((stage) => (
            <div key={stage} className="rounded-2xl border border-[#273B63] bg-[#0D172F] p-3">
              <div className="flex items-center justify-between border-b border-[#21345A] pb-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[#B8C8E8]">{stageLabel[stage]}</h2>
                <span className="rounded-full bg-[#1C2E56] px-2 py-1 text-xs text-[#A7BDE8]">{grouped[stage].length}</span>
              </div>
              <div className="mt-3 space-y-3">
                {grouped[stage].length === 0 ? (
                  <p className="rounded-lg border border-[#21355C] bg-[#111C38] px-3 py-2 text-xs text-[#7F99C8]">
                    No opportunities in this stage.
                  </p>
                ) : (
                  grouped[stage].map((opportunity) => {
                    const lead = leadsById.get(opportunity.lead_id);
                    return (
                      <article
                        key={opportunity.id}
                        className="rounded-xl border border-[#2B426F] bg-[linear-gradient(180deg,#142347_0%,#0E1A37_100%)] p-3"
                      >
                        <p className="text-sm font-semibold text-[#EAF0FF]">{opportunity.title}</p>
                        <p className="mt-1 text-xs text-[#96ABD4]">{lead ? `${lead.first_name} ${lead.last_name}` : 'Unknown lead'}</p>
                        <p className="mt-1 text-xs text-[#7E95C2]">
                          ${opportunity.expected_value.toLocaleString()} • {opportunity.location.toUpperCase()}
                        </p>

                        <div className="mt-3 rounded-lg border border-[#284172] bg-[#111C38] px-2 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-[#8FA8D9]">Checklist</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <ChecklistButton
                              active={opportunity.checklist.quote_shared}
                              label="Quote"
                              onClick={() => toggleChecklist(opportunity.id, 'quote_shared')}
                            />
                            <ChecklistButton
                              active={opportunity.checklist.docs_requested}
                              label="Docs"
                              onClick={() => toggleChecklist(opportunity.id, 'docs_requested')}
                            />
                            <ChecklistButton
                              active={opportunity.checklist.consent_verified}
                              label="Consent"
                              onClick={() => toggleChecklist(opportunity.id, 'consent_verified')}
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="mb-1 block text-[11px] uppercase tracking-wide text-[#8FA8D9]">Move stage</label>
                          <div className="flex items-center gap-2">
                            <select
                              value={opportunity.stage}
                              onChange={(event) => moveStage(opportunity, event.target.value as OpportunityStage)}
                              className="w-full rounded-lg border border-[#315085] bg-[#101B36] px-2 py-2 text-xs text-[#E0E8FA]"
                            >
                              {stages.map((option) => (
                                <option key={option} value={option}>
                                  {stageLabel[option]}
                                </option>
                              ))}
                            </select>
                            <ArrowRight size={14} className="text-[#93AAD6]" />
                          </div>
                        </div>

                        <p className="mt-3 text-xs text-[#A0B2D8]">{opportunity.next_action}</p>
                        {['negotiating', 'financing_review'].includes(opportunity.stage) ? (
                          <button
                            type="button"
                            onClick={() => handleStartFinance(opportunity)}
                            className="mt-3 rounded-lg border border-[#5C7FD2] bg-[#2A4BA8] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#3559BE]"
                          >
                            Start Finance Flow
                          </button>
                        ) : null}
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-[#2A3B64] bg-[#0D172F] p-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#38233F] px-3 py-1 text-xs text-[#F5C9FF]">
            <ShieldAlert size={14} />
            Gate rules active for negotiating, financing review, and closed won
          </div>
        </section>
      </div>
    </Layout>
  );
}

function ChecklistButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2 py-1 text-[11px] font-semibold transition ${
        active ? 'border-[#57B68B] bg-[#123625] text-[#B4F2D3]' : 'border-[#3C5D94] bg-[#18274D] text-[#A8BDE6]'
      }`}
    >
      {label}
    </button>
  );
}
