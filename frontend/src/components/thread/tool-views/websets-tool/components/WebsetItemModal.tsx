import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { WebsetItem } from '../types';
import { getEntityIcon } from '../utils/entity-icons';

interface WebsetItemModalProps {
  item: WebsetItem | null;
  isOpen: boolean;
  onClose: () => void;
}

function ensureType(item: WebsetItem): string {
  return item.type || 'unknown';
}

export function WebsetItemModal({
  item,
  isOpen,
  onClose,
}: WebsetItemModalProps) {
  if (!item) return null;

  const EntityIcon = getEntityIcon(ensureType(item));
  const entityType = ensureType(item)?.toLowerCase() || '';
  const isPerson = entityType === 'person';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
        <DialogHeader className="flex-shrink-0 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {isPerson && item.picture_url ? (
                <Avatar className="w-16 h-16 border-2 border-zinc-200 dark:border-zinc-700 flex-shrink-0">
                  <AvatarImage src={item.picture_url} alt={item.name} />
                  <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    <EntityIcon className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
              ) : !isPerson && item.logo_url ? (
                <Avatar className="w-16 h-16 border-2 border-zinc-200 dark:border-zinc-700 flex-shrink-0">
                  <AvatarImage src={item.logo_url} alt={item.name} />
                  <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    <EntityIcon className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
                  <EntityIcon className="w-8 h-8 text-zinc-600 dark:text-zinc-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  {item.name || item.title || 'Unknown'}
                </DialogTitle>
                {isPerson && item.position && (
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                    {item.position}
                  </div>
                )}
                {item.location && (
                  <div className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
                    {item.location}
                  </div>
                )}
                {item.industry && (
                  <Badge variant="outline" className="mt-2 text-xs border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                    {item.industry}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={onClose}
            >
              <X className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {item.url && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">URL</div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-mono break-all"
              >
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                {item.url}
              </a>
            </div>
          )}

          {item.description && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">Description</div>
              <div className="text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed">{item.description}</div>
            </div>
          )}

          {item.evaluations && item.evaluations.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-3">Criteria Evaluation</div>
              <div className="space-y-3">
                {item.evaluations.map((evaluation, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full shrink-0 mt-1.5",
                      evaluation.satisfied === 'yes' ? "bg-emerald-500" : 
                      evaluation.satisfied === 'no' ? "bg-red-500" : "bg-zinc-400"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{evaluation.criterion}</span>
                        <Badge 
                          variant="outline"
                          className={cn(
                            "text-xs font-semibold border",
                            evaluation.satisfied === 'yes' && "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300",
                            evaluation.satisfied === 'no' && "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
                            evaluation.satisfied === 'unclear' && "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                          )}
                        >
                          {evaluation.satisfied}
                        </Badge>
                      </div>
                      {evaluation.reasoning && (
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          {evaluation.reasoning}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {item.enrichments && Object.keys(item.enrichments).length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-3">Enrichments</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(item.enrichments).map(([key, value]) => (
                  <div key={key} className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-md">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{key}:</span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 ml-1">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {item.company_name && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">Company</div>
              <div className="text-sm text-zinc-900 dark:text-zinc-100 font-medium">{item.company_name}</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

