import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const startJourney = mutation({
  args: {
    lead_id: v.id('leads'),
    location: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const financeId = await ctx.db.insert('financeApplications', {
      leadId: args.lead_id,
      status: 'started',
      completionPercent: 10,
      missingItems: ['Driver license', 'Proof of income', 'Proof of residence'],
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(financeId);
  },
});
