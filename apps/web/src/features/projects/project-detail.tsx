'use client';

import { apiClient } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { QuickCreateDialog } from '@/features/tasks/quick-create-dialog';
import { GlobalTaskList } from '@/features/tasks/global-task-list';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';

type ProjectDetail = {
  readonly id: string;
  readonly areaId: string;
  readonly name: string;
  readonly lifecycleState: string;
  readonly version: number;
  readonly taskCount: number;
  readonly completedTaskCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

type AreaSummary = {
  readonly id: string;
  readonly name: string;
};

export function ProjectDetail({ projectId }: { readonly projectId: string }) {
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [targetAreaId, setTargetAreaId] = useState('');
  const queryClient = useQueryClient();

  const project = useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      const result = await apiClient.get({
        url: '/api/v1/projects/{projectId}',
        path: { projectId },
      });
      if (result.error !== undefined) {
        throw new Error('Proje yüklenemedi.');
      }
      return (result.data as { data: ProjectDetail }).data;
    },
  });

  const areas = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const result = await apiClient.get({ url: '/api/v1/areas' });
      if (result.error !== undefined) {
        return [];
      }
      return (result.data as { data: AreaSummary[] }).data ?? [];
    },
  });

  const csrfQuery = useQuery({
    queryKey: csrfQueryKey,
    queryFn: fetchCsrf,
    staleTime: 20 * 60 * 1_000,
  });

  const renameProject = useMutation({
    mutationFn: async ({ name, version }: { name: string; version: number }) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);
      const result = await apiClient.patch({
        url: '/api/v1/projects/{projectId}',
        path: { projectId },
        body: { name },
        headers: { 'X-CSRF-Token': csrf.token, 'If-Match': String(version) },
      });
      if (result.error !== undefined) throw apiError(result.error);
      return (result.data as { data: ProjectDetail }).data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['projects', projectId], { data });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditingName(false);
      setEditName('');
    },
  });

  const moveProject = useMutation({
    mutationFn: async ({ targetAreaId, version }: { targetAreaId: string; version: number }) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);
      const result = await apiClient.patch({
        url: '/api/v1/projects/{projectId}',
        path: { projectId },
        body: { areaId: targetAreaId },
        headers: { 'X-CSRF-Token': csrf.token, 'If-Match': String(version) },
      });
      if (result.error !== undefined) throw apiError(result.error);
      return (result.data as { data: ProjectDetail }).data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['projects', projectId], { data });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'global'] });
      setTargetAreaId('');
    },
  });

  if (project.isLoading || areas.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (project.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Hata</AlertTitle>
        <AlertDescription>{project.error?.message ?? 'Proje yüklenemedi.'}</AlertDescription>
      </Alert>
    );
  }

  const data = project.data;

  if (!data) {
    return null;
  }

  const areaList = areas.data ?? [];
  const currentAreaName = areaList.find((a) => a.id === data.areaId)?.name ?? 'Alan';
  const otherAreas = areaList.filter((a) => a.id !== data.areaId);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link href="/app/projects" className="text-sm text-muted-foreground hover:underline">
          ← Projeler
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          {editingName ? (
            <div className="flex gap-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8"
              />
              <Button
                type="button"
                size="sm"
                disabled={renameProject.isPending || editName.trim().length === 0}
                onClick={() => renameProject.mutate({ name: editName, version: data.version })}
              >
                {renameProject.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingName(false)}>
                İptal
              </Button>
            </div>
          ) : (
            <div className="flex flex-1 flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Link href={`/app/areas/${data.areaId}`} className="hover:underline">
                    {currentAreaName}
                  </Link>
                </p>
                <h1 className="text-gradient text-2xl font-semibold tracking-tight sm:text-3xl">
                  {data.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {data.taskCount} görev
                  {data.completedTaskCount > 0 && ` · ${data.completedTaskCount} tamamlandı`}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingName(true);
                  setEditName(data.name);
                }}
              >
                Yeniden Adlandır
              </Button>
            </div>
          )}
        </div>
      </div>

      {otherAreas.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card p-3 shadow-surface">
          <label className="text-sm text-muted-foreground" htmlFor="move-area">
            Başka alana taşı:
          </label>
          <select
            id="move-area"
            value={targetAreaId}
            onChange={(e) => setTargetAreaId(e.target.value)}
            className="h-8 flex-1 rounded-md border border-input bg-transparent px-2 text-sm"
          >
            <option value="">Alan seçin</option>
            {otherAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={targetAreaId === '' || moveProject.isPending}
            onClick={() => {
              if (!window.confirm('Bu projedeki tüm görevler hedef alandaki varsayılan durumlara taşınacak. Devam etmek istiyor musunuz?')) return;
              moveProject.mutate({ targetAreaId, version: data.version });
            }}
          >
            {moveProject.isPending ? 'Taşınıyor...' : 'Taşı'}
          </Button>
          {moveProject.isError && (
            <span className="text-xs text-destructive">{moveProject.error?.message}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-end">
        <QuickCreateDialog
          initialAreaId={data.areaId}
          initialProjectId={projectId}
          triggerLabel="Yeni Görev"
        />
      </div>

      <GlobalTaskList projectId={projectId} embedded />
    </div>
  );
}
