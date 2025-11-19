import { Prediction, PredictionStatus, Sport } from './types';

// Hardcoded Fallbacks
const DEFAULT_SUPABASE_URL = "https://ozlhvvxivcjeatrvdsqx.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96bGh2dnhpdmNqZWF0cnZkc3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MTkxNTcsImV4cCI6MjA3OTA5NTE1N30.JdCZphG70zrBd3cSv_mZS0Grme1oBKjxJcBuz_UMoR0";
const DEFAULT_STRIPE_KEY = "pk_test_51SV8RkQ12dqc2hKRZfpj57ulLjnOHunyTAEMVFPYVmq360UU9upe6v9SUFvIKAR5x1yLPLVBfsyQ52Be9VoV5WSU00hrCmA4wF";
// Replace this with your actual Stripe Price ID from the Stripe Dashboard (e.g., price_1Pxyz...)
const DEFAULT_STRIPE_PRICE_ID = "price_1Qxyz123456789"; 

// Safe Environment Variable Access
// This prevents "ReferenceError: process is not defined" in Vite/Browser environments
const getEnv = (key: string, fallback: string) => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
    // Check for Vite specific env vars if process.env fails
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
        // @ts-ignore
        return import.meta.env[key] as string;
    }
  } catch (e) {
    // Ignore error if process is not defined
  }
  return fallback;
};

export const SUPABASE_URL = getEnv("NEXT_PUBLIC_SUPABASE_URL", DEFAULT_SUPABASE_URL);
export const SUPABASE_ANON_KEY = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", DEFAULT_SUPABASE_KEY);
export const STRIPE_PUBLISHABLE_KEY = getEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", DEFAULT_STRIPE_KEY);
export const STRIPE_PRICE_ID = getEnv("NEXT_PUBLIC_STRIPE_PRICE_ID", DEFAULT_STRIPE_PRICE_ID);

export const APP_NAME = "VegasVault";

export const INITIAL_PREDICTIONS: Prediction[] = [];