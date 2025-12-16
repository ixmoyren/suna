import React, { useState, useMemo } from 'react';
import {
  Database,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { ToolViewProps } from '../types';
import { formatTimestamp, getToolTitle } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { extractWebsetsData, WebsetData } from './_utils';
import { useWebsetPolling } from './hooks/useWebsetPolling';
import { WebsetsBrowser } from './components/WebsetsBrowser';

export function WebsetsToolView({
  toolCall,
  toolResult,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
}: ToolViewProps) {
  if (!toolCall) {
    console.warn('WebsetsToolView: toolCall is undefined');
    return null;
  }

  const name = toolCall.function_name.replace(/_/g, '-').toLowerCase();
  const {
    data,
    actualIsSuccess,
    actualToolTimestamp,
    actualAssistantTimestamp
  } = extractWebsetsData(toolCall, toolResult, isSuccess, toolTimestamp, assistantTimestamp);

  const [searchFilter, setSearchFilter] = useState('');

  const toolTitle = getToolTitle(name);

  // Determine view mode based on function name
  const isListItems = name.includes('list-items');
  const isGetWebset = name.includes('get-webset');
  const isListWebsets = name.includes('list-websets');

  // Get webset ID from data - check multiple possible sources
  const websetId = useMemo(() => {
    if (data.webset_id) return data.webset_id;
    
    if (toolResult?.output) {
      const output = toolResult.output as any;
      if (output.webset_id) return output.webset_id;
      if (output.id && typeof output.id === 'string') return output.id;
    }
    
    if (toolCall?.arguments) {
      try {
        const args = typeof toolCall.arguments === 'string' 
          ? JSON.parse(toolCall.arguments) 
          : toolCall.arguments;
        if (args.webset_id) return args.webset_id;
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    return null;
  }, [data.webset_id, toolResult?.output, toolCall?.arguments]);

  // Use polling hook for live updates
  const { liveData, isPolling, effectiveData } = useWebsetPolling({
    websetId,
    initialData: data,
    enabled: !!websetId,
  });

  // Use effective data for items
  const items = useMemo(() => {
    const sourceData = effectiveData;
    if (sourceData.items) return sourceData.items;
    if (sourceData.item) return [sourceData.item];
    return [];
  }, [effectiveData]);


  // Handle list-websets view
  if (isListWebsets && data.websets) {
    return (
      <Card className="gap-0 flex border-0 shadow-none p-0 py-0 rounded-none flex-col h-full overflow-hidden bg-card">
        <CardHeader className="h-14 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b p-2 px-4 space-y-2">
          <div className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative p-2 rounded-lg border flex-shrink-0 bg-zinc-200/60 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700">
                <Database className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div>
                <CardTitle className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                  {toolTitle}
                </CardTitle>
              </div>
            </div>
            {actualIsSuccess !== undefined && (
              <Badge
                variant="secondary"
                className={
                  actualIsSuccess
                    ? "bg-gradient-to-b from-emerald-200 to-emerald-100 text-emerald-700 dark:from-emerald-800/50 dark:to-emerald-900/60 dark:text-emerald-300"
                    : "bg-gradient-to-b from-rose-200 to-rose-100 text-rose-700 dark:from-rose-800/50 dark:to-rose-900/60 dark:text-rose-300"
                }
              >
                {actualIsSuccess ? (
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                )}
                {actualIsSuccess ? 'Success' : 'Failed'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">
            {data.websets.map((ws: any) => (
              <div key={ws.id} className="p-3 border rounded-lg bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
                <div className="font-medium text-zinc-900 dark:text-zinc-100">{ws.name || ws.id}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  {ws.item_count || 0} items • {ws.status}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <div className="px-4 py-2 h-9 bg-muted/20 border-t border-border/40 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {data.websets.length} webset{data.websets.length !== 1 ? 's' : ''}
          </div>
          <div className="text-xs text-muted-foreground">
            {actualToolTimestamp ? formatTimestamp(actualToolTimestamp) : ''}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="gap-0 flex border-0 shadow-none p-0 py-0 rounded-none flex-col h-full overflow-hidden bg-card">
      <CardHeader className="h-14 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b p-2 px-4 space-y-2">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative p-2 rounded-lg border flex-shrink-0 bg-zinc-200/60 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700">
              <Database className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div>
              <CardTitle className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                {toolTitle}
              </CardTitle>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isStreaming && (
              <Badge
                variant="secondary"
                className={
                  actualIsSuccess
                    ? "bg-gradient-to-b from-emerald-200 to-emerald-100 text-emerald-700 dark:from-emerald-800/50 dark:to-emerald-900/60 dark:text-emerald-300"
                    : "bg-gradient-to-b from-rose-200 to-rose-100 text-rose-700 dark:from-rose-800/50 dark:to-rose-900/60 dark:text-rose-300"
                }
              >
                {actualIsSuccess ? (
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                )}
                {actualIsSuccess ? 'Success' : 'Failed'}
              </Badge>
            )}

            {isStreaming && (
              <Badge className="bg-gradient-to-b from-zinc-200 to-zinc-100 text-zinc-700 dark:from-zinc-800/50 dark:to-zinc-900/60 dark:text-zinc-300">
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                Loading
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <WebsetsBrowser
        data={effectiveData}
        isStreaming={isStreaming}
        isPolling={isPolling}
        items={items}
        searchFilter={searchFilter}
        onSearchChange={setSearchFilter}
      />

      <div className="px-4 py-2 h-9 bg-muted/20 border-t border-border/40 flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          {!isStreaming && items.length > 0 && (
            <span className="font-mono">
              {items.length} result{items.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {actualToolTimestamp && !isStreaming
            ? formatTimestamp(actualToolTimestamp)
            : actualAssistantTimestamp
              ? formatTimestamp(actualAssistantTimestamp)
              : ''}
        </div>
      </div>
    </Card>
  );
}
