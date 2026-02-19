import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRightLeft, MoveRight } from 'lucide-react';
import { toast } from 'sonner';
import LocationFilter from './filters/LocationFilter';
import {
  buildLeadRows,
  buildPipelineCards,
  buildPipelineMetrics,
  DEMO_SNAPSHOT_DATE_LABEL,
  evaluatePipelineStageTransition,
  formatCurrency,
  formatPercent,
  getLeadLocationCounts,
  isPipelineCardAtRisk,
  nextStage,
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGE_ORDER,
} from '../../services/demoSectionDerivations';
import type { DemoLocationFilter, PipelineCardModel, StageChecklistModel } from '../../types/demoSections';
import type { OpportunityStage } from '../../types/roadrunnerOS';

export default function PipelineBoard() {
  const [cards, setCards] = useState<PipelineCardModel[]>(() => buildPipelineCards(buildLeadRows()));
  const [location, setLocation] = useState<DemoLocationFilter>('all');
  const [dragCardId, setDragCardId] = useState<string | null>(null);
  const [blockedReasonByCard, setBlockedReasonByCard] = useState<Record<string, string>>({});

  const locationCounts = useMemo(() => {
    const leadLike = cards.map((card) => ({ location: card.location }));
    return getLeadLocationCounts(leadLike);
  }, [cards]);

  const visibleCards = useMemo(
    () => cards.filter((card) => (location === 'all' ? true : card.location === location)),
    [cards, location],
  );

  const groupedCards = useMemo(() => {
    const grouped: Record<OpportunityStage, PipelineCardModel[]> = {
      new: [],
      contacted: [],
      appointment_set: [],
      appointment_showed: [],
      negotiating: [],
      financing_review: [],
      closed_won: [],
      closed_lost: [],
    };

    visibleCards.forEach((card) => {
      grouped[card.stage].push(card);
    });

    return grouped;
  }, [visibleCards]);

  const metrics = useMemo(() => buildPipelineMetrics(visibleCards, undefined, new Date()), [visibleCards]);

  function toggleChecklist(cardId: string, key: keyof StageChecklistModel) {
    setCards((current) =>
      current.map((card) =>
        card.id === cardId
          ? {
              ...card,
              checklist: {
                ...card.checklist,
                [key]: !card.checklist[key],
              },
              updatedAt: new Date().toISOString(),
            }
          : card,
      ),
    );
  }

  function moveCard(cardId: string, destinationStage: OpportunityStage) {
    const currentCard = cards.find((card) => card.id === cardId);
    if (!currentCard) return;
    if (currentCard.stage === destinationStage) return;

    const guard = evaluatePipelineStageTransition(currentCard, destinationStage);
    if (!guard.allowed) {
      const reason = guard.reasons.join(' ');
      setBlockedReasonByCard((current) => ({
        ...current,
        [cardId]: reason,
      }));
      toast.error(reason);
      return;
    }

    setCards((current) =>
      current.map((card) =>
        card.id === cardId
          ? {
              ...card,
              stage: destinationStage,
              stageAgeDays: 0,
              updatedAt: new Date().toISOString(),
            }
          : card,
      ),
    );

    setBlockedReasonByCard((current) => {
      const clone = { ...current };
      delete clone[cardId];
      return clone;
    });

    toast.success(`Moved ${currentCard.leadName} to ${PIPELINE_STAGE_LABELS[destinationStage]}.`);
  }

  function handleDrop(destinationStage: OpportunityStage) {
    if (!dragCardId) return;
    moveCard(dragCardId, destinationStage);
    setDragCardId(null);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline</h1>
            <p className="mt-1 text-sm text-gray-500">Data as of {DEMO_SNAPSHOT_DATE_LABEL}. Drag cards between stages.</p>
          </div>

          <div className="grid w-full gap-2 sm:grid-cols-2 md:w-auto md:grid-cols-4">
            <MetricTile
              label="Open pipeline value"
              value={formatCurrency(metrics.openPipelineValue)}
              helper="Open-stage expected value"
            />
            <MetricTile
              label="Contact -> Appointment"
              value={formatPercent(metrics.contactedToAppointmentRate)}
              helper="Stage conversion"
            />
            <MetricTile
              label="Appointment show rate"
              value={formatPercent(metrics.appointmentShowRate)}
              helper="Showed vs no-show"
            />
            <MetricTile
              label="Closed won (month)"
              value={metrics.closedWonThisMonth.toString()}
              helper="Demo month count"
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <LocationFilter value={location} onChange={setLocation} counts={locationCounts} />
          <p className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600">
            <ArrowRightLeft size={13} />
            Stage gates active for negotiating, financing review, and closed won
          </p>
        </div>
      </section>

      <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid min-w-[1280px] grid-cols-8 gap-3">
          {PIPELINE_STAGE_ORDER.map((stage) => (
            <div
              key={stage}
              className="rounded-lg border border-gray-200 bg-gray-50 p-2"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(stage)}
            >
              <div className="mb-2 flex items-center justify-between border-b border-gray-200 pb-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-600">{PIPELINE_STAGE_LABELS[stage]}</h2>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                  {groupedCards[stage].length}
                </span>
              </div>

              <div className="space-y-2">
                {groupedCards[stage].length === 0 ? (
                  <div className="rounded-md border border-dashed border-gray-300 bg-white px-2 py-6 text-center text-xs text-gray-400">
                    Drop here
                  </div>
                ) : (
                  groupedCards[stage].map((card) => {
                    const atRisk = isPipelineCardAtRisk(card);
                    return (
                      <article
                        key={card.id}
                        draggable
                        onDragStart={() => setDragCardId(card.id)}
                        className="cursor-move rounded-md border border-gray-200 bg-white p-2 shadow-sm"
                      >
                        <p className="text-sm font-semibold text-gray-900">{card.leadName}</p>
                        <p className="mt-0.5 text-xs text-gray-600">{card.location.toUpperCase()} • {card.owner}</p>
                        <p className="mt-1 text-xs font-semibold text-gray-700">{formatCurrency(card.expectedValue)}</p>

                        <div className="mt-2 flex flex-wrap gap-1">
                          <ChecklistPill
                            label="Quote"
                            active={card.checklist.quote_shared}
                            onClick={() => toggleChecklist(card.id, 'quote_shared')}
                          />
                          <ChecklistPill
                            label="Docs"
                            active={card.checklist.docs_requested}
                            onClick={() => toggleChecklist(card.id, 'docs_requested')}
                          />
                          <ChecklistPill
                            label="Consent"
                            active={card.checklist.consent_verified}
                            onClick={() => toggleChecklist(card.id, 'consent_verified')}
                          />
                        </div>

                        <p className="mt-2 text-xs text-gray-600">{card.nextAction}</p>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => moveCard(card.id, nextStage(card.stage))}
                            className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                          >
                            Advance
                            <MoveRight size={12} />
                          </button>
                          {atRisk ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase text-amber-700">
                              <AlertTriangle size={11} />
                              Aging risk
                            </span>
                          ) : null}
                        </div>

                        {blockedReasonByCard[card.id] ? (
                          <p className="mt-2 rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-700">
                            {blockedReasonByCard[card.id]}
                          </p>
                        ) : null}
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricTile({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{helper}</p>
    </article>
  );
}

function ChecklistPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase transition ${
        active
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
      }`}
    >
      {label}
    </button>
  );
}
