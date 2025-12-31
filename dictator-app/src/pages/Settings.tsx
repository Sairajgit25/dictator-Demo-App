import React, { useState, useEffect, useMemo } from 'react';
import { Save, Zap, Sun, Shield, LogOut, User, Target, Activity, Calendar } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { COLORS } from '../constants';
import { ThemeColor } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { userData, updateSettings, user, logout } = useAuth();
  const [settings, setSettings] = useState(userData.settings);
  const [saved, setSaved] = useState(false);

  // Sync state if context changes (e.g. initial load)
  useEffect(() => {
    setSettings(userData.settings);
  }, [userData.settings]);

  const handleSave = () => {
    updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSetting = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // --- Analytics Data Preparation ---
  const { heatmapData, weeklyData } = useMemo(() => {
    // 1. Prepare Heatmap Data (Last 126 days / 18 weeks)
    const totalDays = 126; 
    const heatMap = new Array(totalDays).fill(0);
    
    // 2. Prepare Weekly Data (Last 7 days)
    const last7Days = new Array(7).fill(0).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            count: 0,
            fullDate: d.toISOString().split('T')[0]
        };
    });

    // Aggregate habit history
    userData.habits.forEach(habit => {
        // Handle history array (assuming end is today)
        // Pad history if needed or slice
        const len = habit.history.length;
        
        // Populate Heatmap
        for (let i = 0; i < totalDays; i++) {
            const historyIndex = len - 1 - i; // 0 offset is today (end of array)
            if (historyIndex >= 0) {
                if (habit.history[historyIndex] || (i === 0 && habit.completedToday)) {
                    heatMap[totalDays - 1 - i]++;
                }
            }
        }

        // Populate Weekly
        for (let i = 0; i < 7; i++) {
            const historyIndex = len - 1 - (6 - i);
            if (historyIndex >= 0) {
                if (habit.history[historyIndex] || (i === 6 && habit.completedToday)) {
                    last7Days[i].count++;
                }
            }
        }
    });

    return { heatmapData: heatMap, weeklyData: last7Days };
  }, [userData.habits]);

  const getIntensityColor = (count: number) => {
     if (count === 0) return 'bg-gray-100';
     if (count <= 1) return 'bg-dictator-pale';
     if (count <= 2) return 'bg-[#B9E769]'; // Olive
     if (count <= 3) return 'bg-dictator-lime';
     return 'bg-dictator-teal';
  };

  const ColorPicker = ({ 
    label, 
    value, 
    onChange, 
    options 
  }: { 
    label: string, 
    value: ThemeColor, 
    onChange: (c: ThemeColor) => void,
    options: ThemeColor[] 
  }) => (
    <div className="mb-6">
      <label className="block font-bold mb-3 text-sm uppercase tracking-wider text-gray-500">{label}</label>
      <div className="flex gap-4">
        {options.map((colorKey) => (
          <button
            key={colorKey}
            onClick={() => onChange(colorKey)}
            className={`w-12 h-12 rounded-full border-2 border-black flex items-center justify-center transition-transform active:scale-95 ${
              value === colorKey ? 'ring-2 ring-black ring-offset-2' : ''
            }`}
            style={{ backgroundColor: COLORS[colorKey] }}
            aria-label={`Select ${colorKey}`}
          >
            {value === colorKey && <div className="w-3 h-3 bg-black rounded-full" />}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 pb-24">
      <header className="mb-8 flex justify-between items-end">
        <div>
            <h1 className="text-3xl font-extrabold mb-2">System Config</h1>
            <p className="text-gray-600">Tailor the regime to your needs.</p>
        </div>
        <button 
          onClick={logout}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border-2 border-transparent hover:border-red-100"
          title="Logout"
        >
          <LogOut size={24} />
        </button>
      </header>

      {/* User Info */}
      <div className="bg-black text-white p-4 rounded-xl border-2 border-gray-800 shadow-[4px_4px_0px_0px_#1DD3B0] mb-6 flex items-center gap-4">
        <div className="p-3 bg-gray-800 rounded-full">
            <User size={24} className="text-dictator-teal" />
        </div>
        <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Logged in as</p>
            <p className="text-xl font-bold">{user?.username}</p>
        </div>
      </div>

      {/* Consistency Visualizer (LeetCode Style) */}
      <section className="bg-white p-5 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar size={24} /> Consistency Graph
        </h2>
        
        {/* Heatmap Grid */}
        <div className="mb-6">
            <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar" style={{ direction: 'rtl' }}>
                {/* We render columns of 7 days. Total days 126 / 7 = 18 cols */}
                {Array.from({ length: 18 }).map((_, colIndex) => (
                    <div key={colIndex} className="flex flex-col gap-1">
                        {Array.from({ length: 7 }).map((_, dayIndex) => {
                            // Calculate global index (reversed because RTL for "past to present" feel left-to-right logic requires handling)
                            // But standard contribution graphs grow right-to-left in history? No, usually Left(Past) -> Right(Today).
                            // Let's re-orient: 
                            // Render from Past (index 0) to Today (index 125).
                            // If we want Left->Right, we should just map standard.
                            // However, CSS Grid is easier. Let's try a simple Flex Wrap or Grid.
                            
                            // Let's use simple div grid.
                            // We need COLUMNS.
                            // Col 0 is 18 weeks ago. Col 17 is this week.
                            // Index logic: (colIndex * 7) + dayIndex
                            const index = (colIndex * 7) + dayIndex;
                            const count = heatmapData[index] || 0;
                            return (
                                <div 
                                    key={dayIndex}
                                    title={`${count} completions`}
                                    className={`w-3 h-3 rounded-[2px] ${getIntensityColor(count)}`}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold mt-2 px-1">
                <span>4 Months Ago</span>
                <div className="flex items-center gap-1">
                    <span>Less</span>
                    <div className="w-2 h-2 bg-gray-100 rounded-[1px]"></div>
                    <div className="w-2 h-2 bg-dictator-lime rounded-[1px]"></div>
                    <div className="w-2 h-2 bg-dictator-teal rounded-[1px]"></div>
                    <span>More</span>
                </div>
            </div>
        </div>

        {/* Weekly Bar Chart */}
        <div>
            <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Last 7 Days Activity</h3>
            <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                        <RechartsTooltip 
                            cursor={{fill: '#f3f4f6'}}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                return (
                                    <div className="bg-black text-white text-xs p-2 rounded font-bold">
                                        {payload[0].payload.day}: {payload[0].value}
                                    </div>
                                );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {weeklyData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.count > 0 ? COLORS.lime : '#e5e7eb'} stroke="black" strokeWidth={1} />
                            ))}
                        </Bar>
                        <XAxis 
                            dataKey="day" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 10, fontWeight: 'bold'}} 
                            interval={0}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </section>

      {/* Visual Preferences */}
      <section className="bg-white p-5 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Sun size={24} /> Visual Protocol
        </h2>
        
        <ColorPicker 
          label="Power Color (Accents)" 
          value={settings.powerColor} 
          onChange={(c) => updateSetting('powerColor', c)}
          options={['lime', 'teal', 'gold', 'olive']}
        />

        <ColorPicker 
          label="Relax Color (Background)" 
          value={settings.relaxColor} 
          onChange={(c) => updateSetting('relaxColor', c)}
          options={['pale', 'olive', 'gold']}
        />
      </section>

      {/* Goals */}
      <section className="bg-white p-5 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
         <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
           <Target size={24} /> Goals
         </h2>
         <div>
            <label className="block text-xs font-bold mb-1 uppercase text-gray-500">Daily XP Target</label>
            <div className="flex items-center gap-2">
                <input 
                    type="number" 
                    value={settings.dailyXpGoal || 100}
                    onChange={(e) => updateSetting('dailyXpGoal', parseInt(e.target.value))}
                    className="w-full bg-gray-100 border-2 border-black rounded-lg p-3 font-bold focus:ring-2 ring-dictator-teal focus:outline-none"
                    min="10"
                    step="10"
                />
                <span className="font-black text-gray-400">XP</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Recommended: 100 XP (~2-3 habits)</p>
         </div>
      </section>

      {/* Strict Mode */}
      <section className={`p-5 rounded-xl border-2 border-black transition-colors mb-6 ${
        settings.strictMode ? 'bg-dictator-dark text-white shadow-[4px_4px_0px_0px_#FF6B6B]' : 'bg-gray-100'
      }`}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Shield size={24} className={settings.strictMode ? 'text-red-500' : 'text-gray-500'} /> 
              Strict Mode
            </h2>
            <p className={`text-sm mt-1 ${settings.strictMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Prevent changes to blocklist during active hours.
            </p>
          </div>
          
          <button 
            onClick={() => updateSetting('strictMode', !settings.strictMode)}
            className={`w-14 h-8 rounded-full border-2 border-black relative transition-colors ${
              settings.strictMode ? 'bg-dictator-lime' : 'bg-gray-300'
            }`}
          >
            <div className={`absolute top-1 bottom-1 w-5 bg-black rounded-full transition-all ${
              settings.strictMode ? 'right-1' : 'left-1'
            }`} />
          </button>
        </div>

        {settings.strictMode && (
          <div className="grid grid-cols-2 gap-4 animate-fade-in">
            <div>
              <label className="block text-xs font-bold mb-1 uppercase text-gray-400">Start Time</label>
              <input 
                type="time" 
                value={settings.strictModeStart}
                onChange={(e) => updateSetting('strictModeStart', e.target.value)}
                className="w-full bg-gray-800 border-2 border-gray-600 rounded-lg p-3 text-white focus:border-dictator-lime focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 uppercase text-gray-400">End Time</label>
              <input 
                type="time" 
                value={settings.strictModeEnd}
                onChange={(e) => updateSetting('strictModeEnd', e.target.value)}
                className="w-full bg-gray-800 border-2 border-gray-600 rounded-lg p-3 text-white focus:border-dictator-lime focus:outline-none"
              />
            </div>
          </div>
        )}
      </section>

      {/* Action Button */}
      <button 
        onClick={handleSave}
        className={`w-full py-4 rounded-xl border-2 border-black font-black text-lg flex items-center justify-center gap-2 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none ${
          saved ? 'bg-green-400' : 'bg-dictator-lime'
        }`}
      >
        {saved ? (
          <>
            <div className="animate-bounce">✓</div> Saved
          </>
        ) : (
          <>
            <Save size={20} /> Save Changes
          </>
        )}
      </button>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500 font-mono">Dictator v1.0.2</p>
      </div>
    </div>
  );
};

export default Settings;