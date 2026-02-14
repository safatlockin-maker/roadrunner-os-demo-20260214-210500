import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const ingestInboundSms = mutation({
  args: {
    phone: v.string(),
    body: v.string(),
    received_at: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedPhone = args.phone.replace(/\D/g, '');
    const lead = await ctx.db
      .query('leads')
      .withIndex('by_phone', (q) => q.eq('phone', normalizedPhone))
      .first();

    if (!lead) {
      return { stored: false, trigger_workflow: 'no_lead_match' };
    }

    await ctx.db.insert('conversations', {
      leadId: lead._id,
      channel: 'sms',
      direction: 'inbound',
      body: args.body,
      createdAt: args.received_at,
    });

    await ctx.db.patch(lead._id, { updatedAt: new Date().toISOString() });
    return { stored: true, trigger_workflow: 'missed_call_text_back' };
  },
});

export const ingestInboundCall = mutation({
  args: {
    phone: v.string(),
    outcome: v.string(),
    duration_seconds: v.number(),
    received_at: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedPhone = args.phone.replace(/\D/g, '');
    const lead = await ctx.db
      .query('leads')
      .withIndex('by_phone', (q) => q.eq('phone', normalizedPhone))
      .first();

    if (!lead) {
      return { stored: false, missed_call_follow_up: false };
    }

    await ctx.db.insert('callEvents', {
      leadId: lead._id,
      direction: 'inbound',
      outcome: args.outcome,
      durationSeconds: args.duration_seconds,
      createdAt: args.received_at,
    });

    return {
      stored: true,
      missed_call_follow_up: args.outcome === 'missed',
    };
  },
});
