import { TrendingUp, AlertCircle, Calendar, DollarSign } from 'lucide-react';

interface DashboardMetricsProps {
  newLeads: number;
  hotLeads: number;
  testDrives: number;
  dealsValue: number;
}

export default function DashboardMetrics({ newLeads, hotLeads, testDrives, dealsValue }: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="New Leads"
        value={newLeads}
        subtitle="Today"
        icon={<TrendingUp className="text-blue-600" size={24} />}
        bgColor="bg-blue-50"
        trend="+20%"
      />
      <MetricCard
        title="Hot Leads"
        value={hotLeads}
        subtitle="⚠️ URGENT"
        icon={<AlertCircle className="text-red-600" size={24} />}
        bgColor="bg-red-50"
        highlight
      />
      <MetricCard
        title="Test Drives"
        value={testDrives}
        subtitle="Scheduled"
        icon={<Calendar className="text-green-600" size={24} />}
        bgColor="bg-green-50"
      />
      <MetricCard
        title="Deals Closed"
        value={`$${(dealsValue / 1000).toFixed(0)}k`}
        subtitle="Today"
        icon={<DollarSign className="text-purple-600" size={24} />}
        bgColor="bg-purple-50"
      />
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  bgColor: string;
  trend?: string;
  highlight?: boolean;
}

function MetricCard({ title, value, subtitle, icon, bgColor, trend, highlight }: MetricCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${highlight ? 'ring-2 ring-red-500' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`${bgColor} p-3 rounded-lg`}>
          {icon}
        </div>
        {trend && (
          <span className="text-sm font-medium text-green-600">{trend}</span>
        )}
      </div>
      <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}
