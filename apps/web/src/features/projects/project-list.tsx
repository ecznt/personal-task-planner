'use client';

import { apiClient } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { Spinner } from '@/components/ui/spinner';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';

import { createProjectSchema } from './project-schema';

type AreaSummary = {
  readonly id: string;
  readonly name: string;
  readonly lifecycleState: string;
  readonly taskCount: number;
  readonly projectCount: number;
  readonly overdueTaskCount: number;
};

type ProjectSummary = {
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

export function ProjectList() {
  const [createAreaId, setCreateAreaId] = useState('');
  const [createName, setCreateName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const queryClient = useQueryClient();

  const areas = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const result = await apiClient.get({ url: '/api/v1/areas' });
      if (result.error !== undefined) {
        throw new Error('Alanlar yüklenemedi.');
      }
      return (result.data as { data: AreaSummary[] }).data ?? [];
    },
  });

  const projects = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const result = await apiClient.get({
        url: '/api/v1/projects',
        query: { limit: '100' },
      });
      if (result.error !== undefined) {
        throw new Error('Projeler yüklenemedi.');
      }
      return (result.data as { data: ProjectSummary[] }).data ?? [];
    },
  });

  const csrfQuery = useQuery({
    queryKey: csrfQueryKey,
    queryFn: fetchCsrf,
    staleTime: 20 * 60 * 1_000,
  });

  const createProject = useMutation({
    mutationFn: async (values: { areaId: string; name: string }) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);
      const result = await apiClient.post({
        url: '/api/v1/projects',
        body: values,
        headers: {
          'X-CSRF-Token': csrf.token,
          'Idempotency-Key': crypto.randomUUID(),
        },
      });
      if (result.error !== undefined) {
        throw apiError(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setCreateAreaId('');
      setCreateName('');
    },
  });

  const renameProject = useMutation({
    mutationFn: async ({ id, name, version }: { id: string; name: string; version: number }) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);
      const result = await apiClient.patch({
        url: '/api/v1/projects/{projectId}',
        path: { projectId: id },
        body: { name },
        headers: {
          'X-CSRF-Token': csrf.token,
          'If-Match': String(version),
        },
      });
      if (result.error !== undefined) {
        throw apiError(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditingId(null);
      setEditName('');
    },
  });

  if (areas.isLoading || projects.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (areas.isError || projects.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Hata</AlertTitle>
        <AlertDescription>{areas.error?.message ?? projects.error?.message ?? 'Veriler yüklenemedi.'}</AlertDescription>
      </Alert>
    );
  }

  const areaList = areas.data ?? [];
  const projectList = projects.data ?? [];
  const areaNameById = new Map(areaList.map((a) => [a.id, a.name]));
  const grouped = new Map<string, ProjectSummary[]>();

  for (const project of projectList) {
    const list = grouped.get(project.areaId) ?? [];
    list.push(project);
    grouped.set(project.areaId, list);
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nameResult = createProjectSchema.safeParse({ name: createName });
    if (!nameResult.success || createAreaId === '') return;
    createProject.mutate({ areaId: createAreaId, name: nameResult.data.name });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projeler"
        eyebrow="Projeler"
        description="Alanlarınıza göre tüm projelerinizi görüntüleyin."
      />

      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-surface">
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Yeni Proje</h4>
        <form onSubmit={handleCreateSubmit} className="flex flex-wrap gap-2">
          <Field className="min-w-[160px] flex-1">
            <select
              value={createAreaId}
              onChange={(e) => setCreateAreaId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            >
              <option value="">Alan seçin</option>
              {areaList.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </Field>
          <Input
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="Proje adı"
            className="h-9 flex-1"
          />
          <Button type="submit" size="sm" disabled={createProject.isPending || createName.trim().length === 0 || createAreaId === ''}>
            {createProject.isPending ? 'Ekleniyor...' : 'Ekle'}
          </Button>
        </form>
      </div>

      {grouped.size === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz proje oluşturulmamış.</p>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([areaId, list]) => (
            <div key={areaId} className="space-y-2">
              <Link href={`/app/areas/${areaId}`} className="text-sm font-medium text-muted-foreground hover:underline">
                {areaNameById.get(areaId) ?? 'Alan'}
              </Link>
              <div className="space-y-1">
                {list.map((project) => (
                  <div
                    key={project.id}
                    className="card-surface flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-surface transition-all duration-150 hover:border-border hover:shadow-surface-hover active:scale-[0.99]"
                  >
                    {editingId === project.id ? (
                      <div className="flex flex-1 gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 flex-1"
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={renameProject.isPending || editName.trim().length === 0}
                          onClick={() =>
                            renameProject.mutate({ id: project.id, name: editName, version: project.version })
                          }
                        >
                          {renameProject.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => { setEditingId(null); setEditName(''); }}
                        >
                          İptal
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Link href={`/app/projects/${project.id}`} className="min-w-0 flex-1">
                          <div className="truncate font-medium">{project.name}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {project.taskCount} görev
                            {project.completedTaskCount > 0 && (
                              <> · {project.completedTaskCount} tamamlandı</>
                            )}
                          </div>
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground"
                          onClick={() => { setEditingId(project.id); setEditName(project.name); }}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
