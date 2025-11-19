import { supabase } from '../lib/supabaseClient';
import { Prediction, PredictionStatus, Stats, UserProfile } from '../types';

export const dataService = {
  getPredictions: async (): Promise<Prediction[]> => {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching predictions:', error);
      return [];
    }
    return (data || []) as Prediction[];
  },

  createPrediction: async (prediction: Omit<Prediction, 'id' | 'created_at' | 'status'>): Promise<Prediction | null> => {
    const { data, error } = await supabase
      .from('predictions')
      .insert([{
        ...prediction,
        status: PredictionStatus.PENDING,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating prediction:', error);
      return null;
    }
    return data as Prediction;
  },

  updatePrediction: async (id: string, updates: Partial<Omit<Prediction, 'id' | 'created_at'>>): Promise<void> => {
    const { error } = await supabase
      .from('predictions')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating prediction:', error);
      throw error;
    }
  },

  deletePrediction: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('predictions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting prediction:', error);
      throw error;
    }
  },

  updateStatus: async (id: string, status: PredictionStatus, score?: string): Promise<void> => {
    const { error } = await supabase
      .from('predictions')
      .update({ status, result_score: score })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  },

  getUserProfile: async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.warn('Error fetching profile:', error.message);
      return null;
    }
    return data as UserProfile;
  },

  calculateStats: (predictions: Prediction[]): Stats => {
    if (!predictions || !Array.isArray(predictions)) {
        return { winRate: 0, totalUnits: 0, roi: 0, totalWins: 0, totalLosses: 0 };
    }

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
            const decimalOdds = parseFloat(p.odds);
            const oddsVal = !isNaN(decimalOdds) ? decimalOdds : 1.91;
            const profit = p.units * (oddsVal - 1);
            netUnits += profit;
        } else if (p.status === PredictionStatus.LOST) {
            netUnits -= p.units;
        }
    });
    
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