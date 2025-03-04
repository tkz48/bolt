export interface SupabaseProject {
  id: string;
  name: string;
  url: string;
  created_at: string;
  region: string;
}

export interface SupabaseUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
}

export interface SupabaseConnection {
  user: SupabaseUser | null;
  accessToken: string;
  refreshToken: string;
  projects?: SupabaseProject[];
}