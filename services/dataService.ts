import { INITIAL_PREDICTIONS } from '../constants';
import { Prediction, PredictionStatus, Stats, UserProfile } from '../types';

// In a real app, this would import the supabase client initialized with the keys from constants.ts
// import { createClient } from '@supabase/supabase-js';
// const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let mockPredictions: Prediction[] = [...INITIAL_PREDICTIONS];

export const dataService = {
  getPredictions: async (): Promise<Prediction[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));
    // Sort by date desc
    return [...mockPredictions].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  createPrediction: async (prediction: Omit<Prediction, 'id' | 'created_at' | 'status'>): Promise<Prediction> => {
    const newPred: Prediction = {
      ...prediction,
      id: Math.random().toString(36).substring(7),
      created_at: new Date().toISOString(),
      status: PredictionStatus.PENDING
    };
    mockPredictions = [newPred, ...mockPredictions];
    return newPred;
  },

  updatePrediction: async (id: string, updates: Partial<Omit<Prediction, 'id' | 'created_at'>>): Promise<void> => {
     mockPredictions = mockPredictions.map(p => 
      p.id === id ? { ...p, ...updates } : p
    );
  },

  deletePrediction: async (id: string): Promise<void> => {
    mockPredictions = mockPredictions.filter(p => p.id !== id);
  },

  updateStatus: async (id: string, status: PredictionStatus, score?: string): Promise<void> => {
    mockPredictions = mockPredictions.map(p => 
      p.id === id ? { ...p, status, result_score: score } : p
    );
  },

  calculateStats: (predictions: Prediction[]): Stats => {
    const settled = predictions.filter(p => p.status === PredictionStatus.WON || p.status === PredictionStatus.LOST);
    const wins = settled.filter(p => p.status === PredictionStatus.WON);
    const losses = settled.filter(p => p.status === PredictionStatus.LOST);
    
    const totalWins = wins.length;
    const totalLosses = losses.length;
    const winRate = settled.length > 0 ? (totalWins / settled.length) * 100 : 0;

    let netUnits = 0;
    let totalRisked = 0;

    settled.forEach(p => {
        totalRisked += p.units;
        if (p.status === PredictionStatus.WON) {
            // Decimal Odds Profit Formula: Stake * (Odds - 1)
            const decimalOdds = parseFloat(p.odds);
            // Fallback to 1.91 (standard -110) if parse fails
            const oddsVal = !isNaN(decimalOdds) ? decimalOdds : 1.91;
            const profit = p.units * (oddsVal - 1);
            netUnits += profit;
        } else if (p.status === PredictionStatus.LOST) {
            netUnits -= p.units;
        }
    });
    
    // Simple ROI calc: Net Units / Total Units Risked * 100
    const roi = totalRisked > 0 ? (netUnits / totalRisked) * 100 : 0;

    return {
      winRate,
      totalUnits: netUnits,
      roi,
      totalWins,
      totalLosses
    };
  }
};