'use client';

import { apiClient } from '@planner/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { celebrateTaskCompleted } from '@/features/today/celebration-store';
import { cn } from '@/lib/utils';

import { invalidateTaskCaches } from './task-patch';

const STATUS_LABELS: Record<string, string> = {
  TO_DO: 'Yapılacak',
  IN_PROGRESS: 'Devam Ediyor',
  COMPLETED: 'Tamamlandı',
};

const STATUS_OPTIONS = [
  { value: 'TO_DO', label: 'Yapılacak' },
  { value: 'IN_PROGRESS', label: 'Devam Ediyor' },
  { value: 'COMPLETED', label: 'Tamamlandı' },
];

type TaskStatusOption = (typeof STATUS_OPTIONS)[number]['value'];

type TaskStatusMenuProps = {
  readonly taskId: string;
  readonly areaId?: string;
  readonly version: number;
  readonly canonicalStatus: string;
  readonly align?: 'end' | 'start';
  readonly className?: string;
};

export function TaskStatusMenu({
  taskId,
  areaId,
  version,
  canonicalStatus,
  align = 'end',
  className,
}: TaskStatusMenuProps) {
  const queryClient = useQueryClient();

  const moveStatus = useMutation({
    mutationFn: async (target: TaskStatusOption) => {
      const result = await apiClient.post({
        url: '/api/v1/tasks/kanban-moves',
        body: { taskId, targetCanonicalStatus: target },
        headers: {
          'Content-Type': 'application/json',
          'If-Match': String(version),
        },
      });

      if (result.error !== undefined) {
        throw new Error('Durum güncellenemedi.');
      }

      return result.data;
    },
    onSuccess: (_data, target) => {
      if (areaId !== undefined) {
        invalidateTaskCaches(queryClient, { areaId });
      }
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      if (target === 'COMPLETED') {
        celebrateTaskCompleted();
      }
      toast.success('Durum güncellendi');
    },
    onError: () => {
      toast.error('Durum güncellenemedi.');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Durum değiştir"
          className={cn(
            'inline-flex h-6 shrink-0 items-center gap-0.5 rounded-md px-1.5 text-xs font-medium transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.97]',
            canonicalStatus === 'COMPLETED' && 'text-primary',
            canonicalStatus === 'IN_PROGRESS' && 'text-amber-600 dark:text-amber-400',
            className,
          )}
        >
          {STATUS_LABELS[canonicalStatus] ?? canonicalStatus}
          <ChevronsUpDown className="size-3 opacity-60" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-40 p-1">
        {STATUS_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            disabled={option.value === canonicalStatus || moveStatus.isPending}
            onSelect={() => moveStatus.mutate(option.value)}
            className="cursor-pointer"
          >
            <span className="flex-1">{option.label}</span>
            {option.value === canonicalStatus && (
              <span className="text-xs text-muted-foreground">•</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}