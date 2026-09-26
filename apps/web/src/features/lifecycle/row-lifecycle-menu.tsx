'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Archive, MoreVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { archiveResource, trashResource, type ResourceType } from './lifecycle-api';

type RowLifecycleMenuProps = {
  readonly resourceType: ResourceType;
  readonly id: string;
  readonly name: string;
  readonly version: number;
  readonly onActionFinished?: () => void;
};

export function RowLifecycleMenu({
  resourceType,
  id,
  name,
  version,
  onActionFinished,
}: RowLifecycleMenuProps) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<'ARCHIVE' | 'TRASH' | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['areas'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['projects'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['lifecycle'], exact: false });
    onActionFinished?.();
  };

  const archiveAction = useMutation({
    mutationFn: async () => {
      await archiveResource({ resourceType, id, version }, queryClient);
    },
    onSuccess: () => {
      toast.success(`${name} arşivlendi.`);
      invalidate();
      setConfirming(null);
    },
  });

  const trashAction = useMutation({
    mutationFn: async () => {
      await trashResource({ resourceType, id, version }, queryClient);
    },
    onSuccess: () => {
      toast.success(`${name} çöp kutusuna taşındı.`);
      invalidate();
      setConfirming(null);
    },
  });

  return (
    <div className="relative size-8">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground transition-transform duration-150 active:scale-90"
          >
            <MoreVertical className="size-4" aria-hidden="true" />
            <span className="sr-only">{name} için işlemler</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 p-1">
          <DropdownMenuItem
            onSelect={() => setConfirming('ARCHIVE')}
            className="cursor-pointer"
          >
            <Archive className="mr-2 size-4" aria-hidden="true" />
            Arşivle
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setConfirming('TRASH')}
            variant="destructive"
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-4" aria-hidden="true" />
            Çöpe Taşı
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {confirming !== null && (
        <div
          role="alertdialog"
          aria-label={confirming === 'TRASH' ? 'Çöpe taşımayı onayla' : 'Arşivlemeyi onayla'}
          className="absolute top-9 right-0 z-30 w-64 rounded-xl border bg-popover p-3 shadow-lg"
        >
          <p className="text-sm">
            <strong>{name}</strong>
            {confirming === 'TRASH'
              ? ' çöp kutusuna taşınacak. İlgili görevler ve projeler de taşınır.'
              : ' arşivlenecek. İlgili görevler ve projeler de arşivlenir.'}
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(null)}
              className="h-7 transition-transform duration-150 active:scale-[0.97]"
            >
              Vazgeç
            </Button>
            <Button
              variant={confirming === 'TRASH' ? 'destructive' : 'secondary'}
              size="sm"
              disabled={
                (confirming === 'TRASH' && trashAction.isPending) ||
                (confirming === 'ARCHIVE' && archiveAction.isPending)
              }
              onClick={() => (confirming === 'TRASH' ? trashAction.mutate() : archiveAction.mutate())}
              className="h-7 transition-transform duration-150 active:scale-[0.97]"
            >
              {confirming === 'TRASH'
                ? trashAction.isPending
                  ? 'Taşınıyor...'
                  : 'Çöpe Taşı'
                : archiveAction.isPending
                  ? 'Arşivleniyor...'
                  : 'Arşivle'}
            </Button>
          </div>
          {(trashAction.isError || archiveAction.isError) && (
            <p className="mt-2 text-xs text-destructive">
              {(trashAction.error ?? archiveAction.error)?.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}