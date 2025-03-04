import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logStore } from '~/lib/stores/logs';

// Define types for Supabase tables
export type Tables = {
  // Define your table types here
  // Example:
  // users: {
  //   Row: {
  //     id: string;
  //     email: string;
  //     name: string;
  //     created_at: string;
  //   };
  //   Insert: {
  //     id?: string;
  //     email: string;
  //     name?: string;
  //     created_at?: string;
  //   };
  //   Update: {
  //     id?: string;
  //     email?: string;
  //     name?: string;
  //     created_at?: string;
  //   };
  // };
};

// Singleton instance
let supabaseInstance: SupabaseClient | null = null;

/**
 * Initialize the Supabase client with the provided URL and key
 */
export function initSupabase(supabaseUrl: string, supabaseKey: string): SupabaseClient {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and key are required');
  }

  try {
    const client = createClient(supabaseUrl, supabaseKey);
    return client;
  } catch (error) {
    logStore.logError('Failed to initialize Supabase client', { error });
    throw error;
  }
}

/**
 * Get the Supabase client instance
 * If not initialized, it will attempt to initialize with environment variables
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Get environment variables
  const supabaseUrl = typeof process !== 'undefined' ? process.env.SUPABASE_URL : '';
  const supabaseKey = typeof process !== 'undefined' ? process.env.SUPABASE_KEY : '';

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables not found');
  }

  supabaseInstance = initSupabase(supabaseUrl, supabaseKey);
  return supabaseInstance;
}

/**
 * Reset the Supabase client instance
 * Useful for testing or when changing authentication
 */
export function resetSupabaseClient(): void {
  supabaseInstance = null;
}

/**
 * Helper function to handle Supabase errors
 */
export function handleSupabaseError(error: unknown, context: string): void {
  logStore.logError(`Supabase error in ${context}`, { error });
  console.error(`Supabase error in ${context}:`, error);
}