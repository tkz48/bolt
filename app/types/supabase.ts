export interface SupabaseUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface SupabaseProject {
  id: string;
  name: string;
  organization_id: string;
  region: string;
  database_url: string;
  api_url: string;
  created_at: string;
}

export interface SupabaseStats {
  projects: SupabaseProject[];
  totalProjects: number;
}

export interface SupabaseConnection {
  user: SupabaseUser | null;
  token: string;
  stats?: SupabaseStats;
}

export interface SupabaseProjectInfo {
  id: string;
  name: string;
  api_url: string;
  database_url: string;
}