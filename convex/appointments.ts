import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('appointments').withIndex('by_start').collect();
  },
});

export const book = mutation({
  args: {
    lead_id: v.id('leads'),
    location: v.string(),
    vehicle_label: v.string(),
    starts_at: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const appointmentId = await ctx.db.insert('appointments', {
      leadId: args.lead_id,
      location: args.location,
      vehicleLabel: args.vehicle_label,
      startsAt: args.starts_at,
      status: 'booked',
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(appointmentId);
  },
});
