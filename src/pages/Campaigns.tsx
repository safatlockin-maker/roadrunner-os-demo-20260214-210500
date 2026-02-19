import { useState } from 'react';
import { RefreshCw, Send, Sparkles, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '../components/layout/Layout';
import { generateCampaignCopy } from '../services/aiService';
import { osCampaignHistory } from '../data/roadrunnerOSDemo';
import { realisticInventory } from '../data/realisticInventory';

type AudienceOption = 'Cold leads 30+ days' | 'Finance incomplete' | 'No-shows last 14 days' | 'All active leads';
type GoalOption = 'Test Drive' | 'Price Drop Alert' | 'New Inventory' | 'Financing Special';

const AUDIENCE_COUNTS: Record<AudienceOption, number> = {
  'Cold leads 30+ days': 23,
  'Finance incomplete': 11,
  'No-shows last 14 days': 8,
  'All active leads': 47,
};

const AUDIENCE_OPTIONS: AudienceOption[] = [
  'Cold leads 30+ days',
  'Finance incomplete',
  'No-shows last 14 days',
  'All active leads',
];

const GOAL_OPTIONS: GoalOption[] = ['Test Drive', 'Price Drop Alert', 'New Inventory', 'Financing Special'];

function getTopVehicles() {
  return realisticInventory
    .filter((v) => v.status === 'available')
    .slice(0, 8)
    .map((v) => `${v.year} ${v.make} ${v.model}${v.trim ? ' ' + v.trim : ''}`);
}

export default function Campaigns() {
  const [audience, setAudience] = useState<AudienceOption>('Cold leads 30+ days');
  const [goal, setGoal] = useState<GoalOption>('Test Drive');
  const [vehicle, setVehicle] = useState(getTopVehicles()[2] ?? '2022 Honda CR-V EX-L');
  const [generatedCopy, setGeneratedCopy] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [sendTime, setSendTime] = useState('Tuesday–Thursday, 10am–12pm');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentCampaigns, setSentCampaigns] = useState(osCampaignHistory);

  async function handleGenerate() {
    setIsGenerating(true);
    setGeneratedCopy(null);
    try {
      const result = await generateCampaignCopy(audience, vehicle, goal);
      setGeneratedCopy(result.message);
      setCharCount(result.charCount || result.message.length);
      setSendTime(result.sendTimeSuggestion);
    } catch {
      toast.error('Failed to generate campaign copy.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSend() {
    if (!generatedCopy) return;
    setIsSending(true);
    await new Promise((r) => setTimeout(r, 900));
    const recipientCount = AUDIENCE_COUNTS[audience];
    toast.success(`Campaign queued. ${recipientCount} leads will receive this message.`);
    setSentCampaigns((prev) => [
      {
        id: `campaign-new-${Date.now()}`,
        name: `${goal} — ${audience}`,
        target_audience: audience,
        vehicle_spotlight: vehicle,
        goal,
        message_preview: generatedCopy,
        sent_at: new Date().toISOString(),
        recipient_count: recipientCount,
        response_rate_percent: 0,
        test_drives_booked: 0,
        revenue_attributed: 0,
      },
      ...prev,
    ]);
    setGeneratedCopy(null);
    setIsSending(false);
  }

  const recipientCount = AUDIENCE_COUNTS[audience];
  const topVehicles = getTopVehicles();

  return (
    <Layout variant="command-center" hideTopBar>
      <div className="space-y-5 px-5 pb-8 pt-5 sm:px-6 lg:px-8 xl:px-10">
        {/* Header */}
        <section className="rounded-2xl border border-[#2A3B64] bg-[linear-gradient(180deg,#0F1A37_0%,#0A132A_100%)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#90A5D0]">Revenue Mining</p>
          <h1 className="mt-1 text-3xl font-semibold text-[#ECF2FF]">SMS Campaign Builder</h1>
          <p className="mt-1 text-sm text-[#9EB0D4]">
            Target dormant leads with AI-written campaigns. Podium calls this "Revenue Mining" — ours is included.
          </p>
        </section>

        <div className="grid gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
          {/* Builder form */}
          <section className="rounded-2xl border border-[#273B63] bg-[#0D172F] p-5">
            <h2 className="text-lg font-semibold text-[#EAF0FF]">Build Campaign</h2>

            <div className="mt-4 space-y-4">
              {/* Audience */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-[#89A1D1]">
                  Target Audience
                </label>
                <div className="mt-2 space-y-2">
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAudience(opt)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition ${
                        audience === opt
                          ? 'border-[#5E84D6] bg-[#1A2B53] text-[#EAF0FF]'
                          : 'border-[#24375D] bg-[#111D39] text-[#8EA6D4] hover:border-[#3D5E9E]'
                      }`}
                    >
                      <span>{opt}</span>
                      <span className="text-xs text-[#6A88C0]">{AUDIENCE_COUNTS[opt]} leads</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-[#89A1D1]">
                  Campaign Goal
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {GOAL_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setGoal(opt)}
                      className={`rounded-xl border px-3 py-2 text-sm transition ${
                        goal === opt
                          ? 'border-[#5E84D6] bg-[#1A2B53] text-[#EAF0FF]'
                          : 'border-[#24375D] bg-[#111D39] text-[#8EA6D4] hover:border-[#3D5E9E]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle spotlight */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-[#89A1D1]">
                  Vehicle Spotlight
                </label>
                <select
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#2D436F] bg-[#0A132A] px-3 py-2.5 text-sm text-[#E3EDFF] focus:border-[#4A6AAE] focus:outline-none"
                >
                  {topVehicles.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* Generate button */}
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={isGenerating}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#5C7FD2] bg-[#2A4BA8] py-3 text-sm font-semibold text-white transition hover:bg-[#3559BE] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles size={16} />
                {isGenerating ? 'ARIA is writing…' : 'Generate Campaign Copy'}
              </button>
            </div>
          </section>

          {/* Preview panel */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-[#273B63] bg-[#0D172F] p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#EAF0FF]">Campaign Preview</h2>
                {generatedCopy && (
                  <button
                    type="button"
                    onClick={() => void handleGenerate()}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#3C5C9A] px-3 py-1.5 text-xs font-semibold text-[#CFE0FF] transition hover:bg-[#1A2D59] disabled:opacity-60"
                  >
                    <RefreshCw size={12} />
                    Regenerate
                  </button>
                )}
              </div>

              {isGenerating && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#2B426F] bg-[#101B36] px-4 py-5 text-sm text-[#7B9BD4]">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7B9BD4]" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7B9BD4]" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7B9BD4]" style={{ animationDelay: '300ms' }} />
                  </span>
                  ARIA is writing your campaign…
                </div>
              )}

              {!generatedCopy && !isGenerating && (
                <div className="mt-4 rounded-xl border border-dashed border-[#2B426F] bg-[#0A132A] px-4 py-8 text-center text-sm text-[#5A7AAF]">
                  Select your audience and goal, then click Generate to see ARIA write real SMS copy.
                </div>
              )}

              {generatedCopy && !isGenerating && (
                <div className="mt-4 space-y-4">
                  {/* SMS preview */}
                  <div className="rounded-xl border border-[#2B426F] bg-[#0A132A] p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#7B9BD4]">SMS Message Preview</p>
                      <span className={`text-xs ${charCount > 140 ? 'text-[#F4C97A]' : 'text-[#4CE39B]'}`}>
                        {charCount}/155 chars
                      </span>
                    </div>
                    <div className="rounded-lg bg-[#0F1A37] px-3 py-3 text-sm text-[#DDE7FA]">
                      {generatedCopy}
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-[11px] text-[#5A7AAF]">
                      <Sparkles size={10} />
                      AI-generated by ARIA
                    </p>
                  </div>

                  {/* Campaign stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-[#2B426F] bg-[#101B36] px-3 py-3 text-center">
                      <p className="text-2xl font-bold text-[#EAF0FF]">{recipientCount}</p>
                      <p className="mt-0.5 text-xs text-[#8CA4D2]">Recipients</p>
                    </div>
                    <div className="rounded-xl border border-[#2B426F] bg-[#101B36] px-3 py-3 text-center">
                      <p className="text-2xl font-bold text-[#EAF0FF]">~22%</p>
                      <p className="mt-0.5 text-xs text-[#8CA4D2]">Expected Response</p>
                    </div>
                    <div className="rounded-xl border border-[#2B426F] bg-[#101B36] px-3 py-3 text-center">
                      <p className="text-2xl font-bold text-[#4CE39B]">5–7</p>
                      <p className="mt-0.5 text-xs text-[#8CA4D2]">Projected Test Drives</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#2B426F] bg-[#101B36] px-4 py-3 text-xs text-[#8CA4D2]">
                    <span className="font-semibold text-[#C8D9F5]">Best send time: </span>
                    {sendTime}
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={isSending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#4B9A7B] bg-[#1B4537] py-3 text-sm font-semibold text-[#C1F1DD] transition hover:bg-[#235C45] disabled:opacity-60"
                  >
                    <Send size={16} />
                    {isSending ? 'Sending…' : `Send to ${recipientCount} Leads`}
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Campaign history */}
        <section className="rounded-2xl border border-[#273B63] bg-[#0D172F] p-5">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-[#9CB6E8]" />
            <h2 className="text-lg font-semibold text-[#EAF0FF]">Past Campaigns</h2>
          </div>
          <div className="mt-4 space-y-3">
            {sentCampaigns.map((campaign) => (
              <article
                key={campaign.id}
                className="rounded-xl border border-[#2B426F] bg-[linear-gradient(180deg,#142347_0%,#0E1A37_100%)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#EAF0FF]">{campaign.name}</p>
                    <p className="mt-0.5 text-xs text-[#7B9BD4]">
                      {campaign.vehicle_spotlight} • {campaign.target_audience}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-right">
                    <div>
                      <p className="text-sm font-bold text-[#EAF0FF]">{campaign.recipient_count}</p>
                      <p className="text-[10px] text-[#6A88C0]">Recipients</p>
                    </div>
                    {campaign.response_rate_percent > 0 && (
                      <>
                        <div>
                          <p className="text-sm font-bold text-[#EAF0FF]">{campaign.response_rate_percent}%</p>
                          <p className="text-[10px] text-[#6A88C0]">Response Rate</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#4CE39B]">{campaign.test_drives_booked}</p>
                          <p className="text-[10px] text-[#6A88C0]">Test Drives</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#EAF0FF]">${campaign.revenue_attributed.toLocaleString()}</p>
                          <p className="text-[10px] text-[#6A88C0]">Revenue</p>
                        </div>
                      </>
                    )}
                    {campaign.response_rate_percent === 0 && (
                      <span className="rounded-full border border-[#5D86D1] bg-[#203A72] px-2 py-0.5 text-[10px] text-[#C9DBFF]">Sent</span>
                    )}
                  </div>
                </div>
                <p className="mt-2 rounded-md bg-[#0A132A] px-3 py-2 text-xs text-[#9EB2D8]">
                  "{campaign.message_preview}"
                </p>
                <p className="mt-1.5 text-xs text-[#5A7AAF]">
                  {new Date(campaign.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}

