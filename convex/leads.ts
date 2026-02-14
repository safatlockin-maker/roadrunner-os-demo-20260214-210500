import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

function normalizePhone(value?: string): string | undefined {
  return value ? value.replace(/\D/g, '') : undefined;
}

function normalizeEmail(value?: string): string | undefined {
  return value?.trim().toLowerCase();
}

function inferLocation(pageUrl: string, locationIntent?: string): string {
  if (locationIntent) return locationIntent;
  return pageUrl.toLowerCase().includes('taylor') ? 'taylor' : 'wayne';
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('leads').collect();
  },
});

export const intakeLead = mutation({
  args: {
    first_name: v.string(),
    last_name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    source: v.string(),
    message: v.optional(v.string()),
    page_url: v.string(),
    utm_source: v.optional(v.string()),
    utm_campaign: v.optional(v.string()),
    clicked_vehicle: v.optional(v.string()),
    location_intent: v.optional(v.string()),
    consent_sms: v.optional(v.boolean()),
    consent_phone: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const normalizedPhone = normalizePhone(args.phone);
    const normalizedEmail = normalizeEmail(args.email);
    const now = new Date().toISOString();

    let existing = null;

    if (normalizedPhone) {
      existing = await ctx.db
        .query('leads')
        .withIndex('by_phone', (q) => q.eq('phone', normalizedPhone))
        .first();
    }

    if (!existing && normalizedEmail) {
      existing = await ctx.db
        .query('leads')
        .withIndex('by_email', (q) => q.eq('email', normalizedEmail))
        .first();
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        message: args.message ?? existing.message,
        source: args.source,
        pageUrl: args.page_url,
        utmSource: args.utm_source,
        utmCampaign: args.utm_campaign,
        clickedVehicle: args.clicked_vehicle,
        locationIntent: inferLocation(args.page_url, args.location_intent),
        updatedAt: now,
      });

      return {
        lead_id: existing._id,
        routed_location: inferLocation(args.page_url, args.location_intent),
        dedupe_match_id: existing._id,
        merge_suggestions: [],
        created_new_lead: false,
      };
    }

    const leadId = await ctx.db.insert('leads', {
      firstName: args.first_name,
      lastName: args.last_name,
      email: normalizeEmail(args.email),
      phone: normalizedPhone,
      source: args.source,
      message: args.message,
      status: 'new',
      leadScore: 65,
      locationIntent: inferLocation(args.page_url, args.location_intent),
      pageUrl: args.page_url,
      utmSource: args.utm_source,
      utmCampaign: args.utm_campaign,
      clickedVehicle: args.clicked_vehicle,
      consentSms: args.consent_sms,
      consentPhone: args.consent_phone,
      createdAt: now,
      updatedAt: now,
    });

    return {
      lead_id: leadId,
      routed_location: inferLocation(args.page_url, args.location_intent),
      dedupe_match_id: undefined,
      merge_suggestions: [],
      created_new_lead: true,
    };
  },
});
