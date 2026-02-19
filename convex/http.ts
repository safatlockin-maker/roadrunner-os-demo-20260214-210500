import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { api } from './_generated/api';

const http = httpRouter();

async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function asPayload<T>(input: unknown): T {
  return input as T;
}

http.route({
  path: '/api/leads/intake',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const payload = asPayload<unknown>(await readJson(req));
    const result = await ctx.runMutation(api.leads.intakeLead, payload);
    return Response.json(result);
  }),
});

http.route({
  path: '/api/comms/inbound/sms',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const payload = asPayload<unknown>(await readJson(req));
    const result = await ctx.runMutation(api.conversations.ingestInboundSms, payload);
    return Response.json(result);
  }),
});

http.route({
  path: '/api/comms/inbound/call',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const payload = asPayload<unknown>(await readJson(req));
    const result = await ctx.runMutation(api.conversations.ingestInboundCall, payload);
    return Response.json(result);
  }),
});

http.route({
  path: '/api/appointments/book',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const payload = asPayload<unknown>(await readJson(req));
    const result = await ctx.runMutation(api.appointments.book, payload);
    return Response.json(result);
  }),
});

http.route({
  path: '/api/workflows/execute',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const payload = asPayload<unknown>(await readJson(req));
    const result = await ctx.runMutation(api.workflows.execute, payload);
    return Response.json(result);
  }),
});

http.route({
  path: '/api/reputation/request',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const payload = asPayload<unknown>(await readJson(req));
    const result = await ctx.runMutation(api.reputation.requestReview, payload);
    return Response.json(result);
  }),
});

http.route({
  path: '/api/finance/start',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const payload = asPayload<unknown>(await readJson(req));
    const result = await ctx.runMutation(api.finance.startJourney, payload);
    return Response.json(result);
  }),
});

http.route({
  path: '/api/chat/session/start',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const payload = asPayload<unknown>(await readJson(req));
    const result = await ctx.runMutation(api.chat.startSession, payload);
    return Response.json(result);
  }),
});

http.route({
  path: '/api/chat/message',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const payload = asPayload<unknown>(await readJson(req));
    const result = await ctx.runMutation(api.chat.appendMessage, payload);
    return Response.json(result);
  }),
});

http.route({
  path: '/api/comms/outbound/sms',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const payload = asPayload<unknown>(await readJson(req));
    const result = await ctx.runMutation(api.outbound.sendSms, payload);
    return Response.json(result);
  }),
});

http.route({
  path: '/api/comms/outbound/review-invite',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const payload = asPayload<unknown>(await readJson(req));
    const result = await ctx.runMutation(api.outbound.sendReviewInvite, payload);
    return Response.json(result);
  }),
});

http.route({
  path: '/api/comms/call-summary',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const payload = asPayload<unknown>(await readJson(req));
    const result = await ctx.runMutation(api.outbound.callSummary, payload);
    return Response.json(result);
  }),
});

http.route({
  path: '/api/migration/podium-import',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const payload = asPayload<unknown>(await readJson(req));
    const result = await ctx.runMutation(api.migration.importPodium, payload);
    return Response.json(result);
  }),
});

http.route({
  path: '/api/scorecard/parallel-run',
  method: 'GET',
  handler: httpAction(async (ctx) => {
    const result = await ctx.runQuery(api.scorecard.parallelRun, {});
    return Response.json(result);
  }),
});

export default http;
