import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const sendSms = mutation({
  args: {
    lead_id: v.id('leads'),
    body: v.string(),
    template_key: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const outboundEventId = await ctx.db.insert('outboundEvents', {
      leadId: args.lead_id,
      channel: 'sms',
      eventType: 'sms_outbound',
      body: args.body,
      templateKey: args.template_key,
      status: 'queued',
      createdAt: now,
    });

    await ctx.db.insert('deliveryReceipts', {
      outboundEventId,
      providerMessageId: `sim-${Date.now()}`,
      status: 'queued',
      createdAt: now,
    });

    return {
      queued: true,
      event_id: outboundEventId,
      delivery_status: 'queued',
    };
  },
});

export const sendReviewInvite = mutation({
  args: {
    lead_id: v.id('leads'),
    channel: v.string(),
    review_link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const reviewRequestId = await ctx.db.insert('reviewRequests', {
      leadId: args.lead_id,
      channel: args.channel,
      status: 'sent',
      sentAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const body = args.review_link
      ? `Thanks for buying with Roadrunner. Please share your review: ${args.review_link}`
      : 'Thanks for buying with Roadrunner. Please share your review with us.';

    const outboundEventId = await ctx.db.insert('outboundEvents', {
      leadId: args.lead_id,
      channel: args.channel,
      eventType: 'review_invite',
      body,
      status: 'queued',
      createdAt: now,
    });

    await ctx.db.insert('deliveryReceipts', {
      outboundEventId,
      providerMessageId: `review-${Date.now()}`,
      status: 'queued',
      createdAt: now,
    });

    return {
      queued: true,
      event_id: outboundEventId,
      review_request_id: reviewRequestId,
    };
  },
});

export const callSummary = mutation({
  args: {
    lead_id: v.id('leads'),
    summary: v.string(),
    outcome: v.optional(v.string()),
    duration_seconds: v.optional(v.number()),
    follow_up_action: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const eventId = await ctx.db.insert('outboundEvents', {
      leadId: args.lead_id,
      channel: 'phone',
      eventType: 'call_summary',
      body: JSON.stringify({
        summary: args.summary,
        outcome: args.outcome,
        duration_seconds: args.duration_seconds,
        follow_up_action: args.follow_up_action,
      }),
      status: 'stored',
      createdAt: now,
    });

    return {
      stored: true,
      event_id: eventId,
    };
  },
});
