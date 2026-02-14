import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const requestReview = mutation({
  args: {
    lead_id: v.id('leads'),
    channel: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const requestId = await ctx.db.insert('reviewRequests', {
      leadId: args.lead_id,
      channel: args.channel,
      status: 'sent',
      sentAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(requestId);
  },
});
