import React from 'react';
import { Database, Globe } from 'lucide-react';

interface WebsetsEmptyStateProps {
  query?: string;
  isProcessing?: boolean;
}

export function WebsetsEmptyState({ query, isProcessing }: WebsetsEmptyStateProps) {
  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-6 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-gradient-to-b from-zinc-100 to-zinc-50 shadow-inner dark:from-zinc-800/40 dark:to-zinc-900/60">
          <Globe className="h-10 w-10 text-zinc-600 dark:text-zinc-400 animate-pulse" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
          Processing search
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-md mb-4">
          Analyzing query and discovering matching results.
        </p>
        {query && (
          <div className="w-full max-w-2xl mb-4">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-md border border-zinc-200 dark:border-zinc-700">
              <code className="text-xs font-mono text-zinc-700 dark:text-zinc-300 break-all">
                {query}
              </code>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100 animate-ping" />
          <span>Searching and analyzing results</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-6 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-gradient-to-b from-zinc-100 to-zinc-50 shadow-inner dark:from-zinc-800/40 dark:to-zinc-900/60">
        <Database className="h-10 w-10 text-zinc-400 dark:text-zinc-500" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
        No Results Found
      </h3>
      {query && (
        <div className="w-full max-w-2xl mb-4">
          <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-md border border-zinc-200 dark:border-zinc-700">
            <code className="text-sm font-mono text-zinc-700 dark:text-zinc-300 break-all">
              {query}
            </code>
          </div>
        </div>
      )}
      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-md">
        Try refining your search criteria for better results
      </p>
    </div>
  );
}
