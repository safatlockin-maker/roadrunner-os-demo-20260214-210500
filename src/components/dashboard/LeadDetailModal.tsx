import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Phone, Mail, MessageSquare, Sparkles, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { Lead } from '../../types/lead';
import type { AIResponse } from '../../services/aiService';
import { generateLeadResponses } from '../../services/aiService';
import { demoInventory } from '../../data/demoData';
import type { Vehicle } from '../../types/inventory';
import type { CommandAction } from '../../types/commandCenter';

interface LeadDetailModalProps {
  lead: Lead;
  onClose: () => void;
  recommendedAction?: CommandAction | null;
}

export default function LeadDetailModal({ lead, onClose, recommendedAction = null }: LeadDetailModalProps) {
  const [aiResponses, setAiResponses] = useState<AIResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const recommendedActionRef = useRef<HTMLDivElement | null>(null);

  const loadAIResponses = useCallback(async () => {
    setLoading(true);
    try {
      const responses = await generateLeadResponses(
        lead,
        undefined,
        demoInventory as Vehicle[]
      );
      setAiResponses(responses);
    } catch (error) {
      console.error('Failed to generate responses:', error);
      toast.error('Failed to generate AI responses');
    } finally {
      setLoading(false);
    }
  }, [lead]);

  useEffect(() => {
    void loadAIResponses();
  }, [loadAIResponses]);

  useEffect(() => {
    if (!recommendedAction || !recommendedActionRef.current) return;
    recommendedActionRef.current.focus();
  }, [recommendedAction]);

  const copyResponse = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Response copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {lead.first_name} {lead.last_name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">Lead Score: {lead.lead_score}/100</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {recommendedAction && (
            <div
              ref={recommendedActionRef}
              tabIndex={-1}
              className="rounded-lg border border-blue-300 bg-blue-50 p-4 outline-none"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Recommended Next Step</p>
              <p className="mt-1 text-lg font-semibold text-blue-900">{recommendedAction.actionLabel}</p>
              <p className="mt-1 text-sm text-blue-800">{recommendedAction.reason}</p>
              <p className="mt-1 text-xs text-blue-700">Priority Score: {recommendedAction.impactScore}</p>
            </div>
          )}

          {/* Contact Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {lead.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={16} className="text-gray-500" />
                  <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                    {lead.email}
                  </a>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={16} className="text-gray-500" />
                  <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                    {lead.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Lead Details */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Lead Details</h3>
            <div className="space-y-2 text-sm">
              <DetailRow label="Status" value={lead.status?.replace('_', ' ').toUpperCase() || 'N/A'} />
              <DetailRow label="Urgency" value={lead.urgency?.toUpperCase() || 'N/A'} />
              <DetailRow label="Source" value={lead.source || 'N/A'} />
              {lead.budget_min && lead.budget_max && (
                <DetailRow 
                  label="Budget" 
                  value={`$${lead.budget_min.toLocaleString()} - $${lead.budget_max.toLocaleString()}`} 
                />
              )}
              {lead.has_trade_in && (
                <DetailRow 
                  label="Trade-In" 
                  value={`${lead.trade_in_details?.year} ${lead.trade_in_details?.make} ${lead.trade_in_details?.model}`} 
                />
              )}
            </div>
          </div>

          {/* Notes */}
          {lead.vehicle_interest_notes && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MessageSquare size={18} />
                Customer Message
              </h3>
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
                "{lead.vehicle_interest_notes}"
              </div>
            </div>
          )}

          {/* AI Response Suggestions */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-yellow-500" />
              AI-Generated Response Suggestions
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-red-600"></div>
                <p className="text-sm text-gray-600 mt-3">Generating personalized responses...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {aiResponses.map((response, idx) => (
                  <AIResponseCard
                    key={idx}
                    response={response}
                    copied={copiedIndex === idx}
                    onCopy={() => copyResponse(response.content, idx)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium">
            <Phone size={18} className="inline mr-2" />
            Call Lead
          </button>
          <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
            <Mail size={18} className="inline mr-2" />
            Send Email
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center">
      <span className="font-medium text-gray-700 w-32">{label}:</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

interface AIResponseCardProps {
  response: AIResponse;
  copied: boolean;
  onCopy: () => void;
}

function AIResponseCard({ response, copied, onCopy }: AIResponseCardProps) {
  const colors = {
    quick: 'border-blue-200 bg-blue-50',
    detailed: 'border-green-200 bg-green-50',
    promotional: 'border-purple-200 bg-purple-50',
  };

  return (
    <div className={`border-2 ${colors[response.style]} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-900">{response.title}</h4>
        <button
          onClick={onCopy}
          className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition text-sm"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-600" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {response.content}
      </p>
    </div>
  );
}
