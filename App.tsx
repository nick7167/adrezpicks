import React, { useEffect, useState } from 'react';
import { Activity, Shield, LogOut, User, Loader2, Wifi, WifiOff, RefreshCw, Eye, Bell } from 'lucide-react';
import Hero from './components/Hero';
import StatsDashboard from './components/StatsDashboard';
import PredictionCard from './components/PredictionCard';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import { Prediction, Stats, ViewState, Sport, PredictionStatus } from './types';
import { dataService } from './services/dataService';
import { supabase } from './lib/supabaseClient';
import { useAuth } from './contexts/AuthContext';

// -- Toast Notification Component --
interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

const App: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [view, setView] = useState<ViewState>('home');
  
  // Data State
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState<Stats>({ winRate: 0, totalUnits: 0, roi: 0, totalWins: 0, totalLosses: 0 });
  const [loadingData, setLoadingData] = useState(false);
  
  // UI State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // -- Toast Logic --
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: number) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  // -- Data Fetching --
  const fetchPredictions = async () => {
    setLoadingData(true);
    try {
      const preds = await dataService.getPredictions();
      const calculatedStats = dataService.calculateStats(preds);
      setPredictions(preds);
      setStats(calculatedStats);
    } catch (err: any) {
      console.error("Failed to fetch data", err);
      addToast("Connection slow...", 'info');
    } finally {
      setLoadingData(false);
    }
  };

  const loadMockData = () => {
      const mockPredictions: Prediction[] = [
          { id: '1', created_at: new Date().toISOString(), matchup_date: new Date(Date.now() + 86400000).toISOString(), sport: Sport.NBA, matchup: 'Lakers vs Warriors', wager_type: 'Lakers -3.5', odds: '1.91', units: 3, analysis: 'Mock analysis for preview purposes.', is_premium: true, status: PredictionStatus.PENDING },
          { id: '2', created_at: new Date().toISOString(), matchup_date: new Date(Date.now() - 86400000).toISOString(), sport: Sport.NFL, matchup: 'Chiefs vs Bills', wager_type: 'Over 48.5', odds: '1.91', units: 5, analysis: 'Mock analysis.', is_premium: false, status: PredictionStatus.WON, result_score: '35-31' },
      ];
      setPredictions(mockPredictions);
      setStats(dataService.calculateStats(mockPredictions));
      addToast("Demo data loaded", 'info');
  };

  // -- Initial Data Load --
  // We use authLoading to delay this slightly, OR we run it parallel. 
  // Safest is to run it once App mounts.
  useEffect(() => {
    // Only fetch if we are NOT in the initial loading state, 
    // OR if we want to fetch in background.
    if (!authLoading) {
        fetchPredictions();
    }

    // Realtime Listener
    const predictionChannel = supabase
      .channel('public:predictions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'predictions' },
        () => {
          addToast("New data received", 'info');
          fetchPredictions();
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(predictionChannel);
    };
  }, [authLoading]); // Re-run once auth settles

  // -- Handlers --
  const handleUpgrade = () => {
    if (!user) {
      setAuthModalOpen(true);
      addToast("Please sign in to upgrade", 'info');
      return;
    }
    // Integration with Stripe would go here
    window.open('https://stripe.com', '_blank');
  };

  const handleLogout = async () => {
    await signOut();
    setView('home');
    addToast("Signed out successfully", 'success');
  };

  // -- Render Loading State --
  if (authLoading) {
      return (
          <div className="min-h-screen bg-vegas-black flex flex-col items-center justify-center text-white z-[9999] relative">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-neutral-800 border-t-vegas-green rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-vegas-green" />
                </div>
              </div>
              <h2 className="text-xl font-bold tracking-tight mt-6 animate-pulse">VEGAS<span className="text-neutral-500">VAULT</span></h2>
              <p className="text-neutral-600 text-xs mt-2 font-mono animate-in fade-in duration-1000 delay-1000 fill-mode-forwards opacity-0">Establishing Secure Connection...</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-vegas-black text-white font-sans selection:bg-vegas-green selection:text-black">
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        onSuccess={() => addToast("Welcome back!", 'success')}
      />

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
            <div 
                key={toast.id}
                className={`
                    px-4 py-3 rounded shadow-lg border flex items-center gap-3 min-w-[300px] animate-in slide-in-from-right duration-300 pointer-events-auto
                    ${toast.type === 'success' ? 'bg-green-900/90 border-vegas-green text-white' : 
                      toast.type === 'error' ? 'bg-red-900/90 border-vegas-red text-white' : 
                      'bg-neutral-800/90 border-neutral-700 text-white'}
                `}
            >
                {toast.type === 'success' && <Activity className="w-4 h-4 text-vegas-green" />}
                {toast.type === 'error' && <Bell className="w-4 h-4 text-vegas-red" />}
                {toast.type === 'info' && <Bell className="w-4 h-4 text-blue-400" />}
                <span className="text-sm font-medium">{toast.message}</span>
            </div>
        ))}
      </div>

      {/* Navigation */}
      <nav className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div 
                className="flex items-center space-x-2 cursor-pointer group"
                onClick={() => setView('home')}
            >
                <Activity className="text-vegas-green group-hover:scale-110 transition-transform" />
                <span className="font-bold text-xl tracking-tight">VEGAS<span className="text-neutral-400">VAULT</span></span>
            </div>

            <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center space-x-1 text-[10px] font-mono uppercase tracking-wider text-neutral-600">
                   {realtimeConnected ? (
                       <>
                        <Wifi className="w-3 h-3 text-vegas-green" />
                        <span className="text-vegas-green/50">Live</span>
                       </>
                   ) : (
                       <>
                        <WifiOff className="w-3 h-3" />
                        <span>Offline</span>
                       </>
                   )}
                </div>

                {user?.is_admin && (
                    <button 
                        onClick={() => setView('admin')}
                        className={`text-sm font-bold flex items-center space-x-1 transition-colors ${view === 'admin' ? 'text-vegas-green' : 'text-neutral-400 hover:text-white'}`}
                    >
                        <Shield className="w-4 h-4" />
                        <span className="hidden sm:inline">ADMIN</span>
                    </button>
                )}
                
                {user ? (
                    <div className="flex items-center space-x-4 pl-4 border-l border-neutral-800">
                        <div className="flex items-center space-x-2 text-sm text-neutral-400">
                            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700">
                                <User className="w-4 h-4" />
                            </div>
                            <div className="hidden md:flex flex-col">
                                <span className="text-xs text-neutral-500">Logged in as</span>
                                <span className="text-xs font-bold text-white truncate max-w-[100px]">{user.email}</span>
                            </div>
                            {user.subscription_status === 'active' && (
                                <span className="px-1.5 py-0.5 bg-vegas-green text-black text-[10px] font-bold rounded shadow-[0_0_10px_rgba(0,255,65,0.3)]">PRO</span>
                            )}
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="text-neutral-400 hover:text-white transition-colors p-2 hover:bg-neutral-800 rounded-full"
                            title="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setAuthModalOpen(true)}
                        className="px-5 py-2 bg-neutral-100 hover:bg-white text-black text-sm font-bold rounded transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                    >
                        Sign In
                    </button>
                )}
            </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 pb-20">
        {view === 'admin' ? (
            <div className="py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-white">Admin Console</h2>
                        <p className="text-neutral-500 text-sm mt-1">Manage picks and settle results.</p>
                    </div>
                    <button onClick={fetchPredictions} className="text-sm text-vegas-green hover:text-green-400 flex items-center bg-vegas-green/5 px-4 py-2 rounded border border-vegas-green/20">
                        <RefreshCw className="w-3 h-3 mr-2" /> Refresh Data
                    </button>
                </div>
                <AdminPanel predictions={predictions} onUpdate={() => { fetchPredictions(); addToast("Prediction updated", "success"); }} />
            </div>
        ) : (
            <>
                <Hero onSubscribe={handleUpgrade} />
                
                <StatsDashboard stats={stats} predictions={predictions} />
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                    <div className="lg:col-span-2">
                         <div className="flex items-center justify-between mb-6 border-b border-neutral-800 pb-4">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-vegas-green" /> 
                                Recent Picks
                            </h2>
                            {loadingData && <Loader2 className="w-4 h-4 animate-spin text-vegas-green" />}
                        </div>
                        
                        <div className="space-y-4 min-h-[200px]">
                            {loadingData && predictions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-neutral-500 bg-neutral-900/20 rounded border border-neutral-800 border-dashed">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2 text-vegas-green" />
                                    <p>Loading intel...</p>
                                </div>
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
                                <div className="text-center py-20 text-neutral-600 bg-neutral-900/20 rounded border border-neutral-800 border-dashed flex flex-col items-center">
                                    <Activity className="w-10 h-10 text-neutral-700 mb-3" />
                                    <h3 className="text-white font-bold mb-1">No Active Picks</h3>
                                    <p className="text-sm text-neutral-500 mb-6 max-w-xs">The database is currently empty. Create a pick in Admin or load demo data.</p>
                                    
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={fetchPredictions}
                                            className="text-xs text-white hover:text-vegas-green flex items-center border border-neutral-700 px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors"
                                        >
                                            <RefreshCw className="w-3 h-3 mr-2" /> Retry Connection
                                        </button>
                                        <button 
                                            onClick={loadMockData}
                                            className="text-xs text-vegas-green hover:text-black hover:bg-vegas-green flex items-center border border-vegas-green/30 px-4 py-2 rounded bg-vegas-green/5 transition-all duration-300"
                                        >
                                            <Eye className="w-3 h-3 mr-2" /> Load Demo Data
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 sticky top-24 backdrop-blur-sm">
                            <h3 className="text-xl font-bold text-white mb-4">Pro Membership</h3>
                            <div className="w-full h-px bg-gradient-to-r from-vegas-green to-transparent opacity-30 mb-4"></div>
                            <ul className="space-y-3 text-neutral-300 text-sm mb-6">
                                <li className="flex items-center space-x-3">
                                    <div className="p-1 bg-vegas-green/10 rounded-full"><CheckIcon /></div> <span>Daily High-Confidence Picks</span>
                                </li>
                                <li className="flex items-center space-x-3">
                                    <div className="p-1 bg-vegas-green/10 rounded-full"><CheckIcon /></div> <span>Detailed Write-ups</span>
                                </li>
                                <li className="flex items-center space-x-3">
                                    <div className="p-1 bg-vegas-green/10 rounded-full"><CheckIcon /></div> <span>SMS/Email Alerts</span>
                                </li>
                            </ul>
                            {user?.subscription_status === 'active' ? (
                                <div className="w-full py-3 bg-vegas-green/10 text-vegas-green font-bold text-center rounded border border-vegas-green/20 flex items-center justify-center">
                                    <Shield className="w-4 h-4 mr-2" /> Plan Active
                                </div>
                            ) : (
                                <button 
                                    onClick={handleUpgrade}
                                    className="w-full py-3 bg-white hover:bg-neutral-200 text-black font-bold rounded transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                >
                                    Join for $29/mo
                                </button>
                            )}
                            <p className="text-xs text-neutral-600 text-center mt-4">Cancel anytime. 7-day money back guarantee.</p>
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
    <svg className="w-3 h-3 text-vegas-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
);

export default App;