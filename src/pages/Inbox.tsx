import { useMemo, useState } from 'react';
import { Clock3, MessageSquareText, PhoneCall, PhoneMissed } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '../components/layout/Layout';
import { osCallEvents, osConversationThreads, osLeads, osMessageEvents } from '../data/roadrunnerOSDemo';
import { buildSlaAlerts, ingestInboundSms } from '../services/roadrunnerOS';

type TimelineRow = {
  id: string;
  timestamp: string;
  type: 'message' | 'call';
  direction: 'inbound' | 'outbound';
  label: string;
  detail: string;
};

export default function Inbox() {
  const [selectedThreadId, setSelectedThreadId] = useState<string>(osConversationThreads[0]?.id ?? '');
  const [isSimulatingSms, setIsSimulatingSms] = useState(false);

  const leadsById = useMemo(() => new Map(osLeads.map((lead) => [lead.id, lead])), []);
  const alerts = useMemo(() => buildSlaAlerts(osLeads), []);

  const selectedThread = useMemo(
    () => osConversationThreads.find((thread) => thread.id === selectedThreadId) ?? null,
    [selectedThreadId],
  );
  const selectedLead = selectedThread ? leadsById.get(selectedThread.lead_id) ?? null : null;

  const timeline = useMemo<TimelineRow[]>(() => {
    if (!selectedThread) return [];

    const messages = osMessageEvents
      .filter((message) => message.thread_id === selectedThread.id)
      .map((message) => ({
        id: message.id,
        timestamp: message.created_at,
        type: 'message' as const,
        direction: message.direction,
        label: `${message.channel.toUpperCase()} ${message.direction}`,
        detail: message.body,
      }));

    const calls = osCallEvents
      .filter((call) => call.lead_id === selectedThread.lead_id)
      .map((call) => ({
        id: call.id,
        timestamp: call.created_at,
        type: 'call' as const,
        direction: call.direction,
        label: `CALL ${call.direction} • ${call.outcome}`,
        detail: `Duration ${call.duration_seconds}s`,
      }));

    return [...messages, ...calls].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [selectedThread]);

  async function handleSimulateInboundSms() {
    if (!selectedLead?.phone) {
      toast.error('Selected lead is missing a phone number.');
      return;
    }

    setIsSimulatingSms(true);
    try {
      await ingestInboundSms({
        phone: selectedLead.phone,
        body: 'I can come in after work today. Is 6:30 PM open?',
        received_at: new Date().toISOString(),
      });
      toast.success('Inbound SMS captured and workflow trigger simulated.');
    } catch (error) {
      toast.error('Could not simulate inbound SMS event.');
      console.error(error);
    } finally {
      setIsSimulatingSms(false);
    }
  }

  return (
    <Layout variant="command-center" hideTopBar>
      <div className="space-y-5 px-5 pb-8 pt-5 sm:px-6 lg:px-8 xl:px-10">
        <section className="rounded-2xl border border-[#2A3B64] bg-[linear-gradient(180deg,#0F1A37_0%,#0A132A_100%)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#90A5D0]">Inbox SLA Queue</p>
              <h1 className="mt-1 text-3xl font-semibold text-[#ECF2FF]">Omnichannel Inbox</h1>
              <p className="mt-1 text-sm text-[#9EB0D4]">Phone + SMS + web form timeline with 5-minute response SLA.</p>
            </div>
            <button
              type="button"
              onClick={handleSimulateInboundSms}
              disabled={isSimulatingSms}
              className="rounded-xl border border-[#5C7FD2] bg-[#2A4BA8] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3559BE] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSimulatingSms ? 'Simulating…' : 'Simulate Inbound SMS'}
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {alerts.length === 0 ? (
              <div className="rounded-xl border border-[#2D436F] bg-[#101B36] px-4 py-3 text-sm text-[#A6B7DA]">
                No active SLA breaches in business hours.
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.lead_id}
                  className="rounded-xl border border-[#4B3260] bg-[linear-gradient(180deg,#1A1830_0%,#121022_100%)] px-4 py-3"
                >
                  <p className="text-sm font-semibold text-[#F4E8FF]">{alert.lead_name}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-[#D7A8FF]">{alert.severity} priority</p>
                  <p className="mt-2 text-sm text-[#C6CEE6]">{alert.minutes_waiting} minutes waiting</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-[#24355A] bg-[#0D172F] p-3">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#89A1D1]">Threads</p>
            <div className="space-y-2">
              {osConversationThreads.map((thread) => {
                const lead = leadsById.get(thread.lead_id);
                const selected = thread.id === selectedThreadId;
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      selected
                        ? 'border-[#5E84D6] bg-[#1A2B53]'
                        : 'border-[#24375D] bg-[#111D39] hover:border-[#3D5E9E]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#EAF0FF]">
                        {lead?.first_name} {lead?.last_name}
                      </p>
                      {thread.has_unread ? (
                        <span className="rounded-full bg-[#3B63D8] px-2 py-[2px] text-[10px] font-semibold uppercase text-white">
                          unread
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-[#95AAD3]">Rep: {thread.assigned_rep}</p>
                    <p className="mt-1 text-xs text-[#728CB8]">Location: {thread.location.toUpperCase()}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-[#24355A] bg-[#0D172F] p-4">
            <div className="flex items-start justify-between gap-3 border-b border-[#22345A] pb-3">
              <div>
                <p className="text-sm text-[#8DA4D2]">Timeline</p>
                <h2 className="text-2xl font-semibold text-[#ECF2FF]">
                  {selectedLead ? `${selectedLead.first_name} ${selectedLead.last_name}` : 'Select a thread'}
                </h2>
              </div>
              {selectedLead?.phone ? <p className="text-sm text-[#9EB2D8]">{selectedLead.phone}</p> : null}
            </div>

            <div className="mt-4 space-y-3">
              {timeline.length === 0 ? (
                <p className="rounded-xl border border-[#25375F] bg-[#101B36] px-4 py-3 text-sm text-[#99ADD4]">
                  No timeline events available for this conversation yet.
                </p>
              ) : (
                timeline.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-[#2A406D] bg-[linear-gradient(180deg,#132043_0%,#0E1A37_100%)] px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#A6B8DE]">
                        {item.type === 'message' ? <MessageSquareText size={14} /> : <PhoneCall size={14} />}
                        <span>{item.label}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs text-[#8FA6D3]">
                        <Clock3 size={12} />
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[#DFE7FA]">{item.detail}</p>
                    {item.type === 'call' && item.label.includes('missed') ? (
                      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#402347] px-2 py-1 text-[11px] text-[#F6C8FF]">
                        <PhoneMissed size={12} />
                        Missed-call text-back should fire
                      </p>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
