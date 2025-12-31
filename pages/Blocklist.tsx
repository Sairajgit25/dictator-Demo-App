
import React, { useState, useMemo, useEffect } from 'react';
import { Lock, Unlock, Search, Smartphone, Check, CheckSquare, Square, Clock, Hourglass, PlusCircle, ShieldAlert, Loader2, Play, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { sendNotification } from '../services/notificationService';
import { AppDefinition } from '../types';

// Web Audio API Synth to play a "Mechanical Reset" sound
const playOverrideSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(60, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 1.2);

    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 1.2);
  } catch (e) {
    console.warn("Audio Context failed to initialize", e);
  }
};

// Fuzzy matching algorithm: Sequential character matching
const fuzzyMatch = (text: string, search: string): number[] | null => {
  if (!search) return [];
  const searchLower = search.toLowerCase().replace(/\s+/g, '');
  const textLower = text.toLowerCase();
  if (searchLower.length === 0) return [];
  const indices: number[] = [];
  let searchIdx = 0;
  for (let i = 0; i < textLower.length; i++) {
    if (searchIdx < searchLower.length && textLower[i] === searchLower[searchIdx]) {
      indices.push(i);
      searchIdx++;
    }
  }
  return searchIdx === searchLower.length ? indices : null;
};

const HighlightedText = ({ text, highlights }: { text: string, highlights?: number[] }) => {
  if (!highlights || highlights.length === 0) return <>{text}</>;
  const highlightSet = new Set(highlights);
  return (
    <span>
      {text.split('').map((char, i) => (
        <span 
          key={i} 
          className={highlightSet.has(i) ? "bg-dictator-lime text-black font-extrabold rounded-[1px]" : ""}
        >
          {char}
        </span>
      ))}
    </span>
  );
};

const SegmentedBar = ({ percent, isOverLimit }: { percent: number, isOverLimit: boolean }) => {
  const segments = 10;
  const activeSegments = Math.ceil((percent / 100) * segments);
  
  return (
    <div className="flex gap-1 w-full h-5">
      {Array.from({ length: segments }).map((_, i) => {
        const isActive = i < activeSegments;
        let colorClass = "bg-gray-200";
        
        if (isActive) {
          if (isOverLimit) colorClass = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
          else if (percent > 80) colorClass = "bg-dictator-gold shadow-[0_0_8px_rgba(254,228,64,0.5)]";
          else if (percent > 50) colorClass = "bg-dictator-olive shadow-[0_0_8px_rgba(185,231,105,0.5)]";
          else colorClass = "bg-dictator-teal shadow-[0_0_8px_rgba(29,211,176,0.5)]";
        }

        return (
          <div 
            key={i}
            className={`flex-1 rounded-sm border border-black/10 transition-all duration-300 ${colorClass} ${isActive && !isOverLimit ? 'animate-pulse' : ''}`}
            style={{ animationDelay: `${i * 100}ms`, animationDuration: '2s' }}
          >
            {isActive && (
              <div className="w-full h-full bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhZWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')] opacity-20"></div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const Blocklist: React.FC = () => {
  const { userData, updateApps } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingLimitId, setEditingLimitId] = useState<string | null>(null);
  const [tempLimit, setTempLimit] = useState<number>(0);
  
  const [interventionApp, setInterventionApp] = useState<AppDefinition | null>(null);
  const [launchingApp, setLaunchingApp] = useState<AppDefinition | null>(null);
  const [isReclaiming, setIsReclaiming] = useState(false);

  const apps = userData.apps;

  const toggleBlock = (id: string) => {
    const newApps = apps.map(app => 
      app.id === id ? { ...app, isBlocked: !app.isBlocked } : app
    );
    updateApps(newApps);
  };

  const handleUpdateLimit = (id: string) => {
    const newApps = apps.map(app => 
      app.id === id ? { ...app, limitMinutes: tempLimit } : app
    );
    updateApps(newApps);
    setEditingLimitId(null);
  };

  const simulateUsage = (id: string, minutes: number) => {
    const app = apps.find(a => a.id === id);
    if (!app) return;
    const newUsage = app.dailyUsageMinutes + minutes;
    const isNowOverLimit = newUsage >= app.limitMinutes;
    const shouldBlock = isNowOverLimit && !app.isBlocked;
    const newApps = apps.map(a => {
        if (a.id === id) {
            return { 
                ...a, 
                dailyUsageMinutes: newUsage,
                isBlocked: isNowOverLimit ? true : a.isBlocked 
            };
        }
        return a;
    });
    updateApps(newApps);
    if (shouldBlock) {
        sendNotification(`🚫 Limit Reached: ${app.name}`, {
            body: `Blocked for your own good. Redirecting to focus protocols.`,
            requireInteraction: true,
            tag: `block-${id}`
        });
    }
  };

  const handleLaunchAttempt = (app: AppDefinition) => {
    if (app.isBlocked) {
        setInterventionApp(app);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } else {
        setLaunchingApp(app);
        setTimeout(() => setLaunchingApp(null), 1800); 
    }
  };

  const handleReclaimFocus = () => {
    setIsReclaiming(true);
    playOverrideSound();
    if (navigator.vibrate) navigator.vibrate([30, 100, 30, 200]);
    
    // Forced friction delay
    setTimeout(() => {
        setIsReclaiming(false);
        setInterventionApp(null);
    }, 1200);
  };

  const filteredApps = useMemo(() => {
    return apps
      .map(app => ({ ...app, matchIndices: fuzzyMatch(app.name, searchTerm) }))
      .filter(app => app.matchIndices !== null);
  }, [apps, searchTerm]);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredApps.map(a => a.id);
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.has(id));
    const newSelected = new Set(selectedIds);
    if (allSelected) allFilteredIds.forEach(id => newSelected.delete(id));
    else allFilteredIds.forEach(id => newSelected.add(id));
    setSelectedIds(newSelected);
  };

  const handleBulkAction = (action: 'block' | 'unblock') => {
    const shouldBlock = action === 'block';
    const newApps = apps.map(app => selectedIds.has(app.id) ? { ...app, isBlocked: shouldBlock } : app);
    updateApps(newApps);
    setSelectedIds(new Set());
  };

  const isAllSelected = filteredApps.length > 0 && filteredApps.every(a => selectedIds.has(a.id));

  return (
    <div className="p-6 pb-24 relative min-h-screen">
      {/* --- BLOCKED INTERVENTION SCREEN --- */}
      {interventionApp && (
         <div className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8 text-white transition-all duration-300 border-[12px] border-red-600/20 m-0 ${isReclaiming ? 'animate-jitter' : 'animate-fade-in'}`}>
             {isReclaiming && (
                 <div className="absolute inset-0 bg-white/10 z-[110] animate-pulse"></div>
             )}
             
             <div className="absolute inset-0 border-[2px] border-red-500 animate-pulse pointer-events-none opacity-30"></div>
             
             <div className={`bg-red-600 text-white p-6 rounded-2xl border-4 border-white mb-10 shadow-[0_0_40px_rgba(220,38,38,0.6)] transition-transform duration-500 ${isReclaiming ? 'scale-110 rotate-3' : ''}`}>
                <ShieldAlert size={80} strokeWidth={2.5} />
             </div>

             <h1 className="text-6xl font-black mb-2 text-center uppercase tracking-tighter text-red-500 italic">
                {isReclaiming ? 'OVERRIDING...' : 'ACCESS DENIED'}
             </h1>
             <p className="text-xs font-black tracking-[0.4em] text-red-800 mb-10 bg-red-500/10 px-4 py-1 rounded">
                {isReclaiming ? '[ PROTOCOL REALIGNMENT ]' : 'SYSTEM PROTOCOL VIOLATION'}
             </p>

             <div className="h-[2px] w-32 bg-red-600/50 mb-10 overflow-hidden">
                 {isReclaiming && (
                     <div className="h-full bg-dictator-teal w-full animate-[slideInRight_1.2s_linear]"></div>
                 )}
             </div>
             
             <div className={`text-center space-y-4 mb-14 max-w-sm transition-opacity duration-300 ${isReclaiming ? 'opacity-30' : 'opacity-100'}`}>
                <p className="text-3xl font-serif font-bold italic text-gray-100 leading-tight">
                    "{interventionApp.name} is a weapon against your focus."
                </p>
                <p className="text-xs font-black uppercase text-gray-500 tracking-widest">
                   — The Dictator
                </p>
             </div>

             <div className="w-full max-w-xs relative group">
                {isReclaiming && (
                    <div className="absolute -top-12 left-0 right-0 text-center animate-fade-in">
                        <span className="text-xs font-mono text-dictator-teal font-black animate-pulse">
                            WILLPOWER RE-ENGAGING...
                        </span>
                    </div>
                )}
                
                <button 
                    onClick={handleReclaimFocus}
                    disabled={isReclaiming}
                    className={`w-full py-5 bg-white text-black font-black text-2xl rounded-2xl transition-all border-4 border-black shadow-[0_8px_0_0_#dc2626] active:translate-y-2 active:shadow-none flex items-center justify-center gap-3 disabled:opacity-50 disabled:shadow-none disabled:translate-y-2`}
                >
                    {isReclaiming ? (
                        <>
                            <Loader2 size={28} className="animate-spin text-dictator-teal" strokeWidth={4} />
                            REALIGNING
                        </>
                    ) : (
                        <>
                            <ArrowLeft size={28} strokeWidth={3} /> RECLAIM FOCUS
                        </>
                    )}
                </button>
                
                {isReclaiming && (
                    <div className="absolute -bottom-2 left-1 right-1 h-2 bg-gray-900 rounded-full border border-black overflow-hidden mt-2">
                        <div className="h-full bg-dictator-teal transition-all duration-[1200ms] ease-linear w-0 group-data-[active=true]:w-full" style={{ width: '100%' }}></div>
                    </div>
                )}
             </div>
         </div>
      )}

      {/* --- LAUNCHING SIMULATION --- */}
      {launchingApp && (
         <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center text-black animate-fade-in">
             <div className="mb-10 relative">
                 <div className="bg-gray-50 p-10 rounded-[40px] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                    <Smartphone size={100} className="text-black" />
                 </div>
                 <div className="absolute -bottom-4 -right-4 bg-dictator-teal w-12 h-12 rounded-full border-4 border-white animate-ping"></div>
             </div>
             <div className="text-center space-y-2">
                <h2 className="text-4xl font-black tracking-tight">OPENING {launchingApp.name.toUpperCase()}</h2>
                <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Standard OS Handover...</p>
             </div>
             <div className="mt-12 flex items-center gap-4">
                <Loader2 className="animate-spin text-dictator-teal" size={40} strokeWidth={3} />
             </div>
         </div>
      )}

      <div className="flex justify-between items-end mb-6">
        <div>
            <h1 className="text-3xl font-extrabold mb-1">Target Apps</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Enforce the regime</p>
        </div>
      </div>
      
      {/* Search */}
      <div className="relative mb-6 group">
        <input 
          type="text"
          placeholder="Fuzzy search (e.g. 'inst' for Instagram)..."
          className="w-full p-5 pl-14 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-y-1 focus:shadow-none transition-all placeholder:text-gray-400 font-black text-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-dictator-teal transition-colors" size={24} />
      </div>

      {/* Bulk Controls */}
      <div className="flex items-center justify-between mb-4 px-2">
        <button 
          onClick={handleSelectAll} 
          className="flex items-center gap-2 text-sm font-black text-gray-800 hover:text-black transition-colors uppercase tracking-tight"
        >
          {isAllSelected ? <CheckSquare size={22} className="text-dictator-teal" /> : <Square size={22} />}
          {isAllSelected ? 'Release Selection' : 'Select All Filtered'}
        </button>

        {selectedIds.size > 0 && (
          <span className="text-[10px] font-black bg-black text-white px-3 py-1 rounded-full uppercase tracking-tighter">
            {selectedIds.size} Units
          </span>
        )}
      </div>

      {/* Sticky Action Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-20 mb-6 p-4 bg-white text-black rounded-2xl shadow-[6px_6px_0px_0px_#1a1a1a] border-4 border-black flex justify-between items-center animate-fade-in">
           <span className="font-black text-xs uppercase tracking-widest">Deployment:</span>
           <div className="flex gap-3">
             <button 
               onClick={() => handleBulkAction('unblock')}
               className="px-4 py-2 bg-dictator-lime text-black rounded-xl font-black text-xs flex items-center gap-2 border-2 border-black hover:bg-white transition-all shadow-[2px_2px_0_0_#000]"
             >
               <Unlock size={14} strokeWidth={3} /> ALLOW
             </button>
             <button 
               onClick={() => handleBulkAction('block')}
               className="px-4 py-2 bg-red-500 text-white rounded-xl font-black text-xs flex items-center gap-2 border-2 border-black hover:bg-red-600 transition-all shadow-[2px_2px_0_0_#000]"
             >
               <Lock size={14} strokeWidth={3} /> BLOCK
             </button>
           </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-8 mt-4">
        {filteredApps.map(app => {
          const usagePercent = Math.min(100, Math.floor((app.dailyUsageMinutes / app.limitMinutes) * 100));
          const isOverLimit = app.dailyUsageMinutes >= app.limitMinutes;
          const timeLeft = Math.max(0, app.limitMinutes - app.dailyUsageMinutes);

          return (
          <div 
            key={app.id}
            onClick={() => handleLaunchAttempt(app)}
            className={`group flex flex-col p-5 rounded-2xl border-4 border-black transition-all cursor-pointer relative ${
              app.isBlocked 
                ? 'bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]' 
                : 'bg-gray-100 hover:bg-gray-50'
            } ${selectedIds.has(app.id) ? 'ring-4 ring-dictator-teal ring-offset-2' : ''}`}
          >
            {/* Absolute Launch Overlay */}
            <div className="absolute top-[-14px] right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[60]">
                <div className={`px-3 py-1.5 rounded-lg border-2 border-black flex items-center gap-2 shadow-[4px_4px_0_0_#000] scale-90 group-hover:scale-100 ${app.isBlocked ? 'bg-red-500' : 'bg-dictator-teal'}`}>
                    <span className="text-[10px] font-black text-white uppercase tracking-tighter">
                        {app.isBlocked ? 'BLOCKED' : 'LAUNCH'}
                    </span>
                    <Play size={10} fill="white" className="text-white" />
                </div>
            </div>

            {/* Header Info */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4 overflow-hidden flex-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleSelection(app.id);
                        }}
                        className={`shrink-0 w-8 h-8 border-4 border-black rounded-xl flex items-center justify-center transition-all ${
                        selectedIds.has(app.id) ? 'bg-black text-white' : 'bg-white hover:bg-gray-200'
                        }`}
                    >
                        {selectedIds.has(app.id) && <Check size={20} strokeWidth={4} />}
                    </button>

                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                        <div className={`shrink-0 p-3 rounded-xl border-2 border-black shadow-[2px_2px_0_0_#000] ${app.isBlocked ? 'bg-dictator-gold' : 'bg-gray-300'}`}>
                            <Smartphone size={20} strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-black text-lg leading-none truncate flex items-center gap-2">
                                <HighlightedText text={app.name} highlights={app.matchIndices || []} />
                                {app.isBlocked && <Lock size={14} className="text-red-500" />}
                            </h3>
                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter truncate mt-1">
                                {app.packageName}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-2 z-10">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            if (editingLimitId === app.id) setEditingLimitId(null);
                            else { setEditingLimitId(app.id); setTempLimit(app.limitMinutes); }
                        }}
                        className={`p-2 rounded-lg border-2 border-black hover:bg-gray-200 transition-all ${editingLimitId === app.id ? 'bg-black text-white' : 'bg-white shadow-[2px_2px_0_0_#000]'}`}
                    >
                        <Clock size={18} strokeWidth={2.5} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); toggleBlock(app.id); }}
                        className={`shrink-0 p-2 rounded-lg border-4 border-black transition-all active:scale-95 shadow-[3px_3px_0_0_#000] active:shadow-none active:translate-y-1 ${
                            app.isBlocked ? 'bg-red-400' : 'bg-dictator-lime'
                        }`}
                    >
                        {app.isBlocked ? <Lock size={18} strokeWidth={3} /> : <Unlock size={18} strokeWidth={3} />}
                    </button>
                </div>
            </div>

            {/* Timer Limit Edit Mode */}
            {editingLimitId === app.id && (
                <div 
                    className="mb-4 p-4 bg-gray-900 text-white rounded-2xl border-4 border-black flex flex-wrap items-center gap-3 animate-fade-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                        <Hourglass size={18} className="text-dictator-gold" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Regime Limit:</span>
                        <input 
                            type="number" 
                            value={tempLimit}
                            onChange={(e) => setTempLimit(parseInt(e.target.value) || 0)}
                            className="w-20 bg-black p-2 text-center font-black border-2 border-gray-700 rounded-lg focus:outline-none focus:border-dictator-lime text-lg"
                            min="0"
                        />
                        <span className="text-xs font-black text-gray-500">min</span>
                    </div>
                    <button 
                        onClick={() => handleUpdateLimit(app.id)}
                        className="px-6 py-2 bg-dictator-lime text-black text-xs font-black rounded-xl hover:bg-white transition-colors border-2 border-black"
                    >
                        COMMIT
                    </button>
                </div>
            )}

            {/* HIGH-FIDELITY PROGRESS GAUGE */}
            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Depletion Status</span>
                        <div className="flex items-center gap-1.5">
                            <span className={`text-xl font-black italic tracking-tighter ${isOverLimit ? 'text-red-500' : 'text-black'}`}>
                                {usagePercent}% DEPLETED
                            </span>
                            {isOverLimit && <AlertCircle size={14} className="text-red-500 animate-pulse" />}
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Focus Remaining</span>
                        <p className="font-mono font-black text-sm text-dictator-teal">
                            {timeLeft}m
                        </p>
                    </div>
                </div>

                <SegmentedBar percent={usagePercent} isOverLimit={isOverLimit} />

                <div className="flex justify-between items-center pt-1">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-black"></div>
                            <span className="text-[10px] font-black text-black">{app.dailyUsageMinutes}m USED</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-40">
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                            <span className="text-[10px] font-black text-gray-600">{app.limitMinutes}m LIMIT</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => simulateUsage(app.id, 5)}
                        className="flex items-center gap-1 bg-black text-white px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-dictator-teal hover:text-black transition-all border-2 border-black active:scale-95"
                    >
                        <PlusCircle size={12} strokeWidth={3} /> LOG +5 MIN
                    </button>
                </div>
            </div>
          </div>
        )})}

        {filteredApps.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-4 border-dashed border-gray-200">
                <Search size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No protocols found for "{searchTerm}"</p>
            </div>
        )}
      </div>

      <div className="mt-10 p-6 bg-dictator-gold/10 border-4 border-black border-dashed rounded-3xl">
        <h4 className="font-black text-sm mb-2 flex items-center gap-2">
            <ShieldAlert size={18} /> OPERATIONAL SIMULATION
        </h4>
        <p className="text-xs font-medium text-gray-600 leading-relaxed">
            The power gauge monitors your cognitive depletion in real-time. Reaching 100% initiates an automatic system-wide block of the target asset.
        </p>
      </div>
    </div>
  );
};

export default Blocklist;
