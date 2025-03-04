import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { logStore } from '~/lib/stores/logs';
import { classNames } from '~/utils/classNames';
import {
  supabaseConnection,
  isConnecting,
  isFetchingProjects,
  updateSupabaseConnection,
  fetchSupabaseProjects,
} from '~/lib/stores/supabase';
import type { SupabaseConnection, SupabaseUser } from '~/types/supabase';
import pkce from 'pkce-gen';

export function SupabaseConnection() {
  const connection = useStore(supabaseConnection);
  const connecting = useStore(isConnecting);
  const fetchingProjects = useStore(isFetchingProjects);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      if (connection.user && connection.accessToken) {
        await fetchSupabaseProjects(connection.accessToken);
      }
    };
    fetchProjects();
  }, [connection.user, connection.accessToken]);

  useEffect(() => {
    const accessToken = localStorage.getItem('supabase_access_token');
    const refreshToken = localStorage.getItem('supabase_refresh_token');
    if (accessToken && refreshToken) {
      // TODO: Fetch user data from Supabase Management API
      const userData: SupabaseUser = {
        id: 'supabase-user-id',
        email: 'user@example.com',
        name: 'Supabase User',
        avatar_url: 'https://avatars.githubusercontent.com/u/14920540?v=4',
      };
      updateSupabaseConnection({
        user: userData,
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    }
  }, []);

  const handleConnect = async (event: React.FormEvent) => {
    event.preventDefault();
    isConnecting.set(true);

    try {
      // Construct the URL for the authorization redirect
      const clientId = process.env.SUPABASE_CLIENT_ID; // Replace with your actual client ID
      const redirectUri = window.location.origin + '/api/supabase/callback'; // Replace with your actual redirect URI
      const state = crypto.randomUUID();
      localStorage.setItem('supabase_auth_state', state);

      const { code_verifier, code_challenge } = pkce.create();
      localStorage.setItem('supabase_code_verifier', code_verifier);

      const authorizationUrl = `https://api.supabase.com/v1/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=supabase&state=${state}&code_challenge=${code_challenge}&code_challenge_method=S256`;

      // Redirect the user to the authorization endpoint
      window.location.href = authorizationUrl;
    } catch (error) {
      console.error('Auth error:', error);
      logStore.logError('Failed to authenticate with Supabase', { error });
      toast.error('Failed to connect to Supabase');
      updateSupabaseConnection({ user: null, accessToken: '', refreshToken: '' });
    } finally {
      isConnecting.set(false);
    }
  };

  const handleDisconnect = () => {
    updateSupabaseConnection({ user: null, accessToken: '', refreshToken: '' });
    toast.success('Disconnected from Supabase');
  };

  return (
    <motion.div
      className="bg-[#FFFFFF] dark:bg-[#0A0A0A] rounded-lg border border-[#E5E5E5] dark:border-[#1A1A1A]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              className="w-5 h-5"
              height="24"
              width="24"
              crossOrigin="anonymous"
              src="https://cdn.simpleicons.org/supabase"
            />
            <h3 className="text-base font-medium text-bolt-elements-textPrimary">Supabase Connection</h3>
          </div>
        </div>

        {!connection.user ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-bolt-elements-textSecondary mb-2">Access Token</label>
              <input
                type="password"
                value={connection.accessToken}
                onChange={(e) => updateSupabaseConnection({ ...connection, accessToken: e.target.value })}
                disabled={connecting}
                placeholder="Enter your Supabase access token"
                className={classNames(
                  'w-full px-3 py-2 rounded-lg text-sm',
                  'bg-[#F8F8F8] dark:bg-[#1A1A1A]',
                  'border border-[#E5E5E5] dark:border-[#333333]',
                  'text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary',
                  'focus:outline-none focus:ring-1 focus:ring-[#00AD9F]',
                  'disabled:opacity-50',
                )}
              />
            </div>

            <button
              onClick={handleConnect}
              disabled={connecting || !connection.accessToken}
              className={classNames(
                'px-4 py-2 rounded-lg text-sm flex items-center gap-2',
                'bg-[#00AD9F] text-white',
                'hover:bg-[#00968A]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {connecting ? (
                <>
                  <div className="i-ph:spinner-gap animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <div className="i-ph:plug-charging w-4 h-4" />
                  Connect
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDisconnect}
                  className={classNames(
                    'px-4 py-2 rounded-lg text-sm flex items-center gap-2',
                    'bg-red-500 text-white',
                    'hover:bg-red-600',
                  )}
                >
                  <div className="i-ph:plug w-4 h-4" />
                  Disconnect
                </button>
                <span className="text-sm text-bolt-elements-textSecondary flex items-center gap-1">
                  <div className="i-ph:check-circle w-4 h-4 text-green-500" />
                  Connected to Supabase
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-[#F8F8F8] dark:bg-[#1A1A1A] rounded-lg">
              <img
                src={connection.user.avatar_url}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                alt={connection.user.name}
                className="w-12 h-12 rounded-full border-2 border-[#00AD9F]"
              />
              <div>
                <h4 className="text-sm font-medium text-bolt-elements-textPrimary">{connection.user.name}</h4>
                <p className="text-sm text-bolt-elements-textSecondary">{connection.user.email}</p>
              </div>
            </div>

            {fetchingProjects ? (
              <div className="flex items-center gap-2 text-sm text-bolt-elements-textSecondary">
                <div className="i-ph:spinner-gap w-4 h-4 animate-spin" />
                Fetching Supabase projects...
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                  className="w-full bg-transparent text-left text-sm font-medium text-bolt-elements-textPrimary mb-3 flex items-center gap-2"
                >
                  <div className="i-ph:buildings w-4 h-4" />
                  Your Projects ({connection.projects?.length || 0})
                  <div
                    className={classNames(
                      'i-ph:caret-down w-4 h-4 ml-auto transition-transform',
                      isProjectsExpanded ? 'rotate-180' : '',
                    )}
                  />
                </button>
                {isProjectsExpanded && connection.projects?.length ? (
                  <div className="grid gap-3">
                    {connection.projects.map((project) => (
                      <a
                        key={project.id}
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 rounded-lg border border-[#E5E5E5] dark:border-[#1A1A1A] hover:border-[#00AD9F] dark:hover:border-[#00AD9F] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-bolt-elements-textPrimary flex items-center gap-2">
                              <div className="i-ph:globe w-4 h-4 text-[#00AD9F]" />
                              {project.name}
                            </h5>
                            <div className="flex items-center gap-2 mt-2 text-xs text-bolt-elements-textSecondary">
                              <a
                                href={project.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-[#00AD9F]"
                              >
                                {project.url}
                              </a>
                              <span>•</span>
                              <span>Created at: {project.created_at}</span>
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : isProjectsExpanded ? (
                  <div className="text-sm text-bolt-elements-textSecondary flex items-center gap-2">
                    <div className="i-ph:info w-4 h-4" />
                    No projects found in your Supabase account
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}