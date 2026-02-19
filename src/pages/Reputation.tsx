import { useMemo, useState } from 'react';
import { Copy, MessageCircleMore, ShieldBan, Sparkles, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '../components/layout/Layout';
import { osLeads, osReviewRequests, osIncomingReviews } from '../data/roadrunnerOSDemo';
import type { IncomingReview } from '../data/roadrunnerOSDemo';
import { requestReputation, sendOutboundReviewInvite } from '../services/roadrunnerOS';
import { generateReviewResponse } from '../services/aiService';
import type { ReviewRequestRecord } from '../types/roadrunnerOS';

export default function Reputation() {
  const [requests, setRequests] = useState<ReviewRequestRecord[]>(osReviewRequests);
  const [sendingLeadId, setSendingLeadId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<IncomingReview[]>(osIncomingReviews);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [activeResponse, setActiveResponse] = useState<{ reviewId: string; text: string } | null>(null);

  const leadsById = useMemo(() => new Map(osLeads.map((lead) => [lead.id, lead])), []);
  const reviewableLeads = useMemo(
    () =>
      osLeads.filter((lead) => lead.status === 'closed_won').filter((lead) => !requests.some((request) => request.lead_id === lead.id)),
    [requests],
  );

  async function handleSendReview(leadId: string) {
    setSendingLeadId(leadId);
    try {
      await sendOutboundReviewInvite({ lead_id: leadId, channel: 'sms' });
      const result = await requestReputation({ lead_id: leadId, channel: 'sms' });
      setRequests((current) => [result, ...current]);
      toast.success('Review invite sent via SMS.');
    } catch {
      toast.error('Failed to send review invite.');
    } finally {
      setSendingLeadId(null);
    }
  }

  async function handleAIRespond(review: IncomingReview) {
    setRespondingId(review.id);
    try {
      const response = await generateReviewResponse(review.body, review.rating, review.reviewer_name);
      setActiveResponse({ reviewId: review.id, text: response });
    } catch {
      toast.error('Could not generate response.');
    } finally {
      setRespondingId(null);
    }
  }

  function handlePostResponse(reviewId: string) {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, responded: true, ai_response: activeResponse?.text } : r,
      ),
    );
    setActiveResponse(null);
    toast.success('Response posted to Google.');
  }

  function handleCopyResponse() {
    if (!activeResponse) return;
    void navigator.clipboard.writeText(activeResponse.text);
    toast.success('Response copied to clipboard.');
  }

  const unrespondedReviews = reviews.filter((r) => !r.responded);
  const respondedReviews = reviews.filter((r) => r.responded);

  return (
    <Layout variant="command-center" hideTopBar>
      <div className="space-y-5 px-5 pb-8 pt-5 sm:px-6 lg:px-8 xl:px-10">
        <section className="rounded-2xl border border-[#2A3B64] bg-[linear-gradient(180deg,#0F1A37_0%,#0A132A_100%)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#90A5D0]">Reputation OS</p>
          <h1 className="mt-1 text-3xl font-semibold text-[#ECF2FF]">Review Management</h1>
          <p className="mt-2 text-sm text-[#9EB0D4]">
            Send review invites, respond to Google &amp; Facebook reviews with AI, and protect your reputation.
          </p>
        </section>

        {/* Incoming Reviews — AI Respond */}
        <section className="rounded-2xl border border-[#273B63] bg-[#0D172F] p-5">
          <div className="flex items-center gap-2">
            <Star size={18} className="text-[#F4D97A]" />
            <h2 className="text-lg font-semibold text-[#EAF0FF]">Incoming Reviews</h2>
            <span className="rounded-full bg-[#2A4BA8] px-2 py-0.5 text-xs font-semibold text-white">
              {unrespondedReviews.length} need response
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {unrespondedReviews.map((review) => (
              <article key={review.id} className="rounded-xl border border-[#2B426F] bg-[linear-gradient(180deg,#142347_0%,#0E1A37_100%)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#EAF0FF]">{review.reviewer_name}</p>
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-[#7B6B2B] bg-[#3D3415] px-2 py-0.5 text-[10px] text-[#F4D97A]">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </span>
                      <span className="text-[10px] text-[#5A7AAF]">{review.source}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-[#C8D9F5]">"{review.body}"</p>
                    <p className="mt-1 text-xs text-[#5A7AAF]">{new Date(review.received_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleAIRespond(review)}
                    disabled={respondingId === review.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#5C7FD2] bg-[#2A4BA8] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#3559BE] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Sparkles size={13} />
                    {respondingId === review.id ? 'ARIA drafting…' : 'AI Respond'}
                  </button>
                </div>
              </article>
            ))}
            {unrespondedReviews.length === 0 && (
              <p className="rounded-xl border border-[#24375C] bg-[#111C38] px-3 py-2 text-sm text-[#8FA6D4]">
                All reviews have been responded to.
              </p>
            )}
          </div>

          {/* Responded reviews */}
          {respondedReviews.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#5A7AAF]">Responded</p>
              <div className="mt-3 space-y-3">
                {respondedReviews.map((review) => (
                  <article key={review.id} className="rounded-xl border border-[#1E3055] bg-[#0A132A] p-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#7B9BD4]">{review.reviewer_name}</p>
                      <span className="text-[10px] text-[#F4D97A]">{'★'.repeat(review.rating)}</span>
                      <span className="rounded-full border border-[#4B9A7B] bg-[#1B4537] px-2 py-0.5 text-[10px] text-[#C1F1DD]">Responded</span>
                    </div>
                    {review.ai_response && (
                      <p className="mt-1.5 text-xs text-[#6A88C0]">↳ {review.ai_response}</p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Review invites */}
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
                  <article key={lead.id} className="rounded-xl border border-[#2B426F] bg-[linear-gradient(180deg,#142347_0%,#0E1A37_100%)] p-3">
                    <p className="text-sm font-semibold text-[#EAF0FF]">
                      {lead.first_name} {lead.last_name}
                    </p>
                    <p className="mt-1 text-xs text-[#8CA4D2]">${lead.budget_max?.toLocaleString() ?? 'N/A'} deal band</p>
                    <button
                      type="button"
                      onClick={() => void handleSendReview(lead.id)}
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
                  <article key={request.id} className="rounded-xl border border-[#2B426F] bg-[linear-gradient(180deg,#142347_0%,#0E1A37_100%)] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#EAF0FF]">
                        {lead ? `${lead.first_name} ${lead.last_name}` : request.lead_id}
                      </p>
                      <RequestStatus status={request.status} />
                    </div>
                    {request.sent_at && (
                      <p className="mt-1 text-xs text-[#8CA4D2]">Sent: {new Date(request.sent_at).toLocaleString()}</p>
                    )}
                    {request.completed_at && (
                      <p className="mt-1 text-xs text-[#8CA4D2]">Completed: {new Date(request.completed_at).toLocaleString()}</p>
                    )}
                    {request.suppression_reason && (
                      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#3D2626] px-2 py-1 text-[11px] text-[#E9CACA]">
                        <ShieldBan size={12} />
                        {request.suppression_reason}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* AI Response Modal */}
      {activeResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#2A3B64] bg-[#0D172F] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#9CB6E8]" />
                <h3 className="text-lg font-semibold text-[#ECF2FF]">ARIA's Review Response</h3>
              </div>
              <button type="button" onClick={() => setActiveResponse(null)} className="text-[#6F87B5] hover:text-[#CFE0FF]">
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-[#2B426F] bg-[#0A132A] px-4 py-4 text-sm text-[#DDE7FA]">
              {activeResponse.text}
            </div>
            <p className="mt-2 flex items-center gap-1 text-[10px] text-[#5A7AAF]">
              <Sparkles size={9} />
              Generated by ARIA • Review before posting
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleCopyResponse}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#3C5C9A] py-2.5 text-sm font-semibold text-[#CFE0FF] transition hover:bg-[#1A2D59]"
              >
                <Copy size={14} />
                Copy
              </button>
              <button
                type="button"
                onClick={() => handlePostResponse(activeResponse.reviewId)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#4B9A7B] bg-[#1B4537] py-2.5 text-sm font-semibold text-[#C1F1DD] transition hover:bg-[#235C45]"
              >
                Post Response
              </button>
            </div>
          </div>
        </div>
      )}
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
