import { atom } from 'nanostores';
import type { SupabaseConnection } from '~/types/supabase';
import { logStore } from './logs';
import { toast } from 'react-toastify';

// Initialize with stored connection or defaults
const storedConnection = typeof window !== 'undefined' ? localStorage.getItem('supabase_connection') : null;
const initialConnection: SupabaseConnection = storedConnection
  ? JSON.parse(storedConnection)
  : {
      user: null,
      token: '',
      stats: undefined,
    };

export const supabaseConnection = atom<SupabaseConnection>(initialConnection);
export const isConnecting = atom<boolean>(false);
export const isFetchingStats = atom<boolean>(false);

export const updateSupabaseConnection = (updates: Partial<SupabaseConnection>) => {
  const currentState = supabaseConnection.get();
  const newState = { ...currentState, ...updates };
  supabaseConnection.set(newState);

  // Persist to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('supabase_connection', JSON.stringify(newState));
  }
};

export async function fetchSupabaseStats(token: string) {
  try {
    isFetchingStats.set(true);

    // Supabase API endpoint for projects
    const projectsResponse = await fetch('https://api.supabase.com/v1/projects', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!projectsResponse.ok) {
      throw new Error(`Failed to fetch projects: ${projectsResponse.status}`);
    }

    const projects = await projectsResponse.json();

    const currentState = supabaseConnection.get();
    updateSupabaseConnection({
      ...currentState,
      stats: {
        projects,
        totalProjects: projects.length,
      },
    });
  } catch (error) {
    console.error('Supabase API Error:', error);
    logStore.logError('Failed to fetch Supabase stats', { error });
    toast.error('Failed to fetch Supabase statistics');
  } finally {
    isFetchingStats.set(false);
  }
}