import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { WebsetItem } from '../types';
import { getEntityIcon } from '../utils/entity-icons';

// Fix type issue - ensure type is always defined
function ensureType(item: WebsetItem): string {
  return item.type || 'unknown';
}

interface WebsetsTableProps {
  items: WebsetItem[];
  allCriteria: string[];
  onItemClick: (item: WebsetItem) => void;
}

export function WebsetsTable({
  items,
  allCriteria,
  onItemClick,
}: WebsetsTableProps) {
  if (items.length === 0) {
    return null;
  }

  const entityType = ensureType(items[0])?.toLowerCase() || '';
  const isPerson = entityType === 'person';

  const getEvaluationForCriterion = (item: WebsetItem, criterion: string) => {
    return item.evaluations?.find(e => e.criterion === criterion);
  };

  const getReferenceCount = (evaluation: any) => {
    if (evaluation?.reasoning) {
      const refMatches = evaluation.reasoning.match(/\d+\s*ref/i);
      return refMatches ? parseInt(refMatches[0]) : 1;
    }
    return 1;
  };

  return (
    <div className="w-full overflow-x-auto">
      <Table className="border-separate border-spacing-0 min-w-full">
        <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800">
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead className="min-w-[200px] font-semibold text-zinc-900 dark:text-zinc-100">Name</TableHead>
            {isPerson && (
              <TableHead className="min-w-[150px] font-semibold text-zinc-900 dark:text-zinc-100">Role</TableHead>
            )}
            <TableHead className="min-w-[200px] font-semibold text-zinc-900 dark:text-zinc-100">URL</TableHead>
            {allCriteria.map((criterion, idx) => (
              <TableHead key={idx} className="min-w-[140px] text-center font-semibold text-zinc-900 dark:text-zinc-100">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold truncate max-w-[120px]" title={criterion}>
                    {criterion}
                  </span>
                </div>
              </TableHead>
            ))}
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const EntityIcon = getEntityIcon(ensureType(item));

            return (
              <TableRow 
                key={item.id}
                className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/30 cursor-pointer border-b border-zinc-200 dark:border-zinc-800 transition-colors"
                onClick={() => onItemClick(item)}
              >
                  <TableCell className="w-12">
                    {isPerson && item.picture_url ? (
                      <Avatar className="w-9 h-9 border border-zinc-200 dark:border-zinc-700">
                        <AvatarImage src={item.picture_url} alt={item.name} />
                        <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          <EntityIcon className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    ) : !isPerson && item.logo_url ? (
                      <Avatar className="w-9 h-9 border border-zinc-200 dark:border-zinc-700">
                        <AvatarImage src={item.logo_url} alt={item.name} />
                        <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          <EntityIcon className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                        <EntityIcon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold min-w-[200px] text-zinc-900 dark:text-zinc-100">
                    <div className="flex items-center gap-2">
                      {item.name || item.title || 'Unknown'}
                    </div>
                  </TableCell>
                  {isPerson && (
                    <TableCell className="text-zinc-600 dark:text-zinc-400 min-w-[150px]">
                      {item.position || '-'}
                    </TableCell>
                  )}
                  <TableCell className="min-w-[200px]">
                    {item.url ? (
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline text-sm truncate block font-mono"
                      >
                        {item.url.replace(/^https?:\/\//, '').substring(0, 40)}...
                      </a>
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-500">-</span>
                    )}
                  </TableCell>
                  {allCriteria.map((criterion, critIdx) => {
                    const evaluation = getEvaluationForCriterion(item, criterion);
                    const refCount = evaluation ? getReferenceCount(evaluation) : 0;
                    const satisfied = evaluation?.satisfied || 'unclear';
                    
                    return (
                      <TableCell key={critIdx} className="text-center min-w-[140px]">
                        {evaluation ? (
                          <div className="flex flex-col items-center gap-1">
                            <Badge 
                              variant="outline"
                              className={cn(
                                "text-xs font-semibold border-2",
                                satisfied === 'yes' && "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300",
                                satisfied === 'no' && "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
                                satisfied === 'unclear' && "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                              )}
                            >
                              {satisfied === 'yes' ? 'Match' : satisfied === 'no' ? 'Miss' : 'Unclear'}
                            </Badge>
                            {refCount > 0 && (
                              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                {refCount} ref{refCount !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-500 text-xs">-</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
