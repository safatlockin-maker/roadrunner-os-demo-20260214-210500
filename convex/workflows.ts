import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const execute = mutation({
  args: {
    workflow_key: v.string(),
    lead_id: v.optional(v.id('leads')),
    context: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const runId = await ctx.db.insert('workflowRuns', {
      workflowKey: args.workflow_key,
      leadId: args.lead_id,
      status: 'queued',
      detail: args.context ? JSON.stringify(args.context) : 'Workflow queued',
      createdAt: new Date().toISOString(),
    });

    return await ctx.db.get(runId);
  },
});
