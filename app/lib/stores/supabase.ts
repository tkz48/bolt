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
      accessToken: '',
      refreshToken: '',
      projects: undefined,
    };

export const supabaseConnection = atom<SupabaseConnection>(initialConnection);
export const isConnecting = atom<boolean>(false);
export const isFetchingProjects = atom<boolean>(false);

export const updateSupabaseConnection = (updates: Partial<SupabaseConnection>) => {
  const currentState = supabaseConnection.get();
  const newState = { ...currentState, ...updates };
  supabaseConnection.set(newState);

  // Persist to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('supabase_connection', JSON.stringify(newState));
  }
};

export async function fetchSupabaseProjects(accessToken: string) {
  try {
    isFetchingProjects.set(true);

    // TODO: Replace with actual Supabase Management API call
    const projectsResponse = await fetch('https://api.supabase.com/v1/projects', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!projectsResponse.ok) {
      throw new Error(`Failed to fetch projects: ${projectsResponse.status}`);
    }

    const projects = (await projectsResponse.json()) as any;

    const currentState = supabaseConnection.get();
    updateSupabaseConnection({
      ...currentState,
      projects,
    });
  } catch (error) {
    console.error('Supabase API Error:', error);
    logStore.logError('Failed to fetch Supabase projects', { error });
    toast.error('Failed to fetch Supabase projects');
  } finally {
    isFetchingProjects.set(false);
  }
}