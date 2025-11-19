import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Stats, Prediction } from '../types';
import { TrendingUp, Target, DollarSign } from 'lucide-react';

interface StatsDashboardProps {
  stats: Stats;
  predictions: Prediction[];
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ stats, predictions }) => {
  // Transform predictions into cumulative data for the chart
  const chartData = React.useMemo(() => {
    let cumulativeUnits = 0;
    const settled = [...predictions]
        .filter(p => p.status === 'won' || p.status === 'lost')
        .reverse(); // Oldest first

    return settled.map((p, idx) => {
        if (p.status === 'won') {
            const val = parseFloat(p.odds);
            // Default to 1.91 if invalid
            const odds = !isNaN(val) ? val : 1.91;
            cumulativeUnits += p.units * (odds - 1);
        }
        if (p.status === 'lost') cumulativeUnits -= p.units;
        
        return {
            name: idx + 1,
            units: cumulativeUnits,
            label: p.matchup
        };
    });
  }, [predictions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Metric Cards */}
        <div className="bg-vegas-card border border-neutral-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center space-x-3 text-neutral-400 mb-2">
                <Target className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Win Rate</span>
            </div>
            <div className="text-3xl font-mono font-bold text-white">
                {stats.winRate.toFixed(1)}%
            </div>
            <div className="text-xs text-neutral-500 mt-1">
                {stats.totalWins} W - {stats.totalLosses} L
            </div>
        </div>

        <div className="bg-vegas-card border border-neutral-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center space-x-3 text-neutral-400 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Net Units</span>
            </div>
            <div className={`text-3xl font-mono font-bold ${stats.totalUnits >= 0 ? 'text-vegas-green' : 'text-vegas-red'}`}>
                {stats.totalUnits > 0 ? '+' : ''}{stats.totalUnits.toFixed(2)}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
                All time performance
            </div>
        </div>

        <div className="bg-vegas-card border border-neutral-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center space-x-3 text-neutral-400 mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">ROI</span>
            </div>
            <div className={`text-3xl font-mono font-bold ${stats.roi >= 0 ? 'text-vegas-green' : 'text-vegas-red'}`}>
                {stats.roi.toFixed(1)}%
            </div>
            <div className="text-xs text-neutral-500 mt-1">
                Return on Investment
            </div>
        </div>

        {/* Chart */}
        <div className="bg-vegas-card border border-neutral-800 rounded-xl p-4 flex flex-col md:col-span-1 hidden md:flex">
             <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4">Profit Trend</span>
             <div className="flex-grow h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorUnits" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00ff41" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#00ff41" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="units" stroke="#00ff41" fillOpacity={1} fill="url(#colorUnits)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
        </div>
    </div>
  );
};

export default StatsDashboard;