import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BadgeCheck,
  BarChart3,
  Bell,
  CalendarCheck2,
  Car,
  LayoutDashboard,
  MessageSquareText,
  Rows3,
  TrendingUp,
  Users,
  Workflow,
} from 'lucide-react';
import { dealershipInfo } from '../../data/dealershipInfo';

interface LayoutProps {
  children: ReactNode;
  variant?: 'default' | 'command-center';
  hideTopBar?: boolean;
}

const navItems: Array<{
  to: string;
  label: string;
  icon: ReactNode;
}> = [
  { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { to: '/inbox', icon: <MessageSquareText size={20} />, label: 'Inbox' },
  { to: '/opportunities', icon: <Rows3 size={20} />, label: 'Opportunities' },
  { to: '/appointments', icon: <CalendarCheck2 size={20} />, label: 'Appointments' },
  { to: '/automations', icon: <Workflow size={20} />, label: 'Automations' },
  { to: '/reputation', icon: <BadgeCheck size={20} />, label: 'Reputation' },
  { to: '/reports', icon: <BarChart3 size={20} />, label: 'Reports' },
  { to: '/leads', icon: <Users size={20} />, label: 'Leads' },
  { to: '/pipeline', icon: <TrendingUp size={20} />, label: 'Pipeline' },
  { to: '/inventory', icon: <Car size={20} />, label: 'Inventory' },
];

export default function Layout({ children, variant = 'default', hideTopBar = false }: LayoutProps) {
  const primaryLocation = dealershipInfo.locations[0];
  const commandCenterMode = variant === 'command-center';

  return (
    <div className={`flex h-screen ${commandCenterMode ? 'bg-[#060B1A]' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <aside
        className={`w-64 flex flex-col text-white ${
          commandCenterMode
            ? 'border-r border-[#1E2A4E] bg-[linear-gradient(180deg,#0B1531_0%,#081022_100%)]'
            : 'bg-gray-900'
        }`}
      >
        <div className={`p-6 ${commandCenterMode ? 'border-b border-[#1E2A4E]' : 'border-b border-gray-700'}`}>
          <h1 className={`text-2xl font-bold ${commandCenterMode ? 'text-[#E8EDFF]' : 'text-red-500'}`}>
            {dealershipInfo.name}
          </h1>
          <p className={`${commandCenterMode ? 'text-[#97A8CB]' : 'text-gray-400'} text-sm`}>{primaryLocation.address}</p>
          <p className={`${commandCenterMode ? 'text-[#97A8CB]' : 'text-gray-400'} text-sm`}>{primaryLocation.phone}</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4">
          {navItems.map((item) => (
            <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} variant={variant} />
          ))}
        </nav>

        <div className={`p-4 ${commandCenterMode ? 'border-t border-[#1E2A4E]' : 'border-t border-gray-700'}`}>
          <p className={`text-xs ${commandCenterMode ? 'text-[#7388B0]' : 'text-gray-500'}`}>
            Demo Mode - Using real dealership profile data
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${commandCenterMode ? 'bg-[#060B1A]' : ''}`}>
        {!hideTopBar && (
          <header
            className={`px-6 py-4 flex items-center justify-between ${
              commandCenterMode ? 'border-b border-[#1D2A4D] bg-[#090F22]' : 'bg-white border-b border-gray-200'
            }`}
          >
            <h2 className={`text-xl font-semibold ${commandCenterMode ? 'text-[#E8EEFF]' : 'text-gray-800'}`}>
              CRM Dashboard
            </h2>
            <button
              className={`relative p-2 rounded-lg ${
                commandCenterMode ? 'hover:bg-[#19294E]' : 'hover:bg-gray-100'
              }`}
            >
              <Bell size={20} className={commandCenterMode ? 'text-[#A8B8D8]' : 'text-gray-600'} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </header>
        )}

        {/* Page Content */}
        <main className={`flex-1 overflow-auto ${commandCenterMode ? 'p-0' : 'p-6'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
  variant,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  variant: 'default' | 'command-center';
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${getNavItemClasses(isActive, variant)}`
      }
    >
      {icon}
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}

function getNavItemClasses(isActive: boolean, variant: 'default' | 'command-center'): string {
  if (variant === 'command-center') {
    return isActive
      ? 'bg-[#244785] text-[#ECF2FF] shadow-[inset_0_0_0_1px_rgba(93,132,197,0.7)]'
      : 'text-[#A4B5D7] hover:bg-[#16264A] hover:text-[#ECF2FF]';
  }

  return isActive ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white';
}
