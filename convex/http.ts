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

http.route({
  path: '/api/leads/intake',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const payload = (await readJson(req)) as any;
    const result = await ctx.runMutation(api.leads.intakeLead, payload);
    return Response.json(result);
  }),
});

http.route({
  path: '/api/comms/inbound/sms',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const payload = (await readJson(req)) as any;
    const result = await ctx.runMutation(api.conversations.ingestInboundSms, payload);
    return Response.json(result);
  }),
});

http.route({
  path: '/api/comms/inbound/call',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const payload = (await readJson(req)) as any;
    const result = await ctx.runMutation(api.conversations.ingestInboundCall, payload);
    return Response.json(result);
  }),
});

http.route({
  path: '/api/appointments/book',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const payload = (await readJson(req)) as any;
    const result = await ctx.runMutation(api.appointments.book, payload);
    return Response.json(result);
  }),
});

http.route({
  path: '/api/workflows/execute',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const payload = (await readJson(req)) as any;
    const result = await ctx.runMutation(api.workflows.execute, payload);
    return Response.json(result);
  }),
});

http.route({
  path: '/api/reputation/request',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const payload = (await readJson(req)) as any;
    const result = await ctx.runMutation(api.reputation.requestReview, payload);
    return Response.json(result);
  }),
});

http.route({
  path: '/api/finance/start',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const payload = (await readJson(req)) as any;
    const result = await ctx.runMutation(api.finance.startJourney, payload);
    return Response.json(result);
  }),
});

export default http;
