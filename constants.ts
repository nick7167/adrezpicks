import { Prediction, PredictionStatus, Sport } from './types';

// Provided keys
export const SUPABASE_URL = "https://ozlhvvxivcjeatrvdsqx.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96bGh2dnhpdmNqZWF0cnZkc3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MTkxNTcsImV4cCI6MjA3OTA5NTE1N30.JdCZphG70zrBd3cSv_mZS0Grme1oBKjxJcBuz_UMoR0";
export const STRIPE_PUBLISHABLE_KEY = "pk_test_51SV8RkQ12dqc2hKRZfpj57ulLjnOHunyTAEMVFPYVmq360UU9upe6v9SUFvIKAR5x1yLPLVBfsyQ52Be9VoV5WSU00hrCmA4wF";

export const APP_NAME = "VegasVault";

// Mock Initial Data to populate the app immediately
export const INITIAL_PREDICTIONS: Prediction[] = [
  {
    id: '1',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    matchup_date: new Date(Date.now() - 86400000 * 1.8).toISOString(),
    sport: Sport.NBA,
    matchup: 'Lakers vs Warriors',
    wager_type: 'Lakers -4.5',
    odds: '1.91',
    units: 3,
    analysis: 'LeBron is resting, but AD is active. The line has moved too far. Taking value on LA at home.',
    is_premium: false,
    status: PredictionStatus.WON,
    result_score: '112-104'
  },
  {
    id: '2',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    matchup_date: new Date(Date.now() - 86400000 * 0.5).toISOString(),
    sport: Sport.NFL,
    matchup: 'Chiefs vs Bills',
    wager_type: 'Over 48.5',
    odds: '1.95',
    units: 5, // Max play
    analysis: 'Both offenses are firing on all cylinders. Weather is clear. This is a shootout waiting to happen.',
    is_premium: true,
    status: PredictionStatus.LOST,
    result_score: '20-17'
  },
  {
    id: '3',
    created_at: new Date().toISOString(),
    matchup_date: new Date(Date.now() + 86400000 * 2).toISOString(), // Future
    sport: Sport.UFC,
    matchup: 'Jones vs Miocic',
    wager_type: 'Jones by KO/TKO',
    odds: '2.50',
    units: 2,
    analysis: 'Jones has the reach and the versatility. Miocic has been inactive for too long.',
    is_premium: true,
    status: PredictionStatus.PENDING,
  },
  {
    id: '4',
    created_at: new Date().toISOString(),
    matchup_date: new Date(Date.now() + 3600000 * 5).toISOString(), // 5 hours from now
    sport: Sport.MLB,
    matchup: 'Yankees vs Red Sox',
    wager_type: 'Yankees ML',
    odds: '1.77',
    units: 3,
    analysis: 'Cole is on the mound. Bullpen is rested. Solid spot for NYY.',
    is_premium: false,
    status: PredictionStatus.PENDING,
  },
  {
    id: '5',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    matchup_date: new Date(Date.now() - 86400000 * 2.5).toISOString(),
    sport: Sport.NBA,
    matchup: 'Celtics vs Heat',
    wager_type: 'Heat +8.5',
    odds: '1.91',
    units: 4,
    analysis: 'Heat culture in playoffs. They keep it close.',
    is_premium: true,
    status: PredictionStatus.WON,
    result_score: '105-102'
  }
];