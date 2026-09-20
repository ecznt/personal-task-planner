'use client';

import { apiClient } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';

export type TemplateSummaryForApply = {
  readonly id: string;
  readonly title: string;
  readonly defaultPlannedAtOffsetDays?: number;
};

type AreaSummary = {
  readonly id: string;
  readonly name: string;
  readonly isInbox?: boolean;
};

type ProjectSummary = {
  readonly id: string;
  readonly areaId: string;
  readonly name: string;
  readonly lifecycleState: 'ACTIVE' | 'ARCHIVED' | 'TRASHED';
};

export function TemplateApplyForm({
  template,
  onSuccess,
}: {
  readonly template: TemplateSummaryForApply;
  readonly onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const csrfQuery = useQuery({ queryKey: csrfQueryKey, queryFn: fetchCsrf, staleTime: 20 * 60 * 1_000 });

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
      const result = await apiClient.get({ url: '/api/v1/projects', query: { limit: '100' } });
      if (result.error !== undefined) {
        throw new Error('Projeler yüklenemedi.');
      }
      return (result.data as { data: ProjectSummary[] }).data ?? [];
    },
  });

  const [areaId, setAreaId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [plannedAt, setPlannedAt] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  const apply = useMutation({
    mutationFn: async () => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);

      const body: Record<string, string> = {
        ...(areaId !== '' && { areaId }),
        ...(projectId !== '' && { projectId }),
        ...(plannedAt !== '' && {
          plannedAt: new Date(`${plannedAt}T12:00:00`).toISOString(),
        }),
      };

      const result = await apiClient.post({
        url: '/api/v1/task-templates/{templateId}/apply',
        path: { templateId: template.id },
        body,
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
      toast.success('Görev şablondan oluşturuldu');
      queryClient.invalidateQueries({ queryKey: ['tasks', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'kanban'] });
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      onSuccess?.();
    },
    onError: (applyError) => {
      setError(applyError instanceof Error ? applyError.message : 'Görev oluşturulamadı.');
    },
  });

  const areaOptions = Array.isArray(areas.data) ? areas.data : [];
  const sortedAreas = [...areaOptions].sort((left, right) => {
    if (left.isInbox === right.isInbox) {
      return 0;
    }
    return left.isInbox ? -1 : 1;
  });
  const activeProjects = Array.isArray(projects.data)
    ? projects.data.filter((project) => project.lifecycleState === 'ACTIVE')
    : [];
  const effectiveAreaId = areaId !== '' ? areaId : sortedAreas.find((area) => area.isInbox)?.id ?? '';
  const filteredProjects =
    effectiveAreaId !== '' ? activeProjects.filter((project) => project.areaId === effectiveAreaId) : [];

  return (
    <div className="space-y-3">
      <Field>
        <FieldLabel htmlFor="apply-area">Alan</FieldLabel>
        {areas.isLoading ? (
          <Spinner />
        ) : (
          <Select
            id="apply-area"
            value={areaId}
            onChange={(event) => {
              setAreaId(event.target.value);
              setProjectId('');
            }}
          >
            {sortedAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.isInbox ? 'Gelen Kutusu' : area.name}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor="apply-project">Proje (isteğe bağlı)</FieldLabel>
        {projects.isLoading ? (
          <Spinner />
        ) : (
          <Select
            id="apply-project"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            <option value="">Proje yok</option>
            {filteredProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor="apply-planned">Planlama tarihi (isteğe bağlı)</FieldLabel>
        <Input
          id="apply-planned"
          type="date"
          value={plannedAt}
          onChange={(event) => setPlannedAt(event.target.value)}
        />
      </Field>

      {error !== undefined && <FieldError>{error}</FieldError>}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          disabled={apply.isPending}
          aria-busy={apply.isPending}
          onClick={() => apply.mutate()}
        >
          {apply.isPending ? 'Oluşturuluyor...' : 'Görevi oluştur'}
        </Button>
      </div>
    </div>
  );
}