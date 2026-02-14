import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Phone, Mail, TrendingUp, Clock } from 'lucide-react';
import type { Lead } from '../../types/lead';
import LeadDetailModal from './LeadDetailModal';

interface LeadInboxProps {
  leads: Lead[];
}

export default function LeadInbox({ leads }: LeadInboxProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Sort by score and created_at
  const sortedLeads = [...leads]
    .sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0))
    .slice(0, 10); // Show top 10

  return (
    <>
      <div className="divide-y divide-gray-200">
        {sortedLeads.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <p>No leads yet. Demo data will appear here.</p>
          </div>
        ) : (
          sortedLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => setSelectedLead(lead)}
            />
          ))
        )}
      </div>

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </>
  );
}

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
}

function LeadCard({ lead, onClick }: LeadCardProps) {
  const isHot = lead.urgency === 'high' && (lead.lead_score || 0) > 80;
  const timeAgo = lead.created_at ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true }) : '';

  return (
    <div
      onClick={onClick}
      className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition ${
        isHot ? 'bg-red-50 border-l-4 border-red-500' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        {/* Lead Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {lead.first_name} {lead.last_name}
            </h3>
            <LeadScoreBadge score={lead.lead_score || 50} />
            {isHot && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                🔥 HOT LEAD
              </span>
            )}
            <UrgencyBadge urgency={lead.urgency || 'medium'} />
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
            {lead.email && (
              <span className="flex items-center gap-1">
                <Mail size={14} />
                {lead.email}
              </span>
            )}
            {lead.phone && (
              <span className="flex items-center gap-1">
                <Phone size={14} />
                {lead.phone}
              </span>
            )}
          </div>

          {lead.vehicle_interest_notes && (
            <p className="text-sm text-gray-700 mb-2 line-clamp-2">
              {lead.vehicle_interest_notes}
            </p>
          )}

          {lead.budget_min && lead.budget_max && (
            <p className="text-sm text-gray-600">
              Budget: ${lead.budget_min.toLocaleString()} - ${lead.budget_max.toLocaleString()}
            </p>
          )}
        </div>

        {/* Status & Time */}
        <div className="text-right ml-4">
          <StatusBadge status={lead.status || 'new'} />
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1 justify-end">
            <Clock size={12} />
            {timeAgo}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Source: <span className="font-medium">{lead.source}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function LeadScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-100 text-green-800' : score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800';
  return (
    <span className={`px-2 py-1 ${color} text-xs font-bold rounded flex items-center gap-1`}>
      <TrendingUp size={12} />
      {score}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const colors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`px-2 py-1 ${colors[urgency as keyof typeof colors] || colors.medium} text-xs font-medium rounded`}>
      {urgency.toUpperCase()}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-purple-100 text-purple-700',
    interested: 'bg-green-100 text-green-700',
    test_drive: 'bg-orange-100 text-orange-700',
    negotiating: 'bg-yellow-100 text-yellow-700',
    financing_review: 'bg-indigo-100 text-indigo-700',
    closed_won: 'bg-green-600 text-white',
    closed_lost: 'bg-gray-400 text-white',
  };
  return (
    <span className={`px-3 py-1 ${colors[status as keyof typeof colors] || colors.new} text-xs font-medium rounded-full`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
}
