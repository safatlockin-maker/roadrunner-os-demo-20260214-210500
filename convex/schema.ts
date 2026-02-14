import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  leads: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    source: v.string(),
    message: v.optional(v.string()),
    status: v.string(),
    leadScore: v.number(),
    locationIntent: v.string(),
    pageUrl: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    clickedVehicle: v.optional(v.string()),
    consentSms: v.optional(v.boolean()),
    consentPhone: v.optional(v.boolean()),
    firstContactAt: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_phone', ['phone'])
    .index('by_email', ['email'])
    .index('by_created', ['createdAt']),

  conversations: defineTable({
    leadId: v.id('leads'),
    channel: v.string(),
    direction: v.string(),
    body: v.string(),
    templateKey: v.optional(v.string()),
    aiAssistUsed: v.optional(v.boolean()),
    createdAt: v.string(),
  }).index('by_lead', ['leadId']),

  callEvents: defineTable({
    leadId: v.id('leads'),
    direction: v.string(),
    outcome: v.string(),
    durationSeconds: v.number(),
    createdAt: v.string(),
  }).index('by_lead', ['leadId']),

  opportunities: defineTable({
    leadId: v.id('leads'),
    title: v.string(),
    stage: v.string(),
    expectedValue: v.number(),
    location: v.string(),
    assignedRep: v.string(),
    nextAction: v.string(),
    checklist: v.object({
      quoteShared: v.boolean(),
      docsRequested: v.boolean(),
      consentVerified: v.boolean(),
    }),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_stage', ['stage'])
    .index('by_lead', ['leadId']),

  appointments: defineTable({
    leadId: v.id('leads'),
    location: v.string(),
    vehicleLabel: v.string(),
    startsAt: v.string(),
    status: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_start', ['startsAt'])
    .index('by_lead', ['leadId']),

  financeApplications: defineTable({
    leadId: v.id('leads'),
    status: v.string(),
    completionPercent: v.number(),
    missingItems: v.array(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index('by_lead', ['leadId']),

  reviewRequests: defineTable({
    leadId: v.id('leads'),
    channel: v.string(),
    status: v.string(),
    sentAt: v.optional(v.string()),
    completedAt: v.optional(v.string()),
    suppressionReason: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index('by_lead', ['leadId']),

  workflowRuns: defineTable({
    workflowKey: v.string(),
    leadId: v.optional(v.id('leads')),
    status: v.string(),
    detail: v.optional(v.string()),
    createdAt: v.string(),
  }).index('by_workflow', ['workflowKey']),
});
