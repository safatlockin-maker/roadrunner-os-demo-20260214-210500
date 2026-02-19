import { mutation } from './_generated/server';
import { v } from 'convex/values';

function normalizePhone(value?: string): string | undefined {
  return value ? value.replace(/\D/g, '') : undefined;
}

export const startSession = mutation({
  args: {
    lead_id: v.optional(v.id('leads')),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    session_source: v.string(),
    page_url: v.string(),
    clicked_vehicle: v.optional(v.string()),
    utm_source: v.optional(v.string()),
    utm_campaign: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const normalizedPhone = normalizePhone(args.phone);

    let leadId = args.lead_id;

    if (!leadId && normalizedPhone) {
      const lead = await ctx.db
        .query('leads')
        .withIndex('by_phone', (q) => q.eq('phone', normalizedPhone))
        .first();
      leadId = lead?._id;
    }

    const threadId = `thread-${Date.now()}`;
    const sessionId = await ctx.db.insert('chatSessions', {
      threadId,
      leadId,
      phone: normalizedPhone,
      location: args.location ?? 'wayne',
      sessionSource: args.session_source,
      pageUrl: args.page_url,
      clickedVehicle: args.clicked_vehicle,
      utmSource: args.utm_source,
      utmCampaign: args.utm_campaign,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    return {
      session_id: sessionId,
      thread_id: threadId,
      created_at: now,
    };
  },
});

export const appendMessage = mutation({
  args: {
    session_id: v.id('chatSessions'),
    direction: v.string(),
    channel: v.string(),
    body: v.string(),
    ai_assist_used: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.session_id);
    if (!session) {
      return { stored: false, event_id: 'missing-session', created_at: new Date().toISOString() };
    }

    const now = new Date().toISOString();
    const eventId = await ctx.db.insert('chatEvents', {
      sessionId: args.session_id,
      threadId: session.threadId,
      leadId: session.leadId,
      direction: args.direction,
      channel: args.channel,
      body: args.body,
      aiAssistUsed: args.ai_assist_used,
      createdAt: now,
    });

    await ctx.db.patch(args.session_id, {
      updatedAt: now,
    });

    return {
      stored: true,
      event_id: eventId,
      created_at: now,
    };
  },
});
