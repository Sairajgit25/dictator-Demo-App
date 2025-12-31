import React from 'react';
import { LayoutDashboard, ShieldAlert, BookOpen, Activity, Settings } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  setTab: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setTab }) => {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'blocklist', icon: ShieldAlert, label: 'Block' },
    { id: 'learning', icon: BookOpen, label: 'Learn' },
    { id: 'habits', icon: Activity, label: 'Habits' },
    { id: 'settings', icon: Settings, label: 'Config' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t-2 border-black h-20 pb-4 z-50">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center justify-center w-16 transition-all duration-200 ${
                isActive ? 'text-black transform -translate-y-1' : 'text-gray-400'
              }`}
            >
              <div className={`p-2 rounded-full ${isActive ? 'bg-dictator-lime border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''}`}>
                <Icon size={isActive ? 20 : 24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] mt-1 font-bold ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;