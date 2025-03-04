import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { logStore } from '~/lib/stores/logs';
import { classNames } from '~/utils/classNames';
import {
  supabaseConnection,
  isConnecting,
  isFetchingStats,
  updateSupabaseConnection,
  fetchSupabaseStats,
} from '~/lib/stores/supabase';
import type { SupabaseUser } from '~/types/supabase';

export function SupabaseConnection() {
  const connection = useStore(supabaseConnection);
  const connecting = useStore(isConnecting);
  const fetchingStats = useStore(isFetchingStats);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      if (connection.user && connection.token) {
        await fetchSupabaseStats(connection.token);
      }
    };
    fetchProjects();
  }, [connection.user, connection.token]);

  const handleConnect = async (event: React.FormEvent) => {
    event.preventDefault();
    isConnecting.set(true);

    try {
      // Supabase API endpoint for user info
      const response = await fetch('https://api.supabase.com/v1/profile', {
        headers: {
          Authorization: `Bearer ${connection.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Invalid token or unauthorized');
      }

      const userData = (await response.json()) as SupabaseUser;
      updateSupabaseConnection({
        user: userData,
        token: connection.token,
      });

      await fetchSupabaseStats(connection.token);
      toast.success('Successfully connected to Supabase');
    } catch (error) {
      console.error('Auth error:', error);
      logStore.logError('Failed to authenticate with Supabase', { error });
      toast.error('Failed to connect to Supabase');
      updateSupabaseConnection({ user: null, token: '' });
    } finally {
      isConnecting.set(false);
    }
  };

  const handleDisconnect = () => {
    updateSupabaseConnection({ user: null, token: '' });
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
              <label className="block text-sm text-bolt-elements-textSecondary mb-2">API Key</label>
              <input
                type="password"
                value={connection.token}
                onChange={(e) => updateSupabaseConnection({ ...connection, token: e.target.value })}
                disabled={connecting}
                placeholder="Enter your Supabase API key"
                className={classNames(
                  'w-full px-3 py-2 rounded-lg text-sm',
                  'bg-[#F8F8F8] dark:bg-[#1A1A1A]',
                  'border border-[#E5E5E5] dark:border-[#333333]',
                  'text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary',
                  'focus:outline-none focus:ring-1 focus:ring-[#3ECF8E]',
                  'disabled:opacity-50',
                )}
              />
              <div className="mt-2 text-sm text-bolt-elements-textSecondary">
                <a
                  href="https://app.supabase.com/account/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3ECF8E] hover:underline inline-flex items-center gap-1"
                >
                  Get your API key
                  <div className="i-ph:arrow-square-out w-4 h-4" />
                </a>
              </div>
            </div>

            <button
              onClick={handleConnect}
              disabled={connecting || !connection.token}
              className={classNames(
                'px-4 py-2 rounded-lg text-sm flex items-center gap-2',
                'bg-[#3ECF8E] text-white',
                'hover:bg-[#36B97F]',
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
              <div className="w-12 h-12 rounded-full border-2 border-[#3ECF8E] flex items-center justify-center bg-[#3ECF8E] text-white">
                <div className="i-ph:user w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-bolt-elements-textPrimary">
                  {connection.user.full_name || 'Supabase User'}
                </h4>
                <p className="text-sm text-bolt-elements-textSecondary">{connection.user.email}</p>
              </div>
            </div>

            {fetchingStats ? (
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
                  <div className="i-ph:database w-4 h-4" />
                  Your Projects ({connection.stats?.totalProjects || 0})
                  <div
                    className={classNames(
                      'i-ph:caret-down w-4 h-4 ml-auto transition-transform',
                      isProjectsExpanded ? 'rotate-180' : '',
                    )}
                  />
                </button>
                {isProjectsExpanded && connection.stats?.projects?.length ? (
                  <div className="grid gap-3">
                    {connection.stats.projects.map((project) => (
                      <a
                        key={project.id}
                        href={`https://app.supabase.com/project/${project.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 rounded-lg border border-[#E5E5E5] dark:border-[#1A1A1A] hover:border-[#3ECF8E] dark:hover:border-[#3ECF8E] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-bolt-elements-textPrimary flex items-center gap-2">
                              <div className="i-ph:database w-4 h-4 text-[#3ECF8E]" />
                              {project.name}
                            </h5>
                            <div className="flex items-center gap-2 mt-2 text-xs text-bolt-elements-textSecondary">
                              <span className="flex items-center gap-1">
                                <div className="i-ph:globe w-3 h-3" />
                                {project.region}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <div className="i-ph:clock w-3 h-3" />
                                {new Date(project.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-bolt-elements-textSecondary px-2 py-1 rounded-md bg-[#F0F0F0] dark:bg-[#252525]">
                            <span className="flex items-center gap-1">
                              <div className="i-ph:database w-3 h-3" />
                              Database
                            </span>
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

            <div className="p-4 bg-[#F8F8F8] dark:bg-[#1A1A1A] rounded-lg">
              <h4 className="text-sm font-medium text-bolt-elements-textPrimary mb-3 flex items-center gap-2">
                <div className="i-ph:info-circle w-4 h-4 text-[#3ECF8E]" />
                Self-Hosting Information
              </h4>
              <p className="text-sm text-bolt-elements-textSecondary mb-2">
                Supabase can be self-hosted for complete control over your data and infrastructure.
              </p>
              <a
                href="https://supabase.com/docs/guides/self-hosting"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#3ECF8E] hover:underline inline-flex items-center gap-1"
              >
                View self-hosting documentation
                <div className="i-ph:arrow-square-out w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}