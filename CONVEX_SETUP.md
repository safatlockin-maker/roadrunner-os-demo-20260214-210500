# Convex Setup Guide (Roadrunner OS)

This app now supports a Convex-first backend workflow for the Roadrunner OS demo.

## 1) Create and Link Convex Project
```bash
cd automotive-hero
npm run convex:dev
```

The CLI will guide you through:
- authentication
- project creation/linking
- initial deployment

## 2) Add Environment Variables
Copy `.env.example` to `.env` and fill:

```bash
VITE_CONVEX_URL=your_convex_deployment_url
VITE_CONVEX_SITE_URL=your_convex_site_url
VITE_GEMINI_API_KEY=your_gemini_api_key
```

Notes:
- `VITE_CONVEX_URL` is used by the React Convex client provider.
- `VITE_CONVEX_SITE_URL` is used by HTTP endpoint calls:
  - `/api/leads/intake`
  - `/api/comms/inbound/sms`
  - `/api/comms/inbound/call`
  - `/api/appointments/book`
  - `/api/workflows/execute`
  - `/api/reputation/request`
  - `/api/finance/start`

## 3) Keep Convex Dev Running (During Local Demo)
In one terminal:
```bash
npm run convex:dev
```

In another terminal:
```bash
npm run dev
```

## 4) Verify Demo
Open:
- `http://localhost:5180/dashboard`
- `http://localhost:5180/inbox`
- `http://localhost:5180/opportunities`
- `http://localhost:5180/appointments`
- `http://localhost:5180/automations`
- `http://localhost:5180/reputation`
- `http://localhost:5180/reports`

If Convex is not configured, the app still works in fallback demo mode.
