
import React, { useState, useMemo } from 'react';
import { Habit } from '../types';
import { 
  Flame, Check, Plus, Zap, Trophy, Star, Crown, Lock, 
  Target, Trash2, Calendar, X, BarChart2, Bell, AlertCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  isUnlocked: (habits: Habit[]) => boolean;
}

const BADGES: Badge[] = [
  {
    id: 'starter',
    name: 'First Step',
    description: 'Complete your first habit.',
    icon: Star,
    color: 'bg-dictator-teal',
    isUnlocked: (habits) => habits.some(h => h.history.filter(Boolean).length > 0)
  },
  {
    id: 'streak-3',
    name: 'Momentum',
    description: 'Reach a 3-day streak.',
    icon: Zap,
    color: 'bg-dictator-gold',
    isUnlocked: (habits) => habits.some(h => h.streak >= 3)
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak.',
    icon: Flame,
    color: 'bg-orange-400',
    isUnlocked: (habits) => habits.some(h => h.streak >= 7)
  },
  {
    id: 'streak-30',
    name: 'Titan',
    description: 'Achieve a 30-day streak.',
    icon: Crown,
    color: 'bg-purple-400',
    isUnlocked: (habits) => habits.some(h => h.streak >= 30)
  },
  {
    id: 'perfect-day',
    name: 'Perfectionist',
    description: 'Complete all daily habits today.',
    icon: Target,
    color: 'bg-dictator-lime',
    isUnlocked: (habits) => {
      const dailies = habits.filter(h => h.frequency === 'Daily');
      return dailies.length > 0 && dailies.every(h => h.completedToday);
    }
  }
];

const Habits: React.FC = () => {
  const { userData, updateHabits } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [newHabit, setNewHabit] = useState({
    title: '',
    cue: '',
    reminderTime: '',
    frequency: 'Daily' as 'Daily' | 'Weekly'
  });

  const habits = userData.habits;
  const settings = userData.settings;

  // Find the currently selected habit for detail view
  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  const toggleComplete = (id: string) => {
    const updatedHabits = habits.map(h => {
      if (h.id === id) {
        const isNowComplete = !h.completedToday;
        const newStreak = isNowComplete ? h.streak + 1 : Math.max(0, h.streak - 1);
        const newHistory = [...h.history];
        if (newHistory.length > 0) {
            newHistory[newHistory.length - 1] = isNowComplete; 
        } else {
            newHistory.push(isNowComplete);
        }
        return { 
            ...h, 
            completedToday: isNowComplete, 
            streak: newStreak,
            history: newHistory
        };
      }
      return h;
    });
    updateHabits(updatedHabits);
  };

  const deleteHabit = (id: string) => {
    updateHabits(habits.filter(h => h.id !== id));
    if (selectedHabitId === id) setSelectedHabitId(null);
  };

  const handleCreateHabit = () => {
    if (!newHabit.title.trim()) return;

    const habit: Habit = {
      id: Date.now().toString(),
      title: newHabit.title,
      cue: newHabit.cue || 'Whenever I can',
      reminderTime: newHabit.reminderTime || undefined,
      streak: 0,
      frequency: newHabit.frequency,
      completedToday: false,
      history: [false] 
    };

    updateHabits([habit, ...habits]);
    setNewHabit({ title: '', cue: '', reminderTime: '', frequency: 'Daily' });
    setIsFormOpen(false);
  };

  // Gamification & Chart Stats Calculation
  const { totalXP, level, progressToNextLevel, unlockedBadgesCount, dailyXP, weeklyChartData } = useMemo(() => {
    const xp = habits.reduce((acc, h) => {
        const completionPoints = h.history.filter(Boolean).length * 10;
        const streakBonus = h.streak * 5;
        const todayBonus = h.completedToday ? 25 : 0;
        return acc + completionPoints + streakBonus + todayBonus;
    }, 0);

    const todayXP = habits.reduce((acc, h) => {
        if (h.completedToday) {
            return acc + 10 + 25 + (h.streak * 5);
        }
        return acc;
    }, 0);

    // Calculate Weekly Completion Chart Data
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      const dayLabel = days[d.getDay()];
      
      // Sum completions across all habits for this specific day
      // Based on relative history indexing
      const completions = habits.reduce((sum, h) => {
        const historyIndex = h.history.length - 1 - (6 - i);
        return sum + (historyIndex >= 0 && h.history[historyIndex] ? 1 : 0);
      }, 0);

      return { name: dayLabel, completions };
    });

    const levelThreshold = 250;
    const lvl = Math.floor(xp / levelThreshold) + 1;
    const progress = (xp % levelThreshold) / levelThreshold * 100;
    const unlocked = BADGES.filter(b => b.isUnlocked(habits)).length;

    return { 
      totalXP: xp, 
      level: lvl, 
      progressToNextLevel: progress, 
      unlockedBadgesCount: unlocked, 
      dailyXP: todayXP,
      weeklyChartData: chartData
    };
  }, [habits]);

  const dailyGoalPercent = Math.min(100, (dailyXP / (settings.dailyXpGoal || 100)) * 100);

  return (
    <div className="p-6 pb-24 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold">Atomic Habits</h1>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="p-2 border-2 border-black rounded-full bg-dictator-lime shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all"
        >
          <Plus />
        </button>
      </div>

      {/* Gamification Header */}
      <div className="mb-4 bg-black text-white p-5 rounded-xl border-2 border-gray-800 shadow-[4px_4px_0px_0px_#1DD3B0]">
         <div className="flex justify-between items-end mb-2">
            <div>
                <span className="text-xs font-bold text-dictator-lime uppercase tracking-wider">Current Level</span>
                <div className="text-4xl font-black leading-none">{level}</div>
            </div>
            <div className="text-right">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Willpower</span>
                <div className="text-xl font-bold font-mono text-dictator-teal">{totalXP} XP</div>
            </div>
         </div>
         
         <div className="w-full h-4 bg-gray-800 rounded-full border border-gray-600 overflow-hidden relative">
            <div 
                className="h-full bg-dictator-lime transition-all duration-500 ease-out"
                style={{ width: `${progressToNextLevel}%` }}
            ></div>
            <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhZWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')] opacity-20"></div>
         </div>
      </div>

      {/* Weekly Progress Chart */}
      <div className="mb-8 bg-white p-5 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="font-bold text-sm mb-4 uppercase tracking-wider flex items-center gap-2">
          <BarChart2 size={18} className="text-dictator-teal" /> Weekly Velocity
        </h3>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyChartData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <Tooltip 
                cursor={{ fill: '#f3f4f6' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-black text-white text-xs p-2 rounded border-2 border-dictator-lime">
                        <span className="font-black">{payload[0].value} Protocols Clear</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="completions" radius={[4, 4, 0, 0]}>
                {weeklyChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.completions > 0 ? '#1DD3B0' : '#e5e7eb'} 
                    stroke="black" 
                    strokeWidth={2} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Goal Card */}
      <div className="mb-8 bg-white p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wide">
                <Calendar size={16} /> Daily Protocol Goal
            </h3>
            <span className="text-xs font-black bg-gray-100 px-2 py-1 rounded border border-black">
                {dailyXP} / {settings.dailyXpGoal || 100} XP
            </span>
        </div>
        <div className="w-full h-6 bg-gray-100 rounded-lg border-2 border-black overflow-hidden relative">
            <div 
                className={`h-full transition-all duration-700 ease-out flex items-center justify-end px-2 ${
                    dailyGoalPercent >= 100 ? 'bg-dictator-gold' : 'bg-dictator-olive'
                }`}
                style={{ width: `${dailyGoalPercent}%` }}
            >
                {dailyGoalPercent >= 100 && <Check size={14} className="text-black" strokeWidth={4} />}
            </div>
             <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhZWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')] opacity-10 pointer-events-none"></div>
        </div>
      </div>

      {/* Achievements / Badges Section */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Trophy size={20} className="text-dictator-gold" /> Achievements 
            <span className="bg-gray-200 text-xs px-2 py-0.5 rounded-full border border-black font-mono">
                {unlockedBadgesCount}/{BADGES.length}
            </span>
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
            {BADGES.map((badge) => {
                const isUnlocked = badge.isUnlocked(habits);
                const Icon = badge.icon;
                return (
                    <div 
                        key={badge.id}
                        className={`flex-shrink-0 w-32 p-3 rounded-xl border-2 border-black flex flex-col items-center text-center gap-2 transition-all ${
                            isUnlocked 
                                ? `bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` 
                                : 'bg-gray-100 opacity-60 grayscale border-dashed'
                        }`}
                    >
                        <div className={`p-2 rounded-full border-2 border-black ${isUnlocked ? badge.color : 'bg-gray-300'}`}>
                            {isUnlocked ? <Icon size={20} className="text-black" /> : <Lock size={20} />}
                        </div>
                        <div>
                            <p className="font-bold text-xs">{badge.name}</p>
                            <p className="text-[10px] text-gray-500 leading-tight mt-1">{badge.description}</p>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Habits List */}
      <div className="space-y-4 mb-8">
        {habits.length === 0 ? (
          <div className="text-center p-8 border-2 border-dashed border-gray-400 rounded-xl">
             <p className="text-gray-500 font-bold">No habits tracked yet.</p>
             <p className="text-sm text-gray-400">Tap + to start a new streak.</p>
          </div>
        ) : habits.map(habit => (
          <div 
            key={habit.id} 
            onClick={() => setSelectedHabitId(habit.id)}
            className="bg-white p-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg truncate">{habit.title}</h3>
                  {habit.streak > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-[10px] font-black border border-orange-200 uppercase tracking-wide">
                      <Flame size={12} fill="currentColor" /> {habit.streak} Day Streak
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-mono">
                    <span className="truncate">{habit.cue}</span>
                    {habit.reminderTime && (
                        <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-[10px] font-bold">
                            <Bell size={10} /> {habit.reminderTime}
                        </span>
                    )}
                </div>
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); toggleComplete(habit.id); }}
                className={`w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center transition-all active:scale-95 ${
                  habit.completedToday 
                    ? 'bg-dictator-lime shadow-none' 
                    : 'bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:bg-white'
                }`}
              >
                {habit.completedToday && <Check size={28} strokeWidth={4} />}
              </button>
            </div>

            <div className="pt-3 border-t-2 border-gray-100 flex items-center justify-between">
                <div className="flex gap-1">
                    {Array.from({length: 14}).map((_, i) => {
                        const index = habit.history.length - 14 + i;
                        const status = index >= 0 ? habit.history[index] : false;
                        return (
                            <div 
                                key={i} 
                                className={`w-2 h-2 rounded-sm ${
                                    index < 0 ? 'bg-gray-100' :
                                    status ? 'bg-dictator-teal border border-black' : 'bg-gray-200'
                                }`} 
                            />
                        );
                    })}
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* NEW PROTOCOL MODAL POPUP */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] overflow-hidden animate-slide-in-up">
            <div className="bg-dictator-lime p-4 border-b-4 border-black flex justify-between items-center">
              <h2 className="text-xl font-black flex items-center gap-2">
                <Zap size={24} /> NEW PROTOCOL
              </h2>
              <button 
                onClick={() => setIsFormOpen(false)} 
                className="p-1 hover:bg-black/10 rounded-lg transition-colors"
              >
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-gray-500 mb-1">Habit Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Meditate 10 mins"
                  value={newHabit.title}
                  onChange={(e) => setNewHabit({...newHabit, title: e.target.value})}
                  className="w-full p-3 rounded-xl border-2 border-black focus:outline-none focus:ring-4 ring-dictator-teal font-bold transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-500 mb-1">Cue (Trigger)</label>
                <input 
                  type="text" 
                  placeholder="e.g. After morning coffee"
                  value={newHabit.cue}
                  onChange={(e) => setNewHabit({...newHabit, cue: e.target.value})}
                  className="w-full p-3 rounded-xl border-2 border-black focus:outline-none focus:ring-4 ring-dictator-teal font-bold transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-black uppercase text-gray-500 mb-2">Frequency</label>
                    <div className="flex gap-1">
                        {(['Daily', 'Weekly'] as const).map((freq) => (
                        <button
                            key={freq}
                            onClick={() => setNewHabit({...newHabit, frequency: freq})}
                            className={`flex-1 py-2 px-2 rounded-lg border-2 border-black font-black text-[10px] transition-all uppercase ${
                            newHabit.frequency === freq 
                                ? 'bg-black text-white' 
                                : 'bg-gray-100 text-gray-400'
                            }`}
                        >
                            {freq}
                        </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-black uppercase text-gray-500 mb-2 flex items-center gap-1">
                        <Bell size={12} /> Reminder
                    </label>
                    <input 
                        type="time" 
                        value={newHabit.reminderTime}
                        onChange={(e) => setNewHabit({...newHabit, reminderTime: e.target.value})}
                        className="w-full p-2 rounded-lg border-2 border-black bg-gray-50 font-black text-xs focus:outline-none"
                    />
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <button 
                  onClick={handleCreateHabit}
                  disabled={!newHabit.title.trim()}
                  className="w-full py-4 rounded-xl border-4 border-black bg-dictator-lime font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:shadow-none transition-all uppercase"
                >
                  Create Habit
                </button>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="w-full py-2 text-xs font-black uppercase text-gray-400 hover:text-red-500 transition-colors"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED HABIT VIEW MODAL */}
      {selectedHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-dictator-lime p-4 border-b-4 border-black flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-black truncate pr-4">{selectedHabit.title}</h2>
                    <button 
                        onClick={() => setSelectedHabitId(null)} 
                        className="p-1 hover:bg-black/10 rounded"
                    >
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 border-2 border-black rounded-xl p-3 text-center">
                            <p className="text-xs font-bold text-gray-500 uppercase">Current Streak</p>
                            <p className="text-2xl font-black flex items-center justify-center gap-1">
                                <Flame size={20} className="text-orange-500" fill="currentColor" /> {selectedHabit.streak}
                            </p>
                        </div>
                        <div className="bg-gray-50 border-2 border-black rounded-xl p-3 text-center">
                            <p className="text-xs font-bold text-gray-500 uppercase">Total Reps</p>
                            <p className="text-2xl font-black text-dictator-teal">
                                {selectedHabit.history.filter(Boolean).length}
                            </p>
                        </div>
                    </div>

                    <div className="mb-6 space-y-2">
                         <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                             <span className="text-sm font-bold text-gray-500">Cue / Trigger</span>
                             <span className="font-bold text-sm text-right">{selectedHabit.cue}</span>
                         </div>
                         <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                             <span className="text-sm font-bold text-gray-500">Frequency</span>
                             <span className="font-bold text-sm text-right">{selectedHabit.frequency}</span>
                         </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                            <BarChart2 size={16} /> Consistency Log (90 Days)
                        </h3>
                        <div className="flex flex-wrap gap-1 content-start justify-center">
                             {Array.from({ length: 90 }).map((_, i) => {
                                 const historyLength = selectedHabit.history.length;
                                 const dayOffset = 89 - i; 
                                 const historyIndex = historyLength - 1 - dayOffset;
                                 const hasData = historyIndex >= 0;
                                 const isCompleted = hasData ? selectedHabit.history[historyIndex] : false;

                                 return (
                                     <div 
                                        key={i}
                                        className={`w-3 h-3 rounded-[1px] border border-black/10 ${
                                            !hasData ? 'bg-gray-100' :
                                            isCompleted ? 'bg-dictator-lime border-black' : 'bg-gray-200'
                                        }`}
                                     />
                                 );
                             })}
                        </div>
                    </div>

                    <button 
                        onClick={() => deleteHabit(selectedHabit.id)}
                        className="w-full py-3 border-2 border-red-200 text-red-500 font-bold rounded-xl hover:bg-red-50 flex items-center justify-center gap-2"
                    >
                        <Trash2 size={18} /> Delete Protocol
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Habits;
