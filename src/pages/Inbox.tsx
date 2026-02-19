import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AtSign,
  CalendarCheck,
  CalendarClock,
  Clock3,
  CreditCard,
  Files,
  Link2,
  MessageSquareText,
  Moon,
  PhoneCall,
  PhoneMissed,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '../components/layout/Layout';
import {
  osCallEvents,
  osConversationThreads,
  osLeads,
  osMessageEvents,
} from '../data/roadrunnerOSDemo';
import {
  bookAppointment,
  buildChannelSlaStates,
  buildSlaAlerts,
  executeWorkflow,
  ingestInboundSms,
  sendOutboundSms,
  sendChatMessage,
  startChatSession,
  summarizeCall,
} from '../services/roadrunnerOS';
import {
  classifyLeadIntent,
  generateAICallSummary,
  generateInboxReply,
} from '../services/aiService';
import type { LeadIntentResult } from '../services/aiService';

// Reps for @mention
const REPS = ['Ali Almo', 'Wayne Sales Desk', 'Taylor Sales Desk'];

// Leads that arrived after-hours (simulated: created at ~11:42 PM)
const AFTER_HOURS_LEAD_IDS = new Set(['lead-os-1']);
const AFTER_HOURS_TIME = '11:42 PM';
const AFTER_HOURS_AI_RESPONSE =
  "Thanks for reaching out! We're closed for the evening but ARIA is here for you. I can see you're interested in the 2020 Honda Accord — we have two great options in stock at Wayne. A rep will call you first thing at 9am. Can you confirm that time works?";

type TimelineRow = {
  id: string;
  timestamp: string;
  type: 'message' | 'call';
  direction: 'inbound' | 'outbound';
  label: string;
  detail: string;
  aiGenerated?: boolean;
  isAfterHoursAuto?: boolean;
  isScheduled?: boolean;
  scheduledFor?: string;
};

// Derive schedule time options (next 3 business slots)
function getScheduleSlots(): string[] {
  const now = new Date();
  const slots: string[] = [];
  const pad = (n: number) => String(n).padStart(2, '0');
  for (let h = 9; h <= 17 && slots.length < 4; h += 2) {
    const d = new Date(now);
    d.setHours(h, 0, 0, 0);
    if (d > now) {
      slots.push(`${pad(d.getMonth() + 1)}/${pad(d.getDate())} at ${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`);
    }
  }
  if (slots.length < 2) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    [9, 11, 14, 16].forEach((h) => {
      if (slots.length < 4) {
        slots.push(`${pad(tomorrow.getMonth() + 1)}/${pad(tomorrow.getDate())} at ${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`);
      }
    });
  }
  return slots;
}

// Intent badge styling
const INTENT_STYLES: Record<string, string> = {
  test_drive: 'border-[#4B7B5C] bg-[#1A3A29] text-[#8FE8B5]',
  pricing: 'border-[#7B6B2B] bg-[#3D3415] text-[#F4D97A]',
  trade_in: 'border-[#4B5E9A] bg-[#1A2549] text-[#9AB8FF]',
  financing: 'border-[#7B4B8A] bg-[#3D1E49] text-[#E8A8FF]',
  general: 'border-[#4A6070] bg-[#1A2A36] text-[#9ECAE8]',
};

export default function Inbox() {
  const [selectedThreadId, setSelectedThreadId] = useState<string>(osConversationThreads[0]?.id ?? '');
  const [isSimulatingSms, setIsSimulatingSms] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [composer, setComposer] = useState('');
  const [localEvents, setLocalEvents] = useState<Record<string, TimelineRow[]>>({});
  const [actionBusy, setActionBusy] = useState<'sms' | 'call' | 'book' | 'docs' | 'payment' | null>(null);
  const [threadIntents, setThreadIntents] = useState<Record<string, LeadIntentResult>>({});
  const [mentionDropdownOpen, setMentionDropdownOpen] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const leadsById = useMemo(() => new Map(osLeads.map((lead) => [lead.id, lead])), []);
  const alerts = useMemo(() => buildSlaAlerts(osLeads), []);
  const slaStates = useMemo(() => buildChannelSlaStates(osConversationThreads, osLeads, new Date()), []);
  const slaByThread = useMemo(() => new Map(slaStates.map((state) => [state.thread_id, state])), [slaStates]);

  const selectedThread = useMemo(
    () => osConversationThreads.find((thread) => thread.id === selectedThreadId) ?? null,
    [selectedThreadId],
  );
  const selectedLead = selectedThread ? leadsById.get(selectedThread.lead_id) ?? null : null;
  const isAfterHoursLead = selectedLead ? AFTER_HOURS_LEAD_IDS.has(selectedLead.id) : false;

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
        aiGenerated: message.ai_assist_used,
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

    // After-hours AI auto-response
    const afterHoursEvents: TimelineRow[] = isAfterHoursLead
      ? [
          {
            id: 'after-hours-auto',
            timestamp: new Date(Date.now() - 8 * 3600_000).toISOString(),
            type: 'message',
            direction: 'outbound',
            label: 'SMS outbound • ARIA auto-responded',
            detail: AFTER_HOURS_AI_RESPONSE,
            aiGenerated: true,
            isAfterHoursAuto: true,
          },
        ]
      : [];

    const appended = localEvents[selectedThread.id] ?? [];

    return [...messages, ...calls, ...afterHoursEvents, ...appended].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [localEvents, selectedThread, isAfterHoursLead]);

  // Classify intent when thread changes
  useEffect(() => {
    if (!selectedThread) return;
    if (threadIntents[selectedThread.id]) return;

    const lastInbound = osMessageEvents
      .filter((m) => m.thread_id === selectedThread.id && m.direction === 'inbound')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (!lastInbound) return;

    classifyLeadIntent(lastInbound.body).then((result) => {
      setThreadIntents((prev) => ({ ...prev, [selectedThread.id]: result }));
    });
  }, [selectedThread, threadIntents]);

  function appendLocalEvent(threadId: string, event: TimelineRow) {
    setLocalEvents((current) => ({
      ...current,
      [threadId]: [event, ...(current[threadId] ?? [])],
    }));
  }

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
    } catch {
      toast.error('Could not simulate inbound SMS event.');
    } finally {
      setIsSimulatingSms(false);
    }
  }

  async function handleGenerateDraft() {
    if (!selectedLead || !selectedThread) return;
    setIsDrafting(true);
    try {
      const lastInbound = osMessageEvents
        .filter((m) => m.thread_id === selectedThread.id && m.direction === 'inbound')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      const draft = await generateInboxReply({
        leadFirstName: selectedLead.first_name,
        clickedVehicle: selectedThread.context?.clicked_vehicle,
        sessionSource: selectedThread.context?.session_source,
        lastInboundMessage: lastInbound?.body,
        location: selectedThread.location,
      });
      setComposer(draft);
      toast.success('ARIA draft ready.');
    } catch {
      toast.error('Could not generate draft.');
    } finally {
      setIsDrafting(false);
    }
  }

  async function handleSendDraft() {
    if (!selectedLead || !selectedThread) {
      toast.error('Select a conversation first.');
      return;
    }
    const body = composer.trim();
    if (!body) {
      toast.error('Draft is empty.');
      return;
    }

    setActionBusy('sms');
    try {
      const session = await startChatSession({
        lead_id: selectedLead.id,
        location: selectedThread.location,
        session_source: selectedThread.context?.session_source ?? 'webchat',
        page_url: selectedThread.context?.page_url ?? '/contact',
        clicked_vehicle: selectedThread.context?.clicked_vehicle,
        utm_source: selectedThread.context?.utm_source,
        utm_campaign: selectedThread.context?.utm_campaign,
      });

      await sendChatMessage({
        session_id: session.session_id,
        direction: 'outbound',
        channel: 'sms',
        body,
        ai_assist_used: true,
      });

      await sendOutboundSms({ lead_id: selectedLead.id, body, template_key: 'ai_bdc_fast_reply' });

      appendLocalEvent(selectedThread.id, {
        id: `local-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'message',
        direction: 'outbound',
        label: 'SMS outbound • AI assist',
        detail: body,
        aiGenerated: true,
      });

      setComposer('');
      toast.success('Outbound SMS queued and logged.');
    } catch {
      toast.error('Could not send outbound SMS.');
    } finally {
      setActionBusy(null);
    }
  }

  function handleMentionSelect(rep: string) {
    const textarea = composerRef.current;
    if (!textarea) return;
    const pos = textarea.selectionStart;
    const before = composer.slice(0, pos);
    const atIdx = before.lastIndexOf('@');
    const updated = (atIdx >= 0 ? composer.slice(0, atIdx) : composer) + `@${rep} ` + (atIdx >= 0 ? composer.slice(pos) : '');
    setComposer(updated);
    setMentionDropdownOpen(false);
    setTimeout(() => textarea.focus(), 0);
  }

  async function handleScheduleMessage(slot: string) {
    const body = composer.trim();
    if (!body) {
      toast.error('Write a message first, then schedule it.');
      setShowSchedulePicker(false);
      return;
    }
    setShowSchedulePicker(false);
    appendLocalEvent(selectedThreadId, {
      id: `local-sched-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'message',
      direction: 'outbound',
      label: 'SMS scheduled',
      detail: body,
      isScheduled: true,
      scheduledFor: slot,
    });
    setComposer('');
    toast.success(`Message scheduled for ${slot}. Will send automatically.`);
  }

  async function handlePaymentRequest() {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid payment amount.');
      return;
    }
    setShowPaymentModal(false);
    setPaymentAmount('');
    appendLocalEvent(selectedThreadId, {
      id: `local-pay-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'message',
      direction: 'outbound',
      label: 'Payment request sent',
      detail: `Payment request: $${amount.toLocaleString()} deposit • Link sent via SMS`,
    });
    toast.success(`Payment link for $${amount.toLocaleString()} sent via SMS.`);
  }

  async function handleOneTapAction(action: 'call' | 'book' | 'docs') {
    if (!selectedLead || !selectedThread) {
      toast.error('Select a conversation first.');
      return;
    }
    setActionBusy(action);
    try {
      if (action === 'call') {
        const durationSeconds = 180 + Math.floor(Math.random() * 200);
        const [summary] = await Promise.all([
          generateAICallSummary(
            selectedLead.first_name,
            selectedThread.context?.clicked_vehicle ?? 'the vehicle',
            'answered',
            durationSeconds,
          ),
          summarizeCall({
            lead_id: selectedLead.id,
            summary: 'Rep call — see AI summary',
            outcome: 'answered',
            duration_seconds: durationSeconds,
            follow_up_action: 'Send SMS recap',
          }),
        ]);

        appendLocalEvent(selectedThread.id, {
          id: `local-call-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'call',
          direction: 'outbound',
          label: 'CALL outbound • answered',
          detail: summary,
          aiGenerated: true,
        });

        toast.success('Call summary saved by ARIA.');
        return;
      }

      if (action === 'book') {
        await bookAppointment({
          lead_id: selectedLead.id,
          location: selectedThread.location,
          vehicle_label: selectedThread.context?.clicked_vehicle ?? 'Recommended inventory match',
          starts_at: new Date(Date.now() + 24 * 3_600_000).toISOString(),
        });

        appendLocalEvent(selectedThread.id, {
          id: `local-book-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'message',
          direction: 'outbound',
          label: 'Appointment booked',
          detail: `Test drive booked for ${selectedThread.context?.clicked_vehicle ?? 'best match'}. T-24h and T-2h reminder cadence queued.`,
        });

        toast.success('Appointment booked.');
        return;
      }

      await executeWorkflow({
        workflow_key: 'finance_incomplete_rescue',
        lead_id: selectedLead.id,
        context: { source: 'inbox_one_tap', reason: 'requested_docs' },
      });

      appendLocalEvent(selectedThread.id, {
        id: `local-docs-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'message',
        direction: 'outbound',
        label: 'Docs request sent',
        detail: 'Requested proof of income and residence for finance progression.',
      });

      toast.success('Finance docs workflow triggered.');
    } catch {
      toast.error('Action failed.');
    } finally {
      setActionBusy(null);
    }
  }

  const latestMissedCall = useMemo(() => {
    if (!selectedLead) return null;
    return osCallEvents
      .filter((call) => call.lead_id === selectedLead.id && call.outcome === 'missed')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null;
  }, [selectedLead]);

  const currentIntent = selectedThread ? threadIntents[selectedThread.id] : null;

  return (
    <Layout variant="command-center" hideTopBar>
      <div className="space-y-5 px-5 pb-8 pt-5 sm:px-6 lg:px-8 xl:px-10">
        {/* Header */}
        <section className="rounded-2xl border border-[#2A3B64] bg-[linear-gradient(180deg,#0F1A37_0%,#0A132A_100%)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#90A5D0]">Inbox SLA Queue</p>
              <h1 className="mt-1 text-3xl font-semibold text-[#ECF2FF]">Omnichannel Inbox + Context</h1>
              <p className="mt-1 text-sm text-[#9EB0D4]">
                Webchat, SMS, calls, and click-path context with 5-minute SLA, intent routing, and AI reply.
              </p>
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

          {/* SLA alerts */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {alerts.length === 0 ? (
              <div className="rounded-xl border border-[#2D436F] bg-[#101B36] px-4 py-3 text-sm text-[#A6B7DA]">
                No active SLA breaches in business hours.
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.lead_id} className="rounded-xl border border-[#4B3260] bg-[linear-gradient(180deg,#1A1830_0%,#121022_100%)] px-4 py-3">
                  <p className="text-sm font-semibold text-[#F4E8FF]">{alert.lead_name}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-[#D7A8FF]">{alert.severity} priority</p>
                  <p className="mt-2 text-sm text-[#C6CEE6]">{alert.minutes_waiting} minutes waiting</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Thread list */}
          <div className="rounded-2xl border border-[#24355A] bg-[#0D172F] p-3">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#89A1D1]">Threads</p>
            <div className="space-y-2">
              {osConversationThreads.map((thread) => {
                const lead = leadsById.get(thread.lead_id);
                const selected = thread.id === selectedThreadId;
                const sla = slaByThread.get(thread.id);
                const intent = threadIntents[thread.id];
                const isAfterHours = lead ? AFTER_HOURS_LEAD_IDS.has(lead.id) : false;

                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      selected ? 'border-[#5E84D6] bg-[#1A2B53]' : 'border-[#24375D] bg-[#111D39] hover:border-[#3D5E9E]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#EAF0FF]">
                        {lead?.first_name} {lead?.last_name}
                      </p>
                      <div className="flex items-center gap-1">
                        {isAfterHours && <Moon size={11} className="text-[#7B9BD4]" />}
                        {thread.has_unread && (
                          <span className="rounded-full bg-[#3B63D8] px-2 py-[2px] text-[10px] font-semibold uppercase text-white">
                            unread
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-[#95AAD3]">Rep: {thread.assigned_rep}</p>
                    <p className="mt-1 text-xs text-[#728CB8]">Location: {thread.location.toUpperCase()}</p>
                    {intent && (
                      <span className={`mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${INTENT_STYLES[intent.category]}`}>
                        {intent.emoji} {intent.label}
                      </span>
                    )}
                    <p className="mt-1 text-xs text-[#92A6D4]">
                      SLA: {sla ? `${sla.minutes_open}m open` : 'n/a'}
                      {sla?.is_breached ? ` • ${sla.severity}` : ''}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timeline + composer */}
          <div className="rounded-2xl border border-[#24355A] bg-[#0D172F] p-4">
            {/* Thread header */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#22345A] pb-3">
              <div>
                <p className="text-sm text-[#8DA4D2]">Timeline</p>
                <h2 className="text-2xl font-semibold text-[#ECF2FF]">
                  {selectedLead ? `${selectedLead.first_name} ${selectedLead.last_name}` : 'Select a thread'}
                </h2>
                {currentIntent && (
                  <span className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${INTENT_STYLES[currentIntent.category]}`}>
                    {currentIntent.emoji} {currentIntent.label} intent
                  </span>
                )}
                {selectedThread?.context && (
                  <div className="mt-2 space-y-1 text-xs text-[#9EB2D8]">
                    <p className="inline-flex items-center gap-1">
                      <Link2 size={12} />
                      {selectedThread.context.page_url}
                    </p>
                    <p>
                      Vehicle: {selectedThread.context.clicked_vehicle ?? 'Not captured'} • UTM:{' '}
                      {selectedThread.context.utm_source ?? 'direct'}
                    </p>
                  </div>
                )}
              </div>
              {selectedLead?.phone && <p className="text-sm text-[#9EB2D8]">{selectedLead.phone}</p>}
            </div>

            {/* After-hours banner */}
            {isAfterHoursLead && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#2B4060] bg-[#0D1E35] px-4 py-2">
                <Moon size={14} className="text-[#6BA3D4]" />
                <p className="text-xs text-[#9EB2D8]">
                  <span className="font-semibold text-[#C8D9F5]">Lead arrived at {AFTER_HOURS_TIME}</span>
                  {' '}• ARIA auto-responded within 30 seconds
                </p>
              </div>
            )}

            {/* Missed call indicator */}
            {latestMissedCall && (
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#402347] px-2 py-1 text-[11px] text-[#F6C8FF]">
                <PhoneMissed size={12} />
                Missed-call fallback eligible ({new Date(latestMissedCall.created_at).toLocaleTimeString()})
              </div>
            )}

            {/* One-tap actions */}
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              <button
                type="button"
                onClick={() => void handleOneTapAction('call')}
                disabled={actionBusy !== null}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#33548C] bg-[#152345] px-3 py-2 text-xs font-semibold text-[#DCE8FF] transition hover:bg-[#1B2F5D] disabled:opacity-60"
              >
                <PhoneCall size={13} />
                Call
              </button>
              <button
                type="button"
                onClick={() => void handleSendDraft()}
                disabled={actionBusy !== null || !composer.trim()}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#33548C] bg-[#152345] px-3 py-2 text-xs font-semibold text-[#DCE8FF] transition hover:bg-[#1B2F5D] disabled:opacity-60"
              >
                <MessageSquareText size={13} />
                Send SMS
              </button>
              <button
                type="button"
                onClick={() => void handleOneTapAction('book')}
                disabled={actionBusy !== null}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#33548C] bg-[#152345] px-3 py-2 text-xs font-semibold text-[#DCE8FF] transition hover:bg-[#1B2F5D] disabled:opacity-60"
              >
                <CalendarCheck size={13} />
                Book
              </button>
              <button
                type="button"
                onClick={() => void handleOneTapAction('docs')}
                disabled={actionBusy !== null}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#33548C] bg-[#152345] px-3 py-2 text-xs font-semibold text-[#DCE8FF] transition hover:bg-[#1B2F5D] disabled:opacity-60"
              >
                <Files size={13} />
                Request Docs
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                disabled={actionBusy !== null}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#33548C] bg-[#152345] px-3 py-2 text-xs font-semibold text-[#DCE8FF] transition hover:bg-[#1B2F5D] disabled:opacity-60"
              >
                <CreditCard size={13} />
                Payment
              </button>
            </div>

            {/* AI Composer */}
            <div className="mt-3 rounded-xl border border-[#2A406D] bg-[#101B36] p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#A6B8DE]">AI-assisted reply</p>
                <div className="flex items-center gap-2">
                  {/* @mention */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMentionDropdownOpen((v) => !v)}
                      className="inline-flex items-center gap-1 rounded border border-[#3C5C9A] px-2 py-1 text-[11px] font-semibold text-[#CFE0FF] transition hover:bg-[#1A2D59]"
                    >
                      <AtSign size={11} />
                      Mention
                    </button>
                    {mentionDropdownOpen && (
                      <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-xl border border-[#2D436F] bg-[#0D172F] py-1 shadow-xl">
                        {REPS.map((rep) => (
                          <button
                            key={rep}
                            type="button"
                            onClick={() => handleMentionSelect(rep)}
                            className="w-full px-3 py-2 text-left text-xs text-[#C8D9F5] transition hover:bg-[#162540]"
                          >
                            {rep}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Schedule */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSchedulePicker((v) => !v)}
                      className="inline-flex items-center gap-1 rounded border border-[#3C5C9A] px-2 py-1 text-[11px] font-semibold text-[#CFE0FF] transition hover:bg-[#1A2D59]"
                    >
                      <CalendarClock size={11} />
                      Schedule
                    </button>
                    {showSchedulePicker && (
                      <div className="absolute right-0 top-full z-20 mt-1 min-w-[190px] rounded-xl border border-[#2D436F] bg-[#0D172F] py-1 shadow-xl">
                        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase text-[#7B9BD4]">Send at…</p>
                        {getScheduleSlots().map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => void handleScheduleMessage(slot)}
                            className="w-full px-3 py-2 text-left text-xs text-[#C8D9F5] transition hover:bg-[#162540]"
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Generate */}
                  <button
                    type="button"
                    onClick={() => void handleGenerateDraft()}
                    disabled={isDrafting}
                    className="inline-flex items-center gap-1 rounded border border-[#3C5C9A] px-2 py-1 text-[11px] font-semibold text-[#CFE0FF] transition hover:bg-[#1A2D59] disabled:opacity-60"
                  >
                    <Sparkles size={12} />
                    {isDrafting ? 'ARIA drafting…' : 'Generate Draft'}
                  </button>
                </div>
              </div>
              <textarea
                ref={composerRef}
                value={composer}
                onChange={(e) => {
                  setComposer(e.target.value);
                  if (e.target.value.endsWith('@')) setMentionDropdownOpen(true);
                  else if (!e.target.value.includes('@')) setMentionDropdownOpen(false);
                }}
                placeholder="Generate or type a reply… use @ to mention a rep"
                rows={3}
                className="w-full rounded-md border border-[#2D436F] bg-[#0D172F] px-2 py-2 text-sm text-[#E3EDFF] placeholder:text-[#6F87B5]"
              />
            </div>

            {/* Timeline */}
            <div className="mt-4 space-y-3">
              {timeline.length === 0 ? (
                <p className="rounded-xl border border-[#25375F] bg-[#101B36] px-4 py-3 text-sm text-[#99ADD4]">
                  No timeline events available for this conversation yet.
                </p>
              ) : (
                timeline.map((item) => (
                  <article
                    key={item.id}
                    className={`rounded-xl border px-4 py-3 ${
                      item.isAfterHoursAuto
                        ? 'border-[#2B4060] bg-[linear-gradient(180deg,#0D1E38_0%,#091628_100%)]'
                        : 'border-[#2A406D] bg-[linear-gradient(180deg,#132043_0%,#0E1A37_100%)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#A6B8DE]">
                        {item.type === 'message' ? <MessageSquareText size={14} /> : <PhoneCall size={14} />}
                        <span>{item.label}</span>
                        {item.isAfterHoursAuto && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#2B4060] bg-[#0D1E35] px-1.5 py-0.5 text-[10px] text-[#6BA3D4]">
                            <Moon size={9} />
                            After-hours auto
                          </span>
                        )}
                        {item.isScheduled && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#4B5E9A] bg-[#1A2549] px-1.5 py-0.5 text-[10px] text-[#9AB8FF]">
                            <CalendarClock size={9} />
                            {item.scheduledFor ? `Scheduled for ${item.scheduledFor}` : 'Scheduled'}
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs text-[#8FA6D3]">
                        <Clock3 size={12} />
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[#DFE7FA]">{item.detail}</p>
                    {item.aiGenerated && !item.isAfterHoursAuto && (
                      <p className="mt-1.5 flex items-center gap-1 text-[10px] text-[#6A88C0]">
                        <Sparkles size={9} />
                        AI-generated by ARIA
                      </p>
                    )}
                    {item.type === 'call' && item.label.includes('missed') && (
                      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#402347] px-2 py-1 text-[11px] text-[#F6C8FF]">
                        <PhoneMissed size={12} />
                        Missed-call text-back should fire
                      </p>
                    )}
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Payment request modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#2A3B64] bg-[#0D172F] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#ECF2FF]">Send Payment Request</h3>
              <button type="button" onClick={() => setShowPaymentModal(false)} className="text-[#6F87B5] hover:text-[#CFE0FF]">
                <X size={18} />
              </button>
            </div>
            <p className="mt-1 text-sm text-[#8DA4D2]">Customer will receive a secure payment link via SMS.</p>
            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#89A1D1]">Amount ($)</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="500"
                className="mt-2 w-full rounded-xl border border-[#2D436F] bg-[#0A132A] px-3 py-2.5 text-sm text-[#E3EDFF] placeholder:text-[#5A7AAF] focus:border-[#4A6AAE] focus:outline-none"
              />
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 rounded-xl border border-[#24375D] py-2 text-sm text-[#8EA6D4] transition hover:bg-[#111D39]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handlePaymentRequest()}
                className="flex-1 rounded-xl border border-[#5C7FD2] bg-[#2A4BA8] py-2 text-sm font-semibold text-white transition hover:bg-[#3559BE]"
              >
                Send Payment Link
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
