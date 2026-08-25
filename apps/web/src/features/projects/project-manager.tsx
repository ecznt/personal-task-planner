import { apiClient } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';

import { createProjectSchema, type CreateProjectFormValues } from './project-schema';

type ProjectSummary = {
  readonly id: string;
  readonly areaId: string;
  readonly name: string;
  readonly lifecycleState: string;
  readonly version: number;
  readonly taskCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

type ProjectManagerProps = {
  readonly areaId: string;
};

export function ProjectManager({ areaId }: ProjectManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const queryClient = useQueryClient();

  const projects = useQuery({
    queryKey: ['projects', areaId],
    queryFn: async () => {
      const result = await apiClient.get({
        url: '/api/v1/projects',
        query: { areaId },
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
    mutationFn: async (values: CreateProjectFormValues) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);

      const result = await apiClient.post({
        url: '/api/v1/projects',
        body: { areaId, ...values },
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
      queryClient.invalidateQueries({ queryKey: ['projects', areaId] });
      queryClient.invalidateQueries({ queryKey: ['areas', areaId] });
      setIsCreating(false);
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
      queryClient.invalidateQueries({ queryKey: ['projects', areaId] });
      setEditingId(null);
      setEditName('');
    },
  });

  if (projects.isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner />
      </div>
    );
  }

  if (projects.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Hata</AlertTitle>
        <AlertDescription>{projects.error?.message ?? 'Projeler yüklenemedi.'}</AlertDescription>
      </Alert>
    );
  }

  const projectList = projects.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">Projeler</h4>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'İptal' : '+ Yeni Proje'}
        </Button>
      </div>

      {isCreating && (
        <AddProjectForm
          onSubmit={(values) => createProject.mutate(values)}
          isPending={createProject.isPending}
          onCancel={() => setIsCreating(false)}
        />
      )}

      {projectList.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz proje oluşturulmamış.</p>
      ) : (
        <div className="space-y-1">
          {projectList.map((project) => (
            <div key={project.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
              {editingId === project.id ? (
                <div className="flex flex-1 gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={renameProject.isPending || editName.trim().length === 0}
                    onClick={() =>
                      renameProject.mutate({
                        id: project.id,
                        name: editName,
                        version: project.version,
                      })
                    }
                  >
                    {renameProject.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingId(null);
                      setEditName('');
                    }}
                  >
                    İptal
                  </Button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium">{project.name}</span>
                  <span className="text-xs text-muted-foreground">{project.taskCount} görev</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground transition-transform duration-150 active:scale-90"
                    onClick={() => {
                      setEditingId(project.id);
                      setEditName(project.name);
                    }}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddProjectForm({
  onSubmit,
  isPending,
  onCancel,
}: {
  onSubmit: (values: CreateProjectFormValues) => void;
  isPending: boolean;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = createProjectSchema.safeParse({ name });
    if (result.success) {
      onSubmit(result.data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Field className="flex-1">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Proje adı"
          className="h-8"
        />
      </Field>
      <Button type="submit" size="sm" disabled={isPending || name.trim().length === 0}>
        {isPending ? 'Ekleniyor...' : 'Ekle'}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onCancel}>
        İptal
      </Button>
    </form>
  );
}
