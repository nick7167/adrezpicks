export enum Sport {
  NBA = 'NBA',
  NFL = 'NFL',
  MLB = 'MLB',
  NHL = 'NHL',
  UFC = 'UFC',
  SOCCER = 'SOCCER'
}

export enum PredictionStatus {
  PENDING = 'pending',
  WON = 'won',
  LOST = 'lost',
  PUSH = 'push'
}

export interface Prediction {
  id: string;
  created_at: string;
  matchup_date: string; // ISO string for the actual game time
  sport: Sport;
  matchup: string;
  wager_type: string; // e.g. "Lakers -4.5"
  odds: string; // e.g. "1.91"
  units: number; // 1-5
  analysis: string;
  is_premium: boolean;
  status: PredictionStatus;
  result_score?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  is_admin: boolean;
  subscription_status: 'active' | 'inactive' | 'none';
  stripe_customer_id?: string;
}

export interface Stats {
  winRate: number;
  totalUnits: number;
  roi: number;
  totalWins: number;
  totalLosses: number;
}

export type ViewState = 'home' | 'admin' | 'auth';