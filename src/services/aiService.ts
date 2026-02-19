import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Lead } from '../types/lead';
import type { Vehicle } from '../types/inventory';

// Initialize Gemini AI
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn('Gemini API key not found. Using fallback responses');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export type ResponseStyle = 'quick' | 'detailed' | 'promotional';

export interface AIResponse {
  style: ResponseStyle;
  title: string;
  content: string;
}

export async function generateLeadResponses(
  lead: Lead,
  vehicleOfInterest?: Vehicle,
  availableInventory: Vehicle[] = []
): Promise<AIResponse[]> {
  if (!genAI) {
    return getFallbackResponses(lead, vehicleOfInterest);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const vehicleContext = vehicleOfInterest
      ? `Interested in: ${vehicleOfInterest.year} ${vehicleOfInterest.make} ${vehicleOfInterest.model} ($${vehicleOfInterest.list_price.toLocaleString()})`
      : 'No specific vehicle';

    const budgetContext = lead.budget_min && lead.budget_max
      ? `Budget: $${lead.budget_min.toLocaleString()}-$${lead.budget_max.toLocaleString()}`
      : 'Budget not specified';

    const matchingVehicles = availableInventory
      .filter(v => lead.budget_min && lead.budget_max && v.list_price >= lead.budget_min && v.list_price <= lead.budget_max)
      .slice(0, 3);

    const inventoryMatches = matchingVehicles.length > 0
      ? matchingVehicles.map(v => `${v.year} ${v.make} ${v.model} - $${v.list_price.toLocaleString()}`).join(', ')
      : 'None in budget';

    const prompt = `You are a sales rep at Road Runner Auto Sales.
Dealership locations:
- 31731 Michigan Avenue, Wayne, MI 48184
- 24560 Eureka Rd, Taylor, MI 48180

Lead: ${lead.first_name} ${lead.last_name}
Urgency: ${lead.urgency}
${vehicleContext}
${budgetContext}
Matches: ${inventoryMatches}
Notes: ${lead.vehicle_interest_notes || 'None'}

Generate 3 response styles as JSON:
{"quick": "2-3 sentences, action-focused", "detailed": "5-6 sentences, consultative", "promotional": "4-5 sentences, urgency + offers"}

Use ${lead.first_name}'s name. Be warm, professional. End with clear next step.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error('Failed to parse AI response');
    
    const parsed = JSON.parse(jsonMatch[0]);

    return [
      { style: 'quick', title: 'Quick & Professional', content: parsed.quick },
      { style: 'detailed', title: 'Detailed & Consultative', content: parsed.detailed },
      { style: 'promotional', title: 'Promotional', content: parsed.promotional },
    ];
  } catch (error) {
    console.error('AI error:', error);
    return getFallbackResponses(lead, vehicleOfInterest);
  }
}

export function calculateLeadScore(lead: Lead, inventory: Vehicle[] = []): number {
  let score = 50;

  // Urgency
  if (lead.urgency === 'high') score += 25;
  else if (lead.urgency === 'medium') score += 15;
  else score += 5;

  // Budget match
  if (lead.budget_min && lead.budget_max) {
    const hasMatch = inventory.some(v => 
      v.status === 'available' && v.list_price >= lead.budget_min! && v.list_price <= lead.budget_max!
    );
    score += hasMatch ? 20 : 5;
  }

  // Engagement
  const noteLength = lead.vehicle_interest_notes?.length || 0;
  if (noteLength > 100) score += 15;
  else if (noteLength > 50) score += 10;
  else if (noteLength > 0) score += 5;

  // Trade-in
  if (lead.has_trade_in) score += 10;

  // Source
  const sourceScores: Record<string, number> = {
    website_form: 10, phone: 8, facebook: 6, email: 6, sms: 5, walk_in: 9
  };
  score += sourceScores[lead.source] || 0;

  // Contact info
  if (lead.email) score += 5;
  if (lead.phone) score += 5;

  // Response time
  if (!lead.first_contact_at) {
    const mins = (Date.now() - new Date(lead.created_at).getTime()) / 60000;
    if (mins < 5) score += 10;
    else if (mins < 30) score += 5;
    else if (mins < 60) score += 2;
  }

  return Math.min(Math.max(score, 0), 100);
}

function getFallbackResponses(lead: Lead, vehicle?: Vehicle): AIResponse[] {
  const name = lead.first_name;
  const veh = vehicle ? `the ${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'our vehicles';

  return [
    {
      style: 'quick',
      title: 'Quick & Professional',
      content: `Hi ${name}! Thanks for your interest in ${veh}. When is a good time for a call or dealership visit? - Road Runner Auto Sales`
    },
    {
      style: 'detailed',
      title: 'Detailed & Consultative',
      content: `Hi ${name}, thank you for reaching out about ${veh}! At Road Runner Auto Sales, we specialize in quality pre-owned vehicles. I'd love to learn more about what you're looking for and show you options in your price range. Schedule a test drive? I'm available at your convenience!`
    },
    {
      style: 'promotional',
      title: 'Promotional',
      content: `Hi ${name}! Great timing - we can help with online pre-approval, trade-ins, and fast financing options. ${veh} is currently available. Want me to reserve a test drive slot this week?`
    }
  ];
}

export function isAIConfigured(): boolean {
  return !!import.meta.env.VITE_GEMINI_API_KEY;
}

// ─── ARIA: Inbox Reply Generator ──────────────────────────────────────────────

export interface InboxReplyContext {
  leadFirstName: string;
  clickedVehicle?: string;
  sessionSource?: string;
  lastInboundMessage?: string;
  location: string;
}

export async function generateInboxReply(ctx: InboxReplyContext): Promise<string> {
  if (!genAI) {
    return `Thanks ${ctx.leadFirstName}. I saw your inquiry${ctx.clickedVehicle ? ` on the ${ctx.clickedVehicle}` : ''}. I can hold two matching options at our ${ctx.location.toUpperCase()} location and get you approved quickly. Is 5:30 PM or 6:15 PM better today?`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are a sales rep at Road Runner Auto Sales (Wayne & Taylor, MI).
Customer: ${ctx.leadFirstName}
Their last message: "${ctx.lastInboundMessage ?? 'Interested in a vehicle'}"
Vehicle they viewed: ${ctx.clickedVehicle ?? 'not specified'}
How they contacted us: ${ctx.sessionSource ?? 'web'}
Location: ${ctx.location}

Write a single warm, confident SMS reply under 160 characters. Include their first name, reference the vehicle if known, and end with a specific appointment time offer (two time options). No emojis. No hashtags. Sound like a real salesperson, not a bot.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('[ARIA generateInboxReply error]', err);
    return `Thanks ${ctx.leadFirstName}! I'd love to get you into ${ctx.clickedVehicle ?? 'something great'}. Is 5:30 PM or 6:15 PM better for a test drive today?`;
  }
}

// ─── ARIA: Lead Intent Classifier ────────────────────────────────────────────

export type LeadIntentCategory = 'test_drive' | 'pricing' | 'trade_in' | 'financing' | 'general';

export interface LeadIntentResult {
  category: LeadIntentCategory;
  label: string;
  emoji: string;
}

export async function classifyLeadIntent(message: string): Promise<LeadIntentResult> {
  const fallback = (category: LeadIntentCategory): LeadIntentResult => {
    const map: Record<LeadIntentCategory, { label: string; emoji: string }> = {
      test_drive: { label: 'Test Drive', emoji: '🚗' },
      pricing: { label: 'Pricing', emoji: '💰' },
      trade_in: { label: 'Trade-In', emoji: '🔄' },
      financing: { label: 'Financing', emoji: '💳' },
      general: { label: 'General', emoji: '💬' },
    };
    return { category, ...map[category] };
  };

  // Quick keyword classification (no API call needed for these signals)
  const lower = message.toLowerCase();
  if (/test.?drive|come in|appointment|visit|stop by|schedule/.test(lower)) return fallback('test_drive');
  if (/trade.?in|trade in|my car|current vehicle|worth/.test(lower)) return fallback('trade_in');
  if (/financ|loan|monthly|payment|credit|pre.?approv/.test(lower)) return fallback('financing');
  if (/price|cost|how much|deal|discount|obo|negotiat/.test(lower)) return fallback('pricing');

  if (!genAI) return fallback('general');

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(
      `Classify this automotive customer message into exactly one category: test_drive, pricing, trade_in, financing, or general.\nMessage: "${message}"\nReply with only the category word, nothing else.`,
    );
    const raw = result.response.text().trim().toLowerCase() as LeadIntentCategory;
    const valid: LeadIntentCategory[] = ['test_drive', 'pricing', 'trade_in', 'financing', 'general'];
    return fallback(valid.includes(raw) ? raw : 'general');
  } catch (err) {
    console.error('[ARIA classifyLeadIntent error]', err);
    return fallback('general');
  }
}

// ─── ARIA: AI Call Summary Generator ─────────────────────────────────────────

export async function generateAICallSummary(
  leadFirstName: string,
  vehicle: string,
  outcome: string,
  durationSeconds: number,
): Promise<string> {
  if (!genAI) {
    return `Called ${leadFirstName} regarding ${vehicle}. Call ${outcome} — ${Math.round(durationSeconds / 60)} min. Follow up with appointment confirmation.`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Write a realistic 1-2 sentence call summary for an automotive sales rep.
Customer: ${leadFirstName}
Vehicle discussed: ${vehicle}
Call outcome: ${outcome}
Call duration: ${Math.round(durationSeconds / 60)} minutes

Sound like a real CRM note a salesperson would write. Be specific — mention something like payment comfort, trade-in discussion, or appointment confirmation. Under 60 words.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('[ARIA generateAICallSummary error]', err);
    return `Called ${leadFirstName} about the ${vehicle}. Call ${outcome} (${Math.round(durationSeconds / 60)} min). Notes saved — follow up action required.`;
  }
}

// ─── ARIA: Review Response Generator ─────────────────────────────────────────

export async function generateReviewResponse(
  reviewText: string,
  rating: number,
  reviewerName: string,
): Promise<string> {
  if (!genAI) {
    if (rating >= 4) {
      return `Thank you so much ${reviewerName}! We're thrilled to hear about your experience at Road Runner Auto Sales. We look forward to seeing you again!`;
    }
    return `Hi ${reviewerName}, thank you for your honest feedback. We're sorry your experience wasn't perfect — please reach out to us directly at 734-722-9500 and we'd love to make it right.`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Write a professional response from the manager of Road Runner Auto Sales to this ${rating}-star Google review.
Reviewer: ${reviewerName}
Review: "${reviewText}"
Rating: ${rating} out of 5 stars

Rules:
- Sound like a real dealership manager, not corporate
- If 4-5 stars: thank them warmly and reinforce the positive
- If 1-3 stars: acknowledge the issue, apologize sincerely, offer to resolve directly, give phone number 734-722-9500
- Under 80 words
- Do not be sycophantic or use the phrase "valued customer"`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('[ARIA generateReviewResponse error]', err);
    return rating >= 4
      ? `Thank you ${reviewerName}! That means a lot to the whole team. We hope to see you again at Road Runner!`
      : `Hi ${reviewerName}, we're sorry to hear about your experience. Please call us at 734-722-9500 — we'd like to make this right.`;
  }
}

// ─── ARIA: SMS Campaign Copy Generator ───────────────────────────────────────

export interface CampaignCopyResult {
  message: string;
  charCount: number;
  sendTimeSuggestion: string;
}

export async function generateCampaignCopy(
  targetAudience: string,
  vehicleSpotlight: string,
  campaignGoal: string,
): Promise<CampaignCopyResult> {
  const fallback = (): CampaignCopyResult => ({
    message: `Hey [First Name], Road Runner Auto Sales here. We have a ${vehicleSpotlight} that matches what you were looking for. Reply YES to grab a spot this week — limited availability.`,
    charCount: 0,
    sendTimeSuggestion: 'Tuesday–Thursday, 10am–12pm (highest open rates)',
  });

  if (!genAI) return fallback();

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Write an SMS campaign message for an automotive dealership.
Target audience: ${targetAudience}
Vehicle spotlight: ${vehicleSpotlight}
Campaign goal: ${campaignGoal}
Dealership: Road Runner Auto Sales (Wayne & Taylor, Michigan)

Rules:
- Use [First Name] as the personalization token
- Maximum 155 characters (strict)
- Sound conversational and urgent, not spammy
- Include a clear action (reply YES, call us, visit this weekend)
- No hashtags, no emojis, no all-caps words

Reply with ONLY the message text, nothing else.`;

    const result = await model.generateContent(prompt);
    const message = result.response.text().trim().slice(0, 155);
    return {
      message,
      charCount: message.length,
      sendTimeSuggestion: 'Tuesday–Thursday, 10am–12pm (highest open rates)',
    };
  } catch (err) {
    console.error('[ARIA generateCampaignCopy error]', err);
    return fallback();
  }
}

// ─── ARIA: Trade-In Estimator ─────────────────────────────────────────────────

export interface TradeInEstimate {
  low: number;
  high: number;
  reasoning: string;
}

export async function generateTradeInEstimate(
  year: number,
  make: string,
  model: string,
  mileage: number,
  condition: 'excellent' | 'good' | 'fair' | 'poor',
): Promise<TradeInEstimate> {
  const fallback = (): TradeInEstimate => ({
    low: 4500,
    high: 9500,
    reasoning: 'Estimate based on Michigan market averages for this vehicle class and mileage range.',
  });

  if (!genAI) return fallback();

  try {
    const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Estimate the trade-in value range for this vehicle at a Michigan used car dealership.
Vehicle: ${year} ${make} ${model}
Mileage: ${mileage.toLocaleString()} miles
Condition: ${condition}

Provide a realistic dealer trade-in offer range (not retail value).
Reply with JSON only in this exact format:
{"low": 8500, "high": 11200, "reasoning": "One short sentence about key value factors"}`;

    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback();
    const parsed = JSON.parse(jsonMatch[0]) as TradeInEstimate;
    return { low: Number(parsed.low), high: Number(parsed.high), reasoning: String(parsed.reasoning) };
  } catch (err) {
    console.error('[ARIA generateTradeInEstimate error]', err);
    return fallback();
  }
}

// ─── ARIA: AI Assistant Chat (Jerry equivalent) ───────────────────────────────

export interface ARIAMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function chatWithARIA(
  messages: ARIAMessage[],
  inventorySummary: string,
): Promise<string> {
  const systemInstruction = `You are ARIA, the friendly AI sales assistant for Road Runner Auto Sales.
Locations: 31731 Michigan Ave, Wayne MI 48184 | 24560 Eureka Rd, Taylor MI 48180
Phone: 734-722-9500
Hours: Mon-Sat 9am-7pm, Sun Closed
Current inventory: ${inventorySummary}
Financing: In-house financing, all credit types accepted, same-day approval.
Trade-ins: We accept all trade-ins with a free appraisal.

Your role: Help customers find vehicles, answer questions, schedule test drives, estimate trade-ins.
Style: Warm, conversational, specific. Keep responses concise (2-3 sentences max). Always end with a clear next step or question.
If asked casual things like "hey" or "what can you do" — introduce yourself warmly and list 3-4 things you can help with.
Never make up prices not in inventory. Never promise things outside your knowledge.`;

  // Separate history from the latest user message
  const history = messages.slice(0, -1);
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage || lastMessage.role !== 'user') {
    return "What can I help you find today?";
  }

  if (!genAI) {
    // Context-aware fallbacks
    const text = lastMessage.content.toLowerCase();
    if (/hey|hi|hello|heyy/.test(text)) return "Hey! I'm ARIA, Road Runner's AI assistant. I can help you find a vehicle, check inventory, estimate your trade-in, or answer financing questions — what are you looking for?";
    if (/what.*do|what.*can|idk|help/.test(text)) return "Great question! I can search our inventory by budget or type, give you a trade-in estimate, explain financing options, or book you a test drive. Where should we start?";
    return "I'd love to help! Tell me what kind of vehicle you're looking for — budget, type, or any specific features — and I'll find the best match in our inventory.";
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction,
    });

    // Build proper chat history (all messages except the last user message)
    const chatHistory = history.map((m) => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(lastMessage.content);
    return result.response.text().trim();
  } catch (err) {
    console.error('[ARIA chatWithARIA error]', err);
    return "I hit a quick snag — try again in a moment and I'll get right back to you!";
  }
}
