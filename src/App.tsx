import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import Inventory from './pages/Inventory';
import Hero from './pages/Hero';
import Inbox from './pages/Inbox';
import Opportunities from './pages/Opportunities';
import Appointments from './pages/Appointments';
import Automations from './pages/Automations';
import Reputation from './pages/Reputation';
import Reports from './pages/Reports';
import AIAssistant from './pages/AIAssistant';
import Campaigns from './pages/Campaigns';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/hero" element={<Hero />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/automations" element={<Automations />} />
          <Route path="/reputation" element={<Reputation />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/campaigns" element={<Campaigns />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

export default App;
