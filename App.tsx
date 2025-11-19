import React, { useEffect, useState } from 'react';
import { Activity, Shield, LogOut, User, Loader2, Wifi, WifiOff, AlertCircle, RefreshCw, Database, Copy, Eye } from 'lucide-react';
import Hero from './components/Hero';
import StatsDashboard from './components/StatsDashboard';
import PredictionCard from './components/PredictionCard';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import { Prediction, UserProfile, Stats, ViewState, Sport, PredictionStatus } from './types';
import { dataService } from './services/dataService';
import { supabase } from './lib/supabaseClient';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  
  // Auth State
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Data State
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState<Stats>({ winRate: 0, totalUnits: 0, roi: 0, totalWins: 0, totalLosses: 0 });
  const [loadingData, setLoadingData] = useState(false);
  
  // UI State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  
  // --- 1. DATA FETCHING ---
  const fetchPredictions = async () => {
    setLoadingData(true);
    try {
      const preds = await dataService.getPredictions();
      const calculatedStats = dataService.calculateStats(preds);
      setPredictions(preds);
      setStats(calculatedStats);
    } catch (err: any) {
      console.error("Failed to fetch data", err);
      setPredictions([]);
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
  };

  // --- 2. AUTHENTICATION BOOTSTRAP ---
  useEffect(() => {
    const initializeApp = async () => {
      setIsAuthInitializing(true);
      
      // A. Check for active session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log("Session found, fetching profile...");
        const profile = await dataService.getUserProfile(session.user.id);
        
        if (profile) {
            setUser(profile);
        } else {
            // Fallback if profile table is missing or trigger failed
            console.warn("Profile not found, using fallback.");
            setUser({
                id: session.user.id,
                email: session.user.email || '',
                is_admin: false,
                subscription_status: 'none'
            });
        }
      } else {
          console.log("No session found.");
      }

      // B. Initial Data Load (happens regardless of auth status)
      await fetchPredictions();
      
      setIsAuthInitializing(false);
    };

    initializeApp();

    // C. Set up Listeners
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event);
      
      if (event === 'SIGNED_IN' && session) {
         // Refetch profile to ensure we have latest rights
         const profile = await dataService.getUserProfile(session.user.id);
         setUser(profile || {
             id: session.user.id,
             email: session.user.email || '',
             is_admin: false,
             subscription_status: 'none'
         });
      } else if (event === 'SIGNED_OUT') {
         setUser(null);
         setView('home');
      }
    });

    // D. Realtime Data Listener
    const predictionChannel = supabase
      .channel('public:predictions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'predictions' },
        (payload) => {
          console.log('Real-time update:', payload);
          fetchPredictions();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeConnected(true);
        else setRealtimeConnected(false);
      });

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(predictionChannel);
    };
  }, []);

  const handleUpgrade = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    alert("Redirecting to Stripe Checkout...");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // State update handled by onAuthStateChange listener
  };

  // --- RENDER ---

  if (isAuthInitializing) {
      return (
          <div className="min-h-screen bg-vegas-black flex flex-col items-center justify-center text-white">
              <Loader2 className="w-12 h-12 text-vegas-green animate-spin mb-4" />
              <h2 className="text-xl font-bold tracking-tight">Initializing VegasVault</h2>
              <p className="text-neutral-500 text-sm mt-2">Connecting to secure database...</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-vegas-black text-white font-sans selection:bg-vegas-green selection:text-black">
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

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
                    <button 
                        onClick={() => setAuthModalOpen(true)}
                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-bold rounded transition-colors"
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
                    <h2 className="text-3xl font-bold text-white">Admin Console</h2>
                    <button onClick={fetchPredictions} className="text-sm text-vegas-green hover:underline">Refresh Data</button>
                </div>
                <AdminPanel predictions={predictions} onUpdate={fetchPredictions} />
            </div>
        ) : (
            <>
                <Hero onSubscribe={handleUpgrade} />
                
                <StatsDashboard stats={stats} predictions={predictions} />
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                    <div className="lg:col-span-2">
                         <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Recent Picks</h2>
                            {loadingData && <Loader2 className="w-4 h-4 animate-spin text-vegas-green" />}
                        </div>
                        
                        <div className="space-y-4 min-h-[200px]">
                            {loadingData ? (
                                <div className="flex flex-col items-center justify-center py-12 text-neutral-500 bg-neutral-900/20 rounded border border-neutral-800 border-dashed">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2 text-vegas-green" />
                                    <p>Loading predictions...</p>
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
                                    <p>No active predictions found.</p>
                                    <p className="text-xs mt-2 mb-4 text-neutral-500">The database might be empty or waking up.</p>
                                    
                                    <button 
                                        onClick={loadMockData}
                                        className="text-xs text-vegas-green hover:underline flex items-center border border-vegas-green/30 px-3 py-2 rounded bg-vegas-green/5 hover:bg-vegas-green/10"
                                    >
                                        <Eye className="w-3 h-3 mr-2" /> Load Demo Data
                                    </button>
                                </div>
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