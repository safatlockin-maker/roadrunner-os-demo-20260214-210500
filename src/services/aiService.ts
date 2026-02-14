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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
