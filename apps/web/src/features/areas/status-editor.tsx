'use client';

import { apiClient } from '@planner/api-client';
import { DragDropProvider } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GripVertical, Plus, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';
import { cn } from '@/lib/utils';

type StatusData = {
  readonly id: string;
  readonly name: string;
  readonly canonicalStatus: string;
  readonly position: number;
  readonly isDefault: boolean;
  readonly active: boolean;
};

type AreaDetailData = {
  readonly id: string;
  readonly name: string;
  readonly version: number;
  readonly statuses: readonly StatusData[];
};

type StatusEditorProps = {
  readonly areaId: string;
  readonly areaData: AreaDetailData;
};

function SortableStatusItem({
  status,
  index,
  areaId,
  version,
  onRename,
  onRetire,
}: {
  status: StatusData;
  index: number;
  areaId: string;
  version: number;
  onRename: (statusId: string, name: string) => void;
  onRetire: (statusId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(status.name);

  const { ref, handleRef } = useSortable({
    id: status.id,
    index,
  });

  const handleSaveRename = () => {
    if (editName.trim() && editName.trim() !== status.name) {
      onRename(status.id, editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm transition-colors duration-150',
        !status.active && 'opacity-60',
      )}
    >
      <button
        type="button"
        ref={handleRef}
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>

      {isEditing ? (
        <input
          autoFocus
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleSaveRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveRename();
            if (e.key === 'Escape') {
              setEditName(status.name);
              setIsEditing(false);
            }
          }}
          className="flex-1 border-b border-primary bg-transparent px-1 py-0.5 text-sm outline-none"
        />
      ) : (
        <span
          className="flex-1"
          onDoubleClick={() => {
            if (!status.isDefault) {
              setEditName(status.name);
              setIsEditing(true);
            }
          }}
        >
          {status.name}
          {status.isDefault && <span className="ml-1 text-muted-foreground">(varsayılan)</span>}
          {!status.active && <span className="ml-1 text-muted-foreground">(emekli)</span>}
        </span>
      )}

      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
        {canonicalLabel(status.canonicalStatus)}
      </span>

      {!status.isDefault && status.active && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-destructive hover:text-destructive"
          onClick={() => onRetire(status.id)}
        >
          Emekli Et
        </Button>
      )}
    </div>
  );
}

function canonicalLabel(canonical: string): string {
  switch (canonical) {
    case 'TO_DO':
      return 'Yapılacak';
    case 'IN_PROGRESS':
      return 'Devam Ediyor';
    case 'COMPLETED':
      return 'Tamamlandı';
    default:
      return canonical;
  }
}

export function StatusEditor({ areaId, areaData }: StatusEditorProps) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCanonical, setNewCanonical] = useState<'TO_DO' | 'IN_PROGRESS' | 'COMPLETED'>('TO_DO');

  const version = areaData.version;

  const createMutation = useMutation({
    mutationFn: async ({ name, canonicalStatus }: { name: string; canonicalStatus: string }) => {
      const csrf = await fetchCsrf();
      queryClient.setQueryData(csrfQueryKey, csrf);

      const result = await apiClient.post({
        url: `/api/v1/areas/${areaId}/statuses`,
        body: { name, canonicalStatus },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf.token,
          'If-Match': String(version),
        },
      });

      if (result.error !== undefined) throw apiError(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', areaId] });
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      setShowCreate(false);
      setNewName('');
      toast.success('Durum eklendi');
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ statusId, name }: { statusId: string; name: string }) => {
      const csrf = await fetchCsrf();
      queryClient.setQueryData(csrfQueryKey, csrf);

      const result = await apiClient.patch({
        url: `/api/v1/areas/${areaId}/statuses/${statusId}`,
        body: { name },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf.token,
          'If-Match': String(version),
        },
      });

      if (result.error !== undefined) throw apiError(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', areaId] });
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      toast.success('Durum yeniden adlandırıldı');
    },
  });

  const retireMutation = useMutation({
    mutationFn: async (statusId: string) => {
      const csrf = await fetchCsrf();
      queryClient.setQueryData(csrfQueryKey, csrf);

      const result = await apiClient.post({
        url: `/api/v1/areas/${areaId}/statuses/${statusId}/retire`,
        headers: {
          'X-CSRF-Token': csrf.token,
          'If-Match': String(version),
        },
      });

      if (result.error !== undefined) throw apiError(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', areaId] });
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      queryClient.invalidateQueries({ queryKey: ['areas', areaId, 'kanban'] });
      toast.success('Durum emekli edildi ve görevler varsayılan duruma taşındı');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (statusIds: string[]) => {
      const csrf = await fetchCsrf();
      queryClient.setQueryData(csrfQueryKey, csrf);

      const result = await apiClient.put({
        url: `/api/v1/areas/${areaId}/statuses/reorder`,
        body: { statusIds },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf.token,
          'If-Match': String(version),
        },
      });

      if (result.error !== undefined) throw apiError(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', areaId] });
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragEnd = useCallback(
    (event: any) => {
      const source = event.operation.source as unknown as { index: number; initialIndex: number } | null;
      const target = event.operation.target as unknown as { index: number } | null;

      if (!source || !target) return;

      const from = source.initialIndex;
      const to = target.index;

      if (from === to) return;

      const statuses = [...areaData.statuses];
      const [moved] = statuses.splice(from, 1);
      if (moved === undefined) return;
      statuses.splice(to, 0, moved);

      reorderMutation.mutate(statuses.map((s) => s.id));
    },
    [areaData.statuses, reorderMutation],
  );

  const handleRename = (statusId: string, name: string) => {
    renameMutation.mutate({ statusId, name });
  };

  const handleRetire = (statusId: string) => {
    retireMutation.mutate(statusId);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMutation.mutate({ name: newName.trim(), canonicalStatus: newCanonical });
  };

  return (
    <div className="space-y-2">
      <DragDropProvider onDragEnd={handleDragEnd}>
        {areaData.statuses
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((status, index) => (
            <SortableStatusItem
              key={status.id}
              status={status}
              index={index}
              areaId={areaId}
              version={version}
              onRename={handleRename}
              onRetire={handleRetire}
            />
          ))}
      </DragDropProvider>

      {createMutation.isError && (
        <Alert variant="destructive">
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>{createMutation.error.message}</AlertDescription>
        </Alert>
      )}

      {showCreate ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/30 px-3 py-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Durum adı"
            className="flex-1 border-b border-primary bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') {
                setShowCreate(false);
                setNewName('');
              }
            }}
          />
          <select
            value={newCanonical}
            onChange={(e) => setNewCanonical(e.target.value as typeof newCanonical)}
            className="rounded border bg-background px-2 py-1 text-xs"
          >
            <option value="TO_DO">Yapılacak</option>
            <option value="IN_PROGRESS">Devam Ediyor</option>
            <option value="COMPLETED">Tamamlandı</option>
          </select>
          <Button
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={!newName.trim() || createMutation.isPending}
            onClick={handleCreate}
          >
            {createMutation.isPending ? 'Ekleniyor...' : 'Ekle'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => {
              setShowCreate(false);
              setNewName('');
            }}
          >
            <X className="size-3" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="mr-1 size-3" />
          Yeni Durum Ekle
        </Button>
      )}
    </div>
  );
}
