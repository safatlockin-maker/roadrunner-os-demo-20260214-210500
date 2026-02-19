import { mutation } from './_generated/server';
import { v } from 'convex/values';

function normalizePhone(value?: string): string | undefined {
  return value ? value.replace(/\D/g, '') : undefined;
}

function normalizeEmail(value?: string): string | undefined {
  return value?.trim().toLowerCase();
}

export const importPodium = mutation({
  args: {
    source: v.string(),
    records: v.array(
      v.object({
        podium_contact_id: v.string(),
        first_name: v.string(),
        last_name: v.string(),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        stage: v.optional(v.string()),
        last_message_at: v.optional(v.string()),
        location: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    let imported = 0;
    let duplicates = 0;

    const mappings: Array<{
      id: string;
      podium_contact_id: string;
      roadrunner_lead_id: string;
      confidence: number;
      source: 'csv' | 'webhook';
      created_at: string;
    }> = [];

    for (const record of args.records) {
      const normalizedPhone = normalizePhone(record.phone);
      const normalizedEmail = normalizeEmail(record.email);

      let lead = null;

      if (normalizedPhone) {
        lead = await ctx.db
          .query('leads')
          .withIndex('by_phone', (q) => q.eq('phone', normalizedPhone))
          .first();
      }

      if (!lead && normalizedEmail) {
        lead = await ctx.db
          .query('leads')
          .withIndex('by_email', (q) => q.eq('email', normalizedEmail))
          .first();
      }

      if (!lead) {
        const leadId = await ctx.db.insert('leads', {
          firstName: record.first_name,
          lastName: record.last_name,
          email: normalizedEmail,
          phone: normalizedPhone,
          source: 'podium_migration',
          status: record.stage ?? 'contacted',
          leadScore: 65,
          locationIntent: record.location ?? 'wayne',
          createdAt: now,
          updatedAt: now,
          message: 'Imported from Podium parallel-run dataset',
        });

        lead = await ctx.db.get(leadId);
        imported += 1;
      } else {
        duplicates += 1;
      }

      if (!lead) continue;

      const mappingId = await ctx.db.insert('migrationMappings', {
        podiumContactId: record.podium_contact_id,
        leadId: lead._id,
        confidence: 0.9,
        source: args.source,
        createdAt: now,
      });

      mappings.push({
        id: mappingId,
        podium_contact_id: record.podium_contact_id,
        roadrunner_lead_id: lead._id,
        confidence: 0.9,
        source: args.source === 'webhook' ? 'webhook' : 'csv',
        created_at: now,
      });
    }

    await ctx.db.insert('migrationAuditEvents', {
      source: args.source,
      imported,
      duplicates,
      detail: `Processed ${args.records.length} Podium records`,
      createdAt: now,
    });

    return {
      imported,
      duplicates,
      mappings,
    };
  },
});
