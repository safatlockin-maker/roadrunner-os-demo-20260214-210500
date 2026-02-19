import { useEffect, useRef, useState } from 'react';
import { Bot, ChevronDown, ChevronUp, Send, Sparkles, Zap } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { chatWithARIA, isAIConfigured } from '../services/aiService';
import type { ARIAMessage } from '../services/aiService';
import { realisticInventory } from '../data/realisticInventory';

const ARIA_OPENER = "Hi! I'm ARIA, Road Runner Auto Sales' 24/7 AI assistant. I can help you find a vehicle, check inventory, schedule a test drive, estimate your trade-in, or answer any financing question. What are you looking for today?";

const DEMO_PROMPTS = [
  'Do you have any trucks under $30k?',
  'What are your financing options?',
  'I have a 2018 Honda Civic with 62,000 miles — what would you give me for it?',
  'When are you open and where are you located?',
  'I need a reliable sedan under $20k with low mileage',
  'Can I get pre-approved before coming in?',
];

const CONFIG_OPTIONS = [
  { label: 'AI Persona', value: 'ARIA — Professional & Friendly' },
  { label: 'Response Style', value: 'Conversational (non-scripted)' },
  { label: 'After-Hours Mode', value: 'Active 7PM–9AM' },
  { label: 'Escalation Trigger', value: 'Price negotiation → human rep' },
  { label: 'Inventory Awareness', value: 'Real-time sync enabled' },
  { label: 'Trade-In Estimation', value: 'Auto-estimate with KBB guidance' },
  { label: 'Finance Pre-Qual', value: 'Soft pull with consent' },
  { label: 'Test Drive Booking', value: 'Direct calendar integration' },
];

function buildInventorySummary(): string {
  const available = realisticInventory.filter((v) => v.status === 'available').slice(0, 12);
  return available
    .map((v) => `${v.year} ${v.make} ${v.model}${v.trim ? ' ' + v.trim : ''} — $${v.list_price?.toLocaleString()} (${v.mileage?.toLocaleString()} mi)`)
    .join('; ');
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<ARIAMessage[]>([
    { role: 'assistant', content: ARIA_OPENER },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inventorySummary = buildInventorySummary();
  const aiConfigured = isAIConfigured();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function handleSend(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText || isLoading) return;

    const userMessage: ARIAMessage = { role: 'user', content: userText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithARIA(updatedMessages, inventorySummary);
      setMessages([...updatedMessages, { role: 'assistant', content: response }]);
    } catch {
      setMessages([...updatedMessages, { role: 'assistant', content: "I'm having a quick moment — try again and I'll get right back to you!" }]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <Layout variant="command-center" hideTopBar>
      <div className="flex h-[calc(100vh-0px)] flex-col gap-0 px-5 pb-4 pt-5 sm:px-6 lg:px-8 xl:px-10">
        {/* Header */}
        <section className="mb-4 rounded-2xl border border-[#2A3B64] bg-[linear-gradient(180deg,#0F1A37_0%,#0A132A_100%)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#90A5D0]">AI Employee</p>
              <h1 className="mt-1 text-3xl font-semibold text-[#ECF2FF]">ARIA — 24/7 AI Sales Agent</h1>
              <p className="mt-1 text-sm text-[#9EB0D4]">
                Inventory-aware. Financing-ready. Never sleeps. Like Podium Jerry — but ours.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#4B9A7B] bg-[#1B4537] px-3 py-1 text-xs font-semibold text-[#C1F1DD]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#4CE39B]" />
                AI Agent: ACTIVE • 24/7
              </span>
              {!aiConfigured && (
                <span className="rounded-full border border-[#7B5A2B] bg-[#3D2D15] px-3 py-1 text-xs text-[#F4C97A]">
                  Demo mode — add VITE_GEMINI_API_KEY for live AI
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowConfig((v) => !v)}
                className="inline-flex items-center gap-1 rounded-lg border border-[#3C5C9A] bg-[#1A2D59] px-3 py-1.5 text-xs font-semibold text-[#CFE0FF] transition hover:bg-[#243E7A]"
              >
                {showConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                40+ Configurations
              </button>
            </div>
          </div>

          {showConfig && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {CONFIG_OPTIONS.map((opt) => (
                <div key={opt.label} className="rounded-xl border border-[#2B426F] bg-[#0E1A37] px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7B9BD4]">{opt.label}</p>
                  <p className="mt-0.5 text-xs text-[#C8D9F5]">{opt.value}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Main chat + context grid */}
        <div className="flex min-h-0 flex-1 gap-4">
          {/* Context sidebar */}
          <aside className="hidden w-64 shrink-0 space-y-3 xl:block">
            <div className="rounded-2xl border border-[#273B63] bg-[#0D172F] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#89A1D1]">ARIA Knows</p>
              <ul className="mt-3 space-y-2 text-xs text-[#A6B8DE]">
                <li className="flex items-start gap-2">
                  <Zap size={12} className="mt-0.5 shrink-0 text-[#4CE39B]" />
                  <span><strong className="text-[#DCE8FF]">{realisticInventory.filter(v => v.status === 'available').length} vehicles</strong> available now</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap size={12} className="mt-0.5 shrink-0 text-[#4CE39B]" />
                  <span>Wayne & Taylor locations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap size={12} className="mt-0.5 shrink-0 text-[#4CE39B]" />
                  <span>All credit types financed</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap size={12} className="mt-0.5 shrink-0 text-[#4CE39B]" />
                  <span>Trade-in appraisal available</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap size={12} className="mt-0.5 shrink-0 text-[#4CE39B]" />
                  <span>Mon–Sat 9am–7pm hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap size={12} className="mt-0.5 shrink-0 text-[#4CE39B]" />
                  <span>Same-day financing approval</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[#273B63] bg-[#0D172F] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#89A1D1]">Try Asking</p>
              <div className="mt-3 space-y-2">
                {DEMO_PROMPTS.slice(0, 4).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void handleSend(prompt)}
                    disabled={isLoading}
                    className="w-full rounded-lg border border-[#2B3F6A] bg-[#111D3A] px-2 py-1.5 text-left text-[11px] text-[#9EB2D8] transition hover:border-[#4A6AAE] hover:bg-[#182540] hover:text-[#C8D9F5] disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Chat area */}
          <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[#24355A] bg-[#0D172F]">
            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2A4BA8]">
                      <Bot size={16} className="text-[#CFE0FF]" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                      message.role === 'user'
                        ? 'bg-[#2A4BA8] text-[#EAF0FF]'
                        : 'border border-[#2B426F] bg-[#142347] text-[#DDE7FA]'
                    }`}
                  >
                    {message.content}
                    {message.role === 'assistant' && index > 0 && (
                      <p className="mt-1.5 flex items-center gap-1 text-[10px] text-[#6A88C0]">
                        <Sparkles size={9} />
                        ARIA • AI-generated
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2A4BA8]">
                    <Bot size={16} className="text-[#CFE0FF]" />
                  </div>
                  <div className="rounded-2xl border border-[#2B426F] bg-[#142347] px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-[#7B9BD4]">
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7B9BD4]" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7B9BD4]" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7B9BD4]" style={{ animationDelay: '300ms' }} />
                      </span>
                      ARIA is thinking…
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Composer */}
            <div className="border-t border-[#1E3055] p-4">
              {/* Quick prompts (mobile) */}
              <div className="mb-3 flex flex-wrap gap-2 xl:hidden">
                {DEMO_PROMPTS.slice(0, 3).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void handleSend(prompt)}
                    disabled={isLoading}
                    className="rounded-full border border-[#2B3F6A] bg-[#111D3A] px-3 py-1 text-[11px] text-[#9EB2D8] transition hover:bg-[#182540] disabled:opacity-50"
                  >
                    {prompt.length > 30 ? prompt.slice(0, 30) + '…' : prompt}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask ARIA anything — inventory, financing, trade-ins, appointments…"
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-[#2D436F] bg-[#0A132A] px-3 py-2.5 text-sm text-[#E3EDFF] placeholder:text-[#5A7AAF] focus:border-[#4A6AAE] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={isLoading || !input.trim()}
                  className="flex h-full items-center justify-center rounded-xl border border-[#5C7FD2] bg-[#2A4BA8] px-4 text-white transition hover:bg-[#3559BE] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-[#5A7AAF]">
                Press Enter to send • Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
