import React, { useState } from 'react';
import { Prediction, Sport, PredictionStatus } from '../types';
import { dataService } from '../services/dataService';
import { Save, Check, X, CircleDot, Pencil, Trash2, Loader2 } from 'lucide-react';

interface AdminPanelProps {
  predictions: Prediction[];
  onUpdate: () => void;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const getNowLocalISO = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
};

const AdminPanel: React.FC<AdminPanelProps> = ({ predictions, onUpdate, triggerToast }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    sport: Sport.NBA,
    matchup: '',
    matchup_date: getNowLocalISO(),
    wager_type: '',
    odds: '1.91',
    units: 1,
    analysis: '',
    is_premium: false
  });

  const resetForm = () => {
    setFormData({
        sport: Sport.NBA,
        matchup: '',
        matchup_date: getNowLocalISO(),
        wager_type: '',
        odds: '1.91',
        units: 1,
        analysis: '',
        is_premium: false
    });
    setEditingId(null);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        // Ensure date is stored as proper ISO string with timezone info
        const isoDate = formData.matchup_date 
            ? new Date(formData.matchup_date).toISOString() 
            : new Date().toISOString();

        const submissionData = {
            ...formData,
            matchup_date: isoDate
        };
        
        if (editingId) {
            await dataService.updatePrediction(editingId, submissionData);
            triggerToast("Prediction updated successfully", "success");
        } else {
            await dataService.createPrediction(submissionData);
            triggerToast("Prediction published to feed", "success");
        }
        
        resetForm();
        onUpdate();
    } catch (error: any) {
        console.error("Submit error:", error);
        triggerToast(`Error: ${error.message || "Failed to save"}`, "error");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleEdit = (prediction: Prediction) => {
    // Convert UTC ISO string back to local datetime-local format for input
    const date = new Date(prediction.matchup_date);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    const localIso = date.toISOString().slice(0, 16);

    setFormData({
        sport: prediction.sport,
        matchup: prediction.matchup,
        matchup_date: localIso,
        wager_type: prediction.wager_type,
        odds: prediction.odds,
        units: prediction.units,
        analysis: prediction.analysis,
        is_premium: prediction.is_premium
    });
    setEditingId(prediction.id);
    setActiveTab('create');
    triggerToast("Editing mode enabled", "info");
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this prediction?")) {
        try {
            await dataService.deletePrediction(id);
            triggerToast("Prediction deleted", "info");
            onUpdate();
        } catch (e) {
            triggerToast("Failed to delete", "error");
        }
    }
  };

  const handleSettle = async (id: string, status: PredictionStatus, score: string) => {
      try {
        await dataService.updateStatus(id, status, score);
        triggerToast(`Marked as ${status}`, status === 'won' ? 'success' : 'info');
        onUpdate();
      } catch (e) {
        triggerToast("Failed to settle bet", "error");
      }
  };

  const pendingPredictions = predictions.filter(p => p.status === PredictionStatus.PENDING);

  return (
    <div className="max-w-4xl mx-auto bg-vegas-card border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="flex border-b border-neutral-800">
            <button 
                onClick={() => { setActiveTab('create'); resetForm(); }}
                className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'create' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:bg-neutral-900'}`}
            >
                {editingId ? 'Edit Pick' : 'Post New Pick'}
            </button>
            <button 
                onClick={() => { setActiveTab('manage'); resetForm(); }}
                className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'manage' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:bg-neutral-900'}`}
            >
                Manage Results ({pendingPredictions.length})
            </button>
        </div>

        <div className="p-8">
            {activeTab === 'create' ? (
                <form onSubmit={handleCreateOrUpdate} className="space-y-6">
                     {editingId && (
                         <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded text-yellow-500 text-sm flex justify-between items-center animate-in fade-in">
                             <span>You are currently editing an existing prediction.</span>
                             <button type="button" onClick={resetForm} className="text-xs underline hover:text-yellow-400">Cancel Edit</button>
                         </div>
                     )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Sport</label>
                            <select 
                                value={formData.sport} 
                                onChange={e => setFormData({...formData, sport: e.target.value as Sport})}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white focus:border-vegas-green outline-none transition-colors"
                            >
                                {Object.values(Sport).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Game Date & Time</label>
                            <input 
                                type="datetime-local"
                                value={formData.matchup_date}
                                onChange={e => setFormData({...formData, matchup_date: e.target.value})}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white focus:border-vegas-green outline-none [color-scheme:dark] transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Matchup</label>
                            <input 
                                type="text"
                                placeholder="e.g. Lakers vs Warriors"
                                value={formData.matchup}
                                onChange={e => setFormData({...formData, matchup: e.target.value})}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white focus:border-vegas-green outline-none transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Wager Type</label>
                            <input 
                                type="text"
                                placeholder="e.g. Lakers -4.5"
                                value={formData.wager_type}
                                onChange={e => setFormData({...formData, wager_type: e.target.value})}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white focus:border-vegas-green outline-none transition-colors"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Odds (Decimal)</label>
                                <input 
                                    type="text"
                                    placeholder="e.g. 1.91"
                                    value={formData.odds}
                                    onChange={e => setFormData({...formData, odds: e.target.value})}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white focus:border-vegas-green outline-none transition-colors"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Units (1-5)</label>
                                <input 
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={formData.units}
                                    onChange={e => setFormData({...formData, units: Number(e.target.value)})}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white focus:border-vegas-green outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Analysis</label>
                        <textarea 
                            rows={4}
                            value={formData.analysis}
                            onChange={e => setFormData({...formData, analysis: e.target.value})}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white focus:border-vegas-green outline-none transition-colors"
                            placeholder="Why are we taking this bet?"
                            required
                        />
                    </div>

                    <div className="flex items-center space-x-3 bg-neutral-900/50 p-4 rounded border border-neutral-800">
                        <input 
                            type="checkbox" 
                            id="isPremium"
                            checked={formData.is_premium}
                            onChange={e => setFormData({...formData, is_premium: e.target.checked})}
                            className="w-5 h-5 accent-vegas-green bg-neutral-950 border-neutral-800 rounded cursor-pointer"
                        />
                        <div>
                            <label htmlFor="isPremium" className="text-sm text-white font-bold cursor-pointer select-none">Mark as Premium Content</label>
                            <p className="text-xs text-neutral-500">Only active subscribers will see this pick.</p>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="flex-1 bg-vegas-green text-black font-bold uppercase tracking-wider py-4 rounded hover:bg-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-[0_0_15px_rgba(0,255,65,0.2)] hover:shadow-[0_0_25px_rgba(0,255,65,0.4)]"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                editingId ? 'Update Prediction' : 'Publish Prediction'
                            )}
                        </button>
                         {editingId && (
                            <button type="button" onClick={resetForm} className="px-8 bg-neutral-800 text-white font-bold uppercase tracking-wider py-4 rounded hover:bg-neutral-700 transition-colors">
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            ) : (
                <div className="space-y-4">
                    {pendingPredictions.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-neutral-800 rounded-xl bg-neutral-900/20">
                            <p className="text-neutral-500">No pending predictions.</p>
                            <button onClick={() => setActiveTab('create')} className="text-vegas-green text-sm font-bold mt-2 hover:underline">Create One</button>
                        </div>
                    ) : (
                        pendingPredictions.map(p => (
                            <div key={p.id} className="bg-neutral-950 border border-neutral-800 p-4 rounded flex flex-col md:flex-row justify-between items-center gap-4 transition-all hover:border-neutral-700">
                                <div>
                                    <div className="text-xs text-neutral-500 mb-1">{p.sport} • {new Date(p.matchup_date).toLocaleString()}</div>
                                    <div className="font-bold text-white text-lg">{p.matchup}</div>
                                    <div className="text-sm text-neutral-400 font-mono">{p.wager_type} <span className="text-neutral-600">@</span> {p.odds}</div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center space-x-2">
                                        <button 
                                            onClick={() => handleSettle(p.id, PredictionStatus.WON, prompt('Score?', '0-0') || '')}
                                            className="flex items-center space-x-1 px-3 py-2 bg-green-900/20 text-green-500 border border-green-900/50 hover:bg-green-900/40 hover:border-green-500/50 rounded transition-all"
                                        >
                                            <Check className="w-4 h-4" /> <span>Win</span>
                                        </button>
                                        <button 
                                            onClick={() => handleSettle(p.id, PredictionStatus.LOST, prompt('Score?', '0-0') || '')}
                                            className="flex items-center space-x-1 px-3 py-2 bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/40 hover:border-red-500/50 rounded transition-all"
                                        >
                                            <X className="w-4 h-4" /> <span>Loss</span>
                                        </button>
                                        <button 
                                            onClick={() => handleSettle(p.id, PredictionStatus.PUSH, 'Push')}
                                            className="flex items-center space-x-1 px-3 py-2 bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700 rounded transition-all"
                                        >
                                            <CircleDot className="w-4 h-4" /> <span>Push</span>
                                        </button>
                                    </div>
                                    <div className="flex items-center space-x-4 pt-1">
                                         <button onClick={() => handleEdit(p)} className="text-xs text-neutral-400 hover:text-vegas-green flex items-center transition-colors">
                                            <Pencil className="w-3 h-3 mr-1" /> Edit
                                         </button>
                                         <button onClick={() => handleDelete(p.id)} className="text-xs text-neutral-400 hover:text-red-500 flex items-center transition-colors">
                                            <Trash2 className="w-3 h-3 mr-1" /> Delete
                                         </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default AdminPanel;