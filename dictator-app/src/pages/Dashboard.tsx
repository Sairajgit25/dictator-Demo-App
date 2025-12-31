import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  AreaChart, Area, CartesianGrid, Line 
} from 'recharts';
import { AlertTriangle, Clock, Zap, TrendingUp, Quote } from 'lucide-react';
import { MOCK_WEEKLY_USAGE, MOCK_MONTHLY_USAGE, MOCK_QUOTES } from '../constants';
import { useAuth } from '../contexts/AuthContext';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    // Check if it's the App Usage Chart (has 'name')
    if (data.name) {
      return (
        <div className="bg-white p-3 border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left">
          <p className="font-bold text-sm mb-1">{data.name}</p>
          <p className="text-xs mb-1">
            Usage: <span className="font-bold">{data.usage}m</span>
          </p>
          <p className="text-xs text-gray-500">
            Limit: <span className="font-bold text-red-500">{data.limit}m</span>
          </p>
        </div>
      );
    } 
    // Otherwise it's the Trend Chart (has 'day', 'current', 'previous')
    else {
      return (
        <div className="bg-white p-3 border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left">
          <p className="font-bold text-sm mb-1">Day {data.day}</p>
          <p className="text-xs mb-1 text-dictator-teal font-bold">
            Current: {data.current}m
          </p>
          <p className="text-xs text-gray-400 font-bold">
            Previous: {data.previous}m
          </p>
        </div>
      );
    }
  }
  return null;
};

const Dashboard: React.FC = () => {
  const [trendPeriod, setTrendPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const { userData } = useAuth();
  
  const data = userData.apps.map(app => ({
    name: app.name,
    usage: app.dailyUsageMinutes,
    limit: app.limitMinutes
  }));

  const trendData = trendPeriod === 'weekly' ? MOCK_WEEKLY_USAGE : MOCK_MONTHLY_USAGE;

  const totalUsage = userData.apps.reduce((acc, curr) => acc + curr.dailyUsageMinutes, 0);
  const totalBlocked = userData.apps.filter(a => a.isBlocked).length;

  // Calculate Quote of the Day based on the day of the year
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const dailyQuote = MOCK_QUOTES[dayOfYear % MOCK_QUOTES.length];

  return (
    <div className="p-6 space-y-6 pb-24 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Rule Your Mind.</h1>
        <div className="bg-white p-5 rounded-xl border-l-8 border-dictator-teal shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] relative overflow-hidden">
           <Quote size={40} className="absolute -right-2 -top-2 text-gray-100 rotate-12" />
           <p className="text-lg font-serif italic text-gray-800 mb-2 relative z-10 font-medium leading-relaxed">"{dailyQuote.text}"</p>
           <p className="text-xs font-black uppercase text-gray-400 tracking-wider relative z-10">— {dailyQuote.author}</p>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-dictator-teal p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5" />
            <span className="font-bold text-sm">Screen Time</span>
          </div>
          <p className="text-3xl font-black">{Math.floor(totalUsage / 60)}h {totalUsage % 60}m</p>
        </div>
        <div className="bg-dictator-gold p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5" />
            <span className="font-bold text-sm">Willpower</span>
          </div>
          <p className="text-3xl font-black">850</p>
        </div>
      </div>

      {/* Usage Chart */}
      <div className="bg-white p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="text-red-500" /> Doom Scroll Monitor
        </h2>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" fontSize={10} tick={{fill: 'black'}} />
              <Tooltip content={<CustomTooltip />} cursor={{fill: '#f3f4f6'}} />
              <Bar 
                dataKey="usage" 
                radius={[4, 4, 0, 0]}
                animationDuration={1500}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.usage > entry.limit ? '#FF6B6B' : '#AFFC41'} stroke="black" strokeWidth={2} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Analysis Section */}
      <div className="bg-white p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="text-dictator-teal" /> Trend Analysis
          </h2>
          <div className="flex bg-gray-100 rounded-lg p-1 border border-black">
            <button 
              onClick={() => setTrendPeriod('weekly')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${trendPeriod === 'weekly' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
            >
              Week
            </button>
            <button 
              onClick={() => setTrendPeriod('monthly')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${trendPeriod === 'monthly' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
            >
              Month
            </button>
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1DD3B0" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#1DD3B0" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis 
                dataKey="day" 
                fontSize={10} 
                tick={{fill: 'black'}} 
                axisLine={false} 
                tickLine={false} 
                interval={trendPeriod === 'monthly' ? 5 : 0}
              />
              <YAxis fontSize={10} tick={{fill: 'black'}} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="current" 
                name="This Period"
                stroke="#1DD3B0" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCurrent)" 
                animationDuration={1500}
              />
              <Line 
                type="monotone" 
                dataKey="previous" 
                name="Last Period"
                stroke="#a0aec0" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-2 text-xs font-bold">
            <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-dictator-teal rounded-full border border-black"></div>
                <span>Current</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-3 h-1 bg-gray-400 border border-black border-dashed"></div>
                <span className="text-gray-500">Previous</span>
            </div>
        </div>
      </div>

      {/* Active Rules */}
      <div className="bg-dictator-olive p-5 rounded-xl border-2 border-black">
        <h3 className="font-bold text-lg mb-2">Active Protocols</h3>
        <p className="mb-4 text-sm font-medium">You are currently monitoring <span className="font-black">{totalBlocked} apps</span>.</p>
        <div className="w-full bg-black/10 rounded-full h-3 border border-black">
          <div className="bg-black h-full rounded-full w-2/3"></div>
        </div>
        <div className="flex justify-between text-xs font-bold mt-2">
          <span>Day Progress</span>
          <span>66%</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;