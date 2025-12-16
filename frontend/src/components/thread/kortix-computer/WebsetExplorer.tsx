import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database } from 'lucide-react';
import { WebsetData, WebsetItem } from '@/components/thread/tool-views/websets-tool/types';
import { useWebsetPolling } from '@/components/thread/tool-views/websets-tool/hooks/useWebsetPolling';
import { WebsetsProgressBanner } from '@/components/thread/tool-views/websets-tool/components/WebsetsProgressBanner';
import { WebsetsEmptyState } from '@/components/thread/tool-views/websets-tool/components/WebsetsEmptyState';
import { WebsetsTable } from '@/components/thread/tool-views/websets-tool/components/WebsetsTable';
import { WebsetsToolbar } from '@/components/thread/tool-views/websets-tool/components/WebsetsToolbar';
import { WebsetItemModal } from '@/components/thread/tool-views/websets-tool/components/WebsetItemModal';
import { cn } from '@/lib/utils';

interface WebsetExplorerProps {
  websetId: string;
  initialData?: WebsetData;
}

/**
 * Main Webset Explorer Component
 * Similar to FileViewerView - shows a full webset by ID
 * Can be used standalone or embedded in other views
 */
export function WebsetExplorer({
  websetId,
  initialData,
}: WebsetExplorerProps) {
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<WebsetItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Default initial data if not provided
  const defaultInitialData: WebsetData = useMemo(() => ({
    webset_id: websetId,
    is_processing: true,
    is_complete: false,
    items: [],
    ...initialData,
  }), [websetId, initialData]);

  // Use polling hook for live updates
  const { liveData, isPolling, effectiveData } = useWebsetPolling({
    websetId,
    initialData: defaultInitialData,
    enabled: !!websetId,
  });

  // Extract items from effective data
  const items = useMemo(() => {
    const sourceData = effectiveData;
    if (sourceData.items) return sourceData.items;
    if (sourceData.item) return [sourceData.item];
    return [];
  }, [effectiveData]);

  // Extract all unique criteria from items' evaluations
  const allCriteria = useMemo(() => {
    const criteriaSet = new Set<string>();
    items.forEach(item => {
      item.evaluations?.forEach(evaluation => {
        if (evaluation.criterion) {
          criteriaSet.add(evaluation.criterion);
        }
      });
    });
    return Array.from(criteriaSet);
  }, [items]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchFilter) return items;
    const filter = searchFilter.toLowerCase();
    return items.filter(item => 
      item.name?.toLowerCase().includes(filter) ||
      item.title?.toLowerCase().includes(filter) ||
      item.description?.toLowerCase().includes(filter) ||
      item.location?.toLowerCase().includes(filter) ||
      item.industry?.toLowerCase().includes(filter)
    );
  }, [items, searchFilter]);

  const handleItemClick = (item: WebsetItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const showProgressBanner = effectiveData.is_processing || isPolling;
  const showEmptyState = (effectiveData.is_processing || isPolling) && items.length === 0 && (!effectiveData.progress || effectiveData.progress.found === 0);

  return (
    <Card className="gap-0 flex border-0 shadow-none p-0 py-0 rounded-none flex-col h-full overflow-hidden bg-card">
      <CardHeader className="h-14 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b p-2 px-4 space-y-2">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative p-2 rounded-lg border shrink-0 bg-zinc-200/60 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700">
              <Database className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div>
              <CardTitle className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                Webset Explorer
              </CardTitle>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 h-full flex-1 overflow-hidden relative">
        {/* Live Processing Banner */}
        <WebsetsProgressBanner
          isVisible={showProgressBanner}
          message={effectiveData.message}
          progress={effectiveData.progress}
        />

        {showEmptyState ? (
          <WebsetsEmptyState
            query={effectiveData.query}
            isProcessing={true}
          />
        ) : filteredItems.length > 0 ? (
          <ScrollArea className="h-full">
            <div className={cn("space-y-4 p-4", showProgressBanner && "pt-16")}>
              {/* Query Summary */}
              {effectiveData.query && (
                <div className="p-4 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    Query: <span className="font-normal text-zinc-600 dark:text-zinc-400">{effectiveData.query}</span>
                  </div>
                  {effectiveData.entity_type && (
                    <Badge variant="outline" className="text-xs font-semibold border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                      {effectiveData.entity_type}
                    </Badge>
                  )}
                </div>
              )}

              {/* Toolbar */}
              <WebsetsToolbar
                searchFilter={searchFilter}
                onSearchChange={setSearchFilter}
                items={filteredItems}
                websetId={websetId}
              />

              {/* Data Table */}
              <WebsetsTable
                items={filteredItems}
                allCriteria={allCriteria}
                onItemClick={handleItemClick}
              />
            </div>
          </ScrollArea>
        ) : (
          <WebsetsEmptyState
            query={effectiveData.query}
            isProcessing={false}
          />
        )}

        {/* Item Detail Modal */}
        <WebsetItemModal
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </CardContent>

      <div className="px-4 py-2 h-9 bg-muted/20 border-t border-border/40 flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          {items.length > 0 && (
            <span className="font-mono">
              {items.length} result{items.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {websetId}
        </div>
      </div>
    </Card>
  );
}

