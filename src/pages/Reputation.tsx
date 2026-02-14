import { useMemo, useState } from 'react';
import { MessageCircleMore, ShieldBan, Star } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '../components/layout/Layout';
import { osLeads, osReviewRequests } from '../data/roadrunnerOSDemo';
import { requestReputation } from '../services/roadrunnerOS';
import type { ReviewRequestRecord } from '../types/roadrunnerOS';

export default function Reputation() {
  const [requests, setRequests] = useState<ReviewRequestRecord[]>(osReviewRequests);
  const [sendingLeadId, setSendingLeadId] = useState<string | null>(null);

  const leadsById = useMemo(() => new Map(osLeads.map((lead) => [lead.id, lead])), []);
  const reviewableLeads = useMemo(
    () =>
      osLeads.filter((lead) => lead.status === 'closed_won').filter((lead) => !requests.some((request) => request.lead_id === lead.id)),
    [requests],
  );

  async function handleSendReview(leadId: string) {
    setSendingLeadId(leadId);
    try {
      const result = await requestReputation({ lead_id: leadId, channel: 'sms' });
      setRequests((current) => [result, ...current]);
      toast.success('Review invite sent via SMS.');
    } catch (error) {
      toast.error('Failed to send review invite.');
      console.error(error);
    } finally {
      setSendingLeadId(null);
    }
  }

  return (
    <Layout variant="command-center" hideTopBar>
      <div className="space-y-5 px-5 pb-8 pt-5 sm:px-6 lg:px-8 xl:px-10">
        <section className="rounded-2xl border border-[#2A3B64] bg-[linear-gradient(180deg,#0F1A37_0%,#0A132A_100%)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#90A5D0]">Reputation OS</p>
          <h1 className="mt-1 text-3xl font-semibold text-[#ECF2FF]">Review Request Queue</h1>
          <p className="mt-2 text-sm text-[#9EB0D4]">
            Automate post-sale review invites while suppressing requests for unresolved or lost deals.
          </p>
        </section>

        <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-[#273B63] bg-[#0D172F] p-4">
            <h2 className="text-lg font-semibold text-[#EAF0FF]">Eligible Closed-Won Leads</h2>
            <div className="mt-3 space-y-3">
              {reviewableLeads.length === 0 ? (
                <p className="rounded-xl border border-[#24375C] bg-[#111C38] px-3 py-2 text-sm text-[#8FA6D4]">
                  No pending closed-won leads without a review workflow.
                </p>
              ) : (
                reviewableLeads.map((lead) => (
                  <article
                    key={lead.id}
                    className="rounded-xl border border-[#2B426F] bg-[linear-gradient(180deg,#142347_0%,#0E1A37_100%)] p-3"
                  >
                    <p className="text-sm font-semibold text-[#EAF0FF]">
                      {lead.first_name} {lead.last_name}
                    </p>
                    <p className="mt-1 text-xs text-[#8CA4D2]">${lead.budget_max?.toLocaleString() ?? 'N/A'} deal band</p>
                    <button
                      type="button"
                      onClick={() => handleSendReview(lead.id)}
                      disabled={sendingLeadId === lead.id}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#5C7FD2] bg-[#2A4BA8] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#3559BE] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <MessageCircleMore size={14} />
                      {sendingLeadId === lead.id ? 'Sending…' : 'Send SMS invite'}
                    </button>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#273B63] bg-[#0D172F] p-4">
            <h2 className="text-lg font-semibold text-[#EAF0FF]">Request History</h2>
            <div className="mt-3 space-y-3">
              {requests.map((request) => {
                const lead = leadsById.get(request.lead_id);
                return (
                  <article
                    key={request.id}
                    className="rounded-xl border border-[#2B426F] bg-[linear-gradient(180deg,#142347_0%,#0E1A37_100%)] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#EAF0FF]">
                        {lead ? `${lead.first_name} ${lead.last_name}` : request.lead_id}
                      </p>
                      <RequestStatus status={request.status} />
                    </div>
                    {request.sent_at ? (
                      <p className="mt-1 text-xs text-[#8CA4D2]">Sent: {new Date(request.sent_at).toLocaleString()}</p>
                    ) : null}
                    {request.completed_at ? (
                      <p className="mt-1 text-xs text-[#8CA4D2]">Completed: {new Date(request.completed_at).toLocaleString()}</p>
                    ) : null}
                    {request.suppression_reason ? (
                      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#3D2626] px-2 py-1 text-[11px] text-[#E9CACA]">
                        <ShieldBan size={12} />
                        {request.suppression_reason}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function RequestStatus({ status }: { status: ReviewRequestRecord['status'] }) {
  const styles: Record<ReviewRequestRecord['status'], string> = {
    pending: 'border-[#6B7EA8] bg-[#27395B] text-[#CDDAF5]',
    sent: 'border-[#5D86D1] bg-[#203A72] text-[#C9DBFF]',
    completed: 'border-[#4B9A7B] bg-[#1B4537] text-[#C1F1DD]',
    suppressed: 'border-[#8E6B6B] bg-[#3D2626] text-[#E9CACA]',
    failed: 'border-[#935E8A] bg-[#41223C] text-[#F3C6EC]',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] uppercase ${styles[status]}`}>
      <Star size={11} />
      {status}
    </span>
  );
}
