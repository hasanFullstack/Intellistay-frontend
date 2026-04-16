import React from 'react';
import {
  LayoutDashboard,
  Hotel,
  Bed,
  CalendarDays,
  Zap,
  BarChart3,
  Wallet,
  Settings
} from 'lucide-react';

export default function OwnerSidebar({ onAdd, activeTab = 'dashboard', onTabChange }) {

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
    { icon: Hotel, label: 'Hostels', key: 'hostels' },
    { icon: Bed, label: 'Rooms', key: 'rooms' },
    { icon: CalendarDays, label: 'Bookings', key: 'bookings' },
    // { icon: Zap, label: 'AI Pricing', key: 'ai-pricing' },
    // { icon: BarChart3, label: 'Analytics', key: 'analytics' },
    // { icon: Wallet, label: 'Revenue', key: 'revenue' },
    { icon: Settings, label: 'Settings', key: 'settings' },
  ];

  const SidebarItem = ({ icon: Icon, label, tabKey }) => {
    const isActive = activeTab === tabKey;
    return (
      <button
      type="button"
      onClick={() => onTabChange && onTabChange(tabKey)}
      className={`w-full flex items-center px-4 py-3 rounded-full transition-all duration-200 !no-underline ${isActive
        ? 'font-bold border-r-4 border-[var(--color-primary)] bg-slate-100 scale-95 opacity-90'
        : 'font-medium hover:bg-slate-200'
        }`}
    >
      <Icon
        size={20}
        className={`mr-3 ${isActive ? 'text-[var(--color-primary)]' : 'text-slate-400 group-hover:text-slate-600'}`}
      />
      <span className={`text-xs uppercase tracking-wider font-bold ${isActive ? 'text-[var(--color-primary)]' : 'text-slate-400 group-hover:text-slate-600'}`}>{label}</span>
    </button>
    );
  };

  return (
    <aside className="h-full w-64 flex flex-col absolute bg-slate-50 border-r border-slate-200 z-50">
      <div className="flex flex-col h-full py-6 px-4">
        <nav className="flex-1 space-y-1">
          {menuItems.map((item, index) => (
            <SidebarItem key={index} icon={item.icon} label={item.label} tabKey={item.key} />
          ))}
        </nav>
        <div className="mt-auto px-4 py-4">
          <button onClick={onAdd} className="w-full bg-gradient-to-br from-[#0058be] to-[#6b38d4] text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:opacity-90 transition-opacity">+ Add Hostel</button>
        </div>
      </div>
    </aside>
  );
}
