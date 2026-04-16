import React from 'react';
import {
  LayoutDashboard,
  Hotel,
  Bed,
  CalendarDays,
  Settings,
  X,
} from 'lucide-react';

export default function OwnerSidebar({ onAdd, activeTab = 'dashboard', onTabChange, isOpen = true, onClose }) {

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
    { icon: Hotel, label: 'Hostels', key: 'hostels' },
    { icon: Bed, label: 'Rooms', key: 'rooms' },
    { icon: CalendarDays, label: 'Bookings', key: 'bookings' },
    { icon: Settings, label: 'Settings', key: 'settings' },
  ];

  const handleTabChange = (key) => {
    onTabChange && onTabChange(key);
    // auto-close on mobile after selecting a tab
    onClose && onClose();
  };

  const SidebarItem = ({ icon: Icon, label, tabKey }) => {
    const isActive = activeTab === tabKey;
    return (
      <button
        type="button"
        onClick={() => handleTabChange(tabKey)}
        className={`w-full flex items-center px-4 py-3 rounded-full transition-all duration-200 !no-underline ${
          isActive
            ? 'font-bold border-r-4 border-[var(--color-primary)] bg-slate-100 scale-95 opacity-90'
            : 'font-medium hover:bg-slate-200'
        }`}
      >
        <Icon
          size={20}
          className={`mr-3 ${isActive ? 'text-[var(--color-primary)]' : 'text-slate-400'}`}
        />
        <span className={`text-xs uppercase tracking-wider font-bold ${isActive ? 'text-[var(--color-primary)]' : 'text-slate-400'}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          h-screen w-64 flex-shrink-0 flex flex-col bg-slate-50 border-r border-slate-200 z-50
          transition-transform duration-300 ease-in-out
          lg:sticky lg:top-0 lg:self-start lg:translate-x-0
          fixed top-0 left-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between px-4 pt-5 pb-2 lg:hidden">
          <span className="text-sm font-black uppercase tracking-widest text-[#0058be]">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-200 text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col h-full py-6 px-4">
          <nav className="flex-1 space-y-1">
            {menuItems.map((item, index) => (
              <SidebarItem key={index} icon={item.icon} label={item.label} tabKey={item.key} />
            ))}
          </nav>
          <div className="mt-auto px-4 py-4">
            <button
              onClick={() => { onAdd && onAdd(); onClose && onClose(); }}
              className="w-full bg-gradient-to-br from-[#0058be] to-[#6b38d4] text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:opacity-90 transition-opacity"
            >
              + Add Hostel
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
