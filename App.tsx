import React, { useEffect, useState } from 'react';
import { Activity, Shield, LogIn, LogOut, User } from 'lucide-react';
import Hero from './components/Hero';
import StatsDashboard from './components/StatsDashboard';
import PredictionCard from './components/PredictionCard';
import AdminPanel from './components/AdminPanel';
import { Prediction, UserProfile, Stats, ViewState } from './types';
import { dataService } from './services/dataService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState<Stats>({ winRate: 0, totalUnits: 0, roi: 0, totalWins: 0, totalLosses: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const preds = await dataService.getPredictions();
    const calculatedStats = dataService.calculateStats(preds);
    setPredictions(preds);
    setStats(calculatedStats);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Mock Authentication Handlers
  const handleLogin = (role: 'admin' | 'user') => {
    if (role === 'admin') {
        setUser({
            id: 'admin1',
            email: 'admin@vegasvault.com',
            is_admin: true,
            subscription_status: 'active'
        });
        setView('admin');
    } else {
        setUser({
            id: 'user1',
            email: 'user@example.com',
            is_admin: false,
            subscription_status: 'inactive' // Default to free user
        });
        setView('home');
    }
  };

  const handleUpgrade = () => {
    if (!user) {
        alert("Please login first.");
        return;
    }
    const confirm = window.confirm("Simulate Stripe Payment Success?");
    if (confirm) {
        setUser({ ...user, subscription_status: 'active' });
        alert("Subscription Active! You can now see Premium Picks.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('home');
  };

  return (
    <div className="min-h-screen bg-vegas-black text-white font-sans selection:bg-vegas-green selection:text-black">
      {/* Navigation */}
      <nav className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div 
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => setView('home')}
            >
                <Activity className="text-vegas-green" />
                <span className="font-bold text-xl tracking-tight">VEGAS<span className="text-neutral-400">VAULT</span></span>
            </div>

            <div className="flex items-center space-x-4">
                {user?.is_admin && (
                    <button 
                        onClick={() => setView('admin')}
                        className={`text-sm font-bold flex items-center space-x-1 ${view === 'admin' ? 'text-vegas-green' : 'text-neutral-400 hover:text-white'}`}
                    >
                        <Shield className="w-4 h-4" />
                        <span>ADMIN</span>
                    </button>
                )}
                
                {user ? (
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-sm text-neutral-400">
                            <User className="w-4 h-4" />
                            <span className="hidden md:inline">{user.email}</span>
                            {user.subscription_status === 'active' && (
                                <span className="px-1.5 py-0.5 bg-vegas-green text-black text-[10px] font-bold rounded">PRO</span>
                            )}
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="text-neutral-400 hover:text-white"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center space-x-3">
                         <button 
                            onClick={() => handleLogin('user')}
                            className="text-sm text-neutral-400 hover:text-white font-medium"
                        >
                            Login
                        </button>
                        <button 
                            onClick={() => handleLogin('admin')}
                            className="text-xs text-neutral-600 hover:text-neutral-400"
                        >
                            (Demo Admin)
                        </button>
                    </div>
                )}
            </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 pb-20">
        {view === 'admin' ? (
            <div className="py-10">
                 <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-3xl font-bold text-white">Admin Console</h2>
                </div>
                <AdminPanel predictions={predictions} onUpdate={fetchData} />
            </div>
        ) : (
            <>
                <Hero onSubscribe={handleUpgrade} />
                
                <StatsDashboard stats={stats} predictions={predictions} />
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                    <div className="lg:col-span-2">
                         <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Recent Picks</h2>
                            <div className="flex items-center space-x-2 text-sm text-neutral-500">
                                <span className="w-2 h-2 bg-vegas-green rounded-full animate-pulse"></span>
                                <span>Live Feed</span>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-center py-20 text-neutral-600 animate-pulse">Loading data...</div>
                            ) : predictions.length > 0 ? (
                                predictions.map(prediction => (
                                    <PredictionCard 
                                        key={prediction.id} 
                                        prediction={prediction} 
                                        user={user}
                                        onUpgrade={handleUpgrade}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-20 text-neutral-600">No picks published yet.</div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 sticky top-24">
                            <h3 className="text-xl font-bold text-white mb-4">Membership</h3>
                            <ul className="space-y-3 text-neutral-400 text-sm mb-6">
                                <li className="flex items-center space-x-2">
                                    <CheckIcon /> <span>Daily Premium Picks</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <CheckIcon /> <span>Full Analysis & Writeups</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <CheckIcon /> <span>Real-time Notification</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <CheckIcon /> <span>Bankroll Management Guide</span>
                                </li>
                            </ul>
                            {user?.subscription_status === 'active' ? (
                                <div className="w-full py-3 bg-neutral-800 text-neutral-400 font-bold text-center rounded border border-neutral-700">
                                    Plan Active
                                </div>
                            ) : (
                                <button 
                                    onClick={handleUpgrade}
                                    className="w-full py-3 bg-white hover:bg-neutral-200 text-black font-bold rounded transition-colors"
                                >
                                    Join for $29/mo
                                </button>
                            )}
                            <p className="text-[10px] text-neutral-600 text-center mt-4">
                                Secured by Stripe. Cancel anytime.
                            </p>
                        </div>
                    </div>
                </div>
            </>
        )}
      </main>
    </div>
  );
};

const CheckIcon = () => (
    <svg className="w-4 h-4 text-vegas-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

export default App;