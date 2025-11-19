import React, { useState } from 'react';
import { Lock, CheckCircle2, XCircle, MinusCircle, CalendarClock, FileText, X } from 'lucide-react';
import { Prediction, PredictionStatus, UserProfile } from '../types';

interface PredictionCardProps {
  prediction: Prediction;
  user: UserProfile | null;
  onUpgrade: () => void;
}

const PredictionCard: React.FC<PredictionCardProps> = ({ prediction, user, onUpgrade }) => {
  const [showModal, setShowModal] = useState(false);

  const isPremium = prediction.is_premium;
  const isLocked = isPremium && (!user || user.subscription_status !== 'active');
  const isPending = prediction.status === PredictionStatus.PENDING;
  
  // Format Match Date
  const matchDate = new Date(prediction.matchup_date);
  const dateStr = matchDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const timeStr = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isFuture = matchDate.getTime() > Date.now();

  // Analysis Text Logic
  const CHAR_LIMIT = 150; // Shorter limit for preview
  const isLongText = prediction.analysis.length > CHAR_LIMIT;
  
  // Text Display Logic
  let displayAnalysis = prediction.analysis;
  if (isLocked) {
      // If locked, hard truncate to keep card size uniform, blurring handles the visual cue
      if (prediction.analysis.length > 250) {
          displayAnalysis = prediction.analysis.substring(0, 250) + '...';
      }
  } else if (isLongText) {
      // If unlocked and long, show preview
      displayAnalysis = prediction.analysis.substring(0, CHAR_LIMIT) + '...';
  }

  const getBorderColor = () => {
    if (isPending) return 'border-neutral-800';
    switch (prediction.status) {
      case PredictionStatus.WON: return 'border-vegas-green shadow-[0_0_10px_rgba(0,255,65,0.15)]';
      case PredictionStatus.LOST: return 'border-vegas-red shadow-[0_0_10px_rgba(255,26,26,0.15)]';
      case PredictionStatus.PUSH: return 'border-neutral-500';
      default: return 'border-neutral-800';
    }
  };

  const getStatusIcon = () => {
    if (isPending) return <span className="text-xs font-mono text-yellow-500 animate-pulse">PENDING</span>;
    switch (prediction.status) {
      case PredictionStatus.WON: return <CheckCircle2 className="w-5 h-5 text-vegas-green" />;
      case PredictionStatus.LOST: return <XCircle className="w-5 h-5 text-vegas-red" />;
      case PredictionStatus.PUSH: return <MinusCircle className="w-5 h-5 text-neutral-400" />;
      default: return null;
    }
  };

  return (
    <>
        <div className={`relative bg-vegas-card border ${getBorderColor()} rounded-xl overflow-hidden transition-all duration-300 hover:translate-y-[-2px]`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50">
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold tracking-tighter text-neutral-400">
                    {prediction.sport}
                </div>
                <div className="flex flex-col">
                    <div className={`flex items-center space-x-1.5 text-xs font-mono mb-0.5 ${isFuture ? 'text-vegas-gold' : 'text-neutral-500'}`}>
                        <CalendarClock className="w-3 h-3" />
                        <span>{dateStr}</span>
                        <span className="text-neutral-700">•</span>
                        <span>{timeStr}</span>
                    </div>
                    <span className="text-sm font-bold text-white">{prediction.matchup}</span>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                {isPremium && (
                    <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase tracking-wider rounded border border-yellow-500/20">
                        Premium
                    </span>
                )}
                {getStatusIcon()}
            </div>
        </div>

        {/* Content */}
        <div className="p-4 relative">
            {isLocked ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-950/60 backdrop-blur-md p-6 text-center">
                    <Lock className="w-8 h-8 text-vegas-green mb-3" />
                    <h3 className="text-white font-bold text-lg mb-1">Premium Pick</h3>
                    <p className="text-neutral-400 text-sm mb-4">Subscribe to unlock this high-confidence play.</p>
                    <button 
                        onClick={onUpgrade}
                        className="bg-vegas-green text-black font-bold px-6 py-2 rounded hover:bg-green-400 transition-colors text-sm shadow-[0_0_15px_rgba(0,255,65,0.3)]"
                    >
                        Unlock Now
                    </button>
                </div>
            ) : null}

            <div className={`space-y-4 ${isLocked ? 'blur-sm opacity-50 select-none' : ''}`}>
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Pick</p>
                        <p className="text-xl font-bold text-white font-mono">{prediction.wager_type}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Odds</p>
                        <div className="bg-neutral-800 px-2 py-1 rounded text-neutral-200 font-mono text-sm">
                            {prediction.odds}
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-1.5 w-8 rounded-full ${i < prediction.units ? 'bg-vegas-green' : 'bg-neutral-800'}`} 
                        />
                    ))}
                    <span className="text-xs text-neutral-400 ml-2 font-mono">{prediction.units} UNIT{prediction.units > 1 ? 'S' : ''}</span>
                </div>

                <div className="pt-4 border-t border-neutral-800">
                    <p className="text-neutral-500 text-xs uppercase tracking-wider mb-2">Analysis</p>
                    
                    <div className="relative">
                        <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-line">
                            {displayAnalysis}
                        </p>
                    </div>

                    {/* Read More Modal Trigger */}
                    {isLongText && !isLocked && (
                        <button 
                            onClick={() => setShowModal(true)}
                            className="mt-3 text-xs font-bold text-vegas-green hover:text-green-400 transition-colors flex items-center group border border-vegas-green/30 rounded px-3 py-1.5 bg-vegas-green/5 hover:bg-vegas-green/10 w-fit"
                        >
                            Read Full Analysis <FileText className="w-3 h-3 ml-2" />
                        </button>
                    )}
                </div>
                
                {!isPending && prediction.result_score && (
                    <div className="mt-4 bg-neutral-900 rounded p-2 text-center border border-neutral-800">
                        <span className="text-xs text-neutral-500 uppercase">Final Score: </span>
                        <span className="text-sm font-mono text-white ml-2">{prediction.result_score}</span>
                    </div>
                )}
            </div>
        </div>
        </div>

        {/* Full Analysis Modal */}
        {showModal && (
            <div 
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => setShowModal(false)}
            >
                <div 
                    className="bg-vegas-card border border-neutral-700 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900">
                        <div>
                            <div className="text-xs text-vegas-gold font-mono mb-1">{dateStr} • {timeStr}</div>
                            <h3 className="text-white font-bold text-lg">{prediction.matchup}</h3>
                        </div>
                        <button 
                            onClick={() => setShowModal(false)}
                            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Modal Content */}
                    <div className="p-6 overflow-y-auto">
                        <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b border-neutral-800">
                            <div>
                                <span className="text-xs text-neutral-500 uppercase block mb-1">Pick</span>
                                <span className="text-white font-bold font-mono bg-neutral-800 px-2 py-1 rounded">{prediction.wager_type}</span>
                            </div>
                            <div>
                                <span className="text-xs text-neutral-500 uppercase block mb-1">Odds</span>
                                <span className="text-white font-bold font-mono bg-neutral-800 px-2 py-1 rounded">{prediction.odds}</span>
                            </div>
                            <div>
                                <span className="text-xs text-neutral-500 uppercase block mb-1">Confidence</span>
                                <span className="text-vegas-green font-bold font-mono">{prediction.units} Units</span>
                            </div>
                        </div>

                        <div className="prose prose-invert max-w-none">
                            <h4 className="text-sm font-bold text-neutral-500 uppercase mb-3">Full Analysis</h4>
                            <p className="text-neutral-200 leading-relaxed whitespace-pre-line text-base">
                                {prediction.analysis}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

export default PredictionCard;