# 🚗 Road Runner Auto Sales CRM

A modern, AI-powered CRM built specifically for automotive dealerships.

## ✅ What's Built

### Core Features
- ✅ **Dashboard** with real-time KPI metrics
- ✅ **Lead Inbox** with smart scoring (0-100)
- ✅ **AI Response Generator** (3 styles: Quick, Detailed, Promotional)
- ✅ **Lead Detail Modal** with full customer info
- ✅ **Demo Data**: 18 real inventory examples + 25 realistic lead scenarios
- ✅ **Type-Safe**: 100% TypeScript with Zod validation
- ✅ **Modern UI**: Tailwind CSS with automotive branding
- ✅ **Roadrunner OS surfaces**: `/inbox`, `/opportunities`, `/appointments`, `/automations`, `/reputation`, `/reports`
- ✅ **Native automation service layer** for:
  - lead intake (`POST /api/leads/intake`)
  - inbound sms/call events (`POST /api/comms/inbound/sms`, `POST /api/comms/inbound/call`)
  - appointments/workflows/reputation/finance endpoints
- ✅ **Convex backend scaffold** for opportunities, appointments, workflows, consent, finance, and reputation events

### Tech Stack
- React 19 + TypeScript
- Vite (build tool)
- React Router (navigation)
- TanStack Query (data fetching)
- Gemini AI (response generation)
- Convex (database + realtime backend)
- Lucide Icons + Tailwind CSS

## 🚀 Quick Start

### 1. Run the App (Demo Mode)
```bash
cd automotive-hero
npm run dev
```
The app will open at **http://localhost:5180**

Roadrunner OS routes:
- `http://localhost:5180/inbox`
- `http://localhost:5180/opportunities`
- `http://localhost:5180/appointments`
- `http://localhost:5180/automations`
- `http://localhost:5180/reputation`
- `http://localhost:5180/reports`

### 2. Add Your API Keys (Optional)
Edit `.env` file:
```bash
# For AI responses (get from https://aistudio.google.com/app/apikey)
VITE_GEMINI_API_KEY=your_actual_key_here

# Convex backend
VITE_CONVEX_URL=your_convex_deployment_url
VITE_CONVEX_SITE_URL=your_convex_site_url
```

### 3. Set Up Convex (Optional, Recommended)
1. Create Convex project and link this repo.
2. Run `npm run convex:dev`.
3. Copy the Convex deployment URL + site URL into `.env`.
4. Restart app.

**Without Convex**: App works with demo data!
**With Gemini API**: Get AI-generated responses!

### Optional: Embed Lead Intake Widget on Existing Site
This repo includes a native embeddable widget:
- `public/roadrunner-intake-widget.js`

Embed snippet:
```html
<script>
  window.RoadrunnerIntakeWidget = {
    apiBase: "https://your-api-domain.com",
    buttonLabel: "Get Pre-Approved"
  };
</script>
<script src="https://your-app-domain.com/roadrunner-intake-widget.js" defer></script>
```

## 📊 Demo Data

The app includes:
- **18 Vehicles** (real inventory snapshots from Road Runner listings)
- **25+ Leads** (hot leads, active shoppers, won/lost deals)
- **3 Sales Reps** with performance metrics

All working out of the box!

## 🎯 Key Features Demo

### 1. Dashboard
- **4 KPI Cards**: New Leads, Hot Leads, Test Drives, Deals Closed
- **Lead Inbox**: Top 10 leads sorted by score
- **Real-time Metrics**: Updates as data changes

### 2. Lead Details (Click any lead)
- Full contact information
- Lead score (0-100) with AI calculation
- Budget, urgency, trade-in details
- Customer message/notes
- **AI Response Suggestions** (3 styles)
- One-click copy responses

### 3. AI Responses (Powered by Gemini)
Three generated responses per lead:
1. **Quick & Professional** - 2-3 sentences, action-focused
2. **Detailed & Consultative** - 5-6 sentences, rapport-building
3. **Promotional** - Urgency + special offers

**Fallback**: If no API key, uses template responses

## 📁 Project Structure

```
automotive-hero/
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── DashboardMetrics.tsx
│   │   │   ├── LeadInbox.tsx
│   │   │   └── LeadDetailModal.tsx
│   │   └── layout/
│   │       └── Layout.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Inbox.tsx
│   │   ├── Opportunities.tsx
│   │   ├── Appointments.tsx
│   │   ├── Automations.tsx
│   │   ├── Reputation.tsx
│   │   ├── Reports.tsx
│   │   ├── Leads.tsx
│   │   ├── Pipeline.tsx
│   │   └── Inventory.tsx
│   ├── services/
│   │   ├── aiService.ts
│   │   ├── roadrunnerOS.ts
│   │   └── roadrunnerConvex.ts
│   ├── types/
│   │   ├── lead.ts
│   │   ├── inventory.ts
│   │   ├── communication.ts
│   │   ├── salesRep.ts
│   │   └── roadrunnerOS.ts
│   ├── data/
│   │   ├── demoData.ts (18 vehicles, 25 leads)
│   │   ├── roadrunnerOSDemo.ts
│   │   └── websiteIntelligence.ts
│   └── App.tsx
├── convex/
│   ├── schema.ts
│   ├── leads.ts
│   ├── conversations.ts
│   ├── appointments.ts
│   ├── workflows.ts
│   ├── finance.ts
│   ├── reputation.ts
│   └── http.ts
├── public/
│   └── roadrunner-intake-widget.js
├── supabase-schema.sql (legacy schema reference)
├── CONVEX_SETUP.md
├── .env
└── package.json
```

## 🔥 What Makes This Special

1. **AI-Powered**: Gemini generates personalized responses in seconds
2. **Smart Lead Scoring**: Automatic 0-100 score based on:
   - Urgency level
   - Budget match with inventory
   - Engagement quality
   - Trade-in status
   - Response time
3. **Automotive-Specific**: Built for car dealerships, not generic CRM
4. **Demo-Ready**: Works immediately with realistic data
5. **Type-Safe**: Full TypeScript + Zod validation

## 📈 Next Steps

### Phase 1: Add Your Keys
- Get Gemini API key (free tier available)
- Test AI response generation

### Phase 2: Connect Convex
- Run `npm run convex:dev`
- Deploy convex functions and HTTP routes
- Add `VITE_CONVEX_URL` + `VITE_CONVEX_SITE_URL` to `.env`

### Phase 3: Deploy
```bash
npm run build
# Deploy to Vercel, Netlify, or any host
```

## 🎨 Branding

- **Colors**: Red (#DC2626) + Gray (#111827)
- **Fonts**: System fonts (fast loading)
- **Theme**: Automotive/Performance inspired

## 📞 Support

- Check `CONVEX_SETUP.md` for backend setup
- Check `PROGRESS.md` for full feature list
- All code is documented with comments

---

**Built with ❤️ for Road Runner Auto Sales**

Demo Mode: ✅ Ready to run!
AI Ready: ⚠️ Add Gemini API key
Database: ⚠️ Add Convex credentials (optional)
