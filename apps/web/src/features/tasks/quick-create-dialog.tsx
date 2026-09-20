'use client';

import { apiClient } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';
import { TemplateQuickApply } from '@/features/templates/template-quick-apply';

import { CreateTaskFields } from './create-task-fields';
import {
  describeQuickCapture,
  namesEqual,
  normalize,
  parseQuickCapture,
  type ParsedQuickCapture,
} from './natural-language';

type AreaOption = {
  readonly id: string;
  readonly name: string;
  readonly isInbox: boolean;
};

type ProjectSummary = {
  readonly id: string;
  readonly areaId: string;
  readonly name: string;
  readonly lifecycleState: 'ACTIVE' | 'ARCHIVED' | 'TRASHED';
};

type LabelSummary = {
  readonly id: string;
  readonly name: string;
};

type CreateQuickTaskPayload = {
  readonly title: string;
  readonly areaId: string;
  readonly parsed: ParsedQuickCapture;
  readonly project?: ProjectSummary;
  readonly labelIds: readonly string[];
};

function findProject(
  parsed: ParsedQuickCapture,
  projects: readonly ProjectSummary[],
): ProjectSummary | undefined {
  if (parsed.projectRaw === undefined) {
    return undefined;
  }

  const target = parsed.projectRaw.replace(/^#/, '');

  return projects.find(
    (project) => project.lifecycleState === 'ACTIVE' && namesEqual(project.name, target),
  );
}

function resolveLabels(
  parsed: ParsedQuickCapture,
  labels: readonly LabelSummary[],
): { readonly resolved: LabelSummary[]; readonly missing: readonly string[] } {
  const resolved: LabelSummary[] = [];
  const missing: string[] = [];

  for (const raw of parsed.labelRaws ?? []) {
    const target = raw.replace(/^@/, '');
    const matched = labels.find((label) => namesEqual(label.name, target));

    if (matched !== undefined) {
      resolved.push(matched);
    } else {
      missing.push(raw);
    }
  }

  return { resolved, missing };
}

function resolvedRemovals(
  parsed: ParsedQuickCapture,
  project: ProjectSummary | undefined,
  resolvedLabels: readonly LabelSummary[],
): readonly string[] {
  const removals: string[] = [];

  if (project !== undefined && parsed.projectRaw !== undefined) {
    removals.push(parsed.projectRaw);
  }

  const matchedNames = new Set(resolvedLabels.map((label) => normalize(label.name)));

  for (const raw of parsed.labelRaws ?? []) {
    if (matchedNames.has(normalize(raw.replace(/^@/, '')))) {
      removals.push(raw);
    }
  }

  return removals;
}

function stripTokens(title: string, removals: readonly string[]): string {
  let next = title;

  for (const token of removals) {
    next = next.replace(token, ' ');
  }

  return next.replace(/\s+/g, ' ').trim();
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="size-4"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
    </svg>
  );
}

export type QuickCreateDialogProps = {
  readonly initialAreaId?: string;
  readonly initialProjectId?: string;
  readonly triggerLabel?: string;
};

export function QuickCreateDialog({
  initialAreaId,
  initialProjectId,
  triggerLabel,
}: QuickCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'quick' | 'template'>('quick');
  const [areaId, setAreaId] = useState(initialAreaId ?? '');
  const [projectId, setProjectId] = useState(initialProjectId ?? '');
  const [text, setText] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quickError, setQuickError] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();
  const csrfQuery = useQuery({
    queryKey: csrfQueryKey,
    queryFn: fetchCsrf,
    staleTime: 20 * 60 * 1_000,
  });

  const areas = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const result = await apiClient.get({ url: '/api/v1/areas' });
      if (result.error !== undefined) {
        throw new Error('Alanlar yüklenemedi.');
      }
      return (result.data as { data: AreaOption[] })?.data ?? [];
    },
    enabled: open,
  });

  const projects = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const result = await apiClient.get({
        url: '/api/v1/projects',
        query: { limit: 100 },
      });

      if (result.error !== undefined) {
        throw new Error('Projeler yüklenemedi.');
      }

      return (result.data as { data: ProjectSummary[] })?.data ?? [];
    },
    enabled: open,
  });

  const labels = useQuery({
    queryKey: ['labels'],
    queryFn: async () => {
      const result = await apiClient.get({
        url: '/api/v1/labels',
        query: { limit: 50 },
      });

      if (result.error !== undefined) {
        throw new Error('Etiketler yüklenemedi.');
      }

      return (result.data as { data: LabelSummary[] })?.data ?? [];
    },
    enabled: open,
  });

  const quickAdd = useMutation({
    mutationFn: async (payload: CreateQuickTaskPayload) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);

      const body: Record<string, unknown> = {
        title: payload.title,
        areaId: payload.areaId,
        ...(payload.project !== undefined && { projectId: payload.project.id }),
        ...(payload.labelIds.length > 0 && { labelIds: [...payload.labelIds] }),
        ...(payload.parsed.plannedAt !== undefined && {
          plannedAt: payload.parsed.plannedAt.toISOString(),
        }),
        ...(payload.parsed.priority !== undefined && {
          priority: payload.parsed.priority,
        }),
        ...(payload.parsed.recurrence !== undefined && {
          recurrence: payload.parsed.recurrence,
        }),
      };

      const result = await apiClient.post({
        url: '/api/v1/tasks',
        body,
        headers: {
          'Content-Type': 'application/json',
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
      toast.success('Görev eklendi');
      setText('');
      setQuickError(undefined);
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'kanban'] });
      if (areaId !== '') {
        queryClient.invalidateQueries({ queryKey: ['areas', areaId] });
        queryClient.invalidateQueries({ queryKey: ['areas', areaId, 'tasks'] });
      }
    },
    onError: (error) => {
      setQuickError(error instanceof Error ? error.message : 'Görev eklenemedi.');
    },
  });

  useEffect(() => {
    if (triggerLabel !== undefined) {
      return;
    }
    const onNewTask = () => setOpen(true);
    window.addEventListener('planner:new-task', onNewTask);
    return () => window.removeEventListener('planner:new-task', onNewTask);
  }, [triggerLabel]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setMode('quick');
      setAreaId(initialAreaId ?? '');
      setProjectId(initialProjectId ?? '');
      setText('');
      setShowAdvanced(false);
      setQuickError(undefined);
    }
    setOpen(next);
  };

  const handleQuickSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setQuickError(undefined);

    const trimmed = text.trim();

    if (trimmed.length === 0) {
      setQuickError('Görev başlığı girin.');
      return;
    }

    const parsed = parseQuickCapture(trimmed);
    const project = findProject(parsed, projects.data ?? []);
    const { resolved: resolvedLabels } = resolveLabels(parsed, labels.data ?? []);
    const title = stripTokens(parsed.title, resolvedRemovals(parsed, project, resolvedLabels));

    if (title.length === 0) {
      setQuickError('Görev başlığı girin.');
      return;
    }

    const effectiveAreaId = project?.areaId ?? (areaId !== '' ? areaId : inboxAreaId);

    if (effectiveAreaId.length === 0) {
      setQuickError('Görev ekleneceği alan bulunamadı.');
      return;
    }

    quickAdd.mutate({
      title,
      areaId: effectiveAreaId,
      parsed,
      ...(project !== undefined && { project }),
      labelIds: resolvedLabels.map((label) => label.id),
    });
  };

  const areaOptions = Array.isArray(areas.data) ? areas.data : [];
  const sortedOptions = [...areaOptions].sort((left, right) => {
    if (left.isInbox === right.isInbox) {
      return 0;
    }
    return left.isInbox ? -1 : 1;
  });
  const inboxArea = areaOptions.find((area) => area.isInbox);
  const inboxAreaId = inboxArea?.id ?? '';
  const projectOptions = Array.isArray(projects.data) ? projects.data : [];
  const labelOptions = Array.isArray(labels.data) ? labels.data : [];
  const parsedPreview = text.trim().length > 0 ? parseQuickCapture(text) : undefined;
  const activeProject =
    parsedPreview !== undefined ? findProject(parsedPreview, projectOptions) : undefined;
  const labelResolution =
    parsedPreview !== undefined
      ? resolveLabels(parsedPreview, labelOptions)
      : { resolved: [], missing: [] };
  const removalList =
    parsedPreview !== undefined && activeProject !== undefined
      ? resolvedRemovals(parsedPreview, activeProject, labelResolution.resolved)
      : parsedPreview !== undefined
        ? resolvedRemovals(parsedPreview, undefined, labelResolution.resolved)
        : [];
  const previewTitle =
    parsedPreview !== undefined && parsedPreview.title.length > 0
      ? stripTokens(parsedPreview.title, removalList)
      : undefined;
  const needsResolution =
    parsedPreview?.projectRaw !== undefined || (parsedPreview?.labelRaws?.length ?? 0) > 0;
  const resolutionReady =
    !needsResolution || (projects.data !== undefined && labels.data !== undefined);
  const described = parsedPreview !== undefined ? describeQuickCapture(parsedPreview) : undefined;
  const effectiveAreaId = activeProject?.areaId ?? (areaId !== '' ? areaId : inboxAreaId);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {triggerLabel !== undefined ? (
          <Button type="button" size="sm" variant="outline">
            {triggerLabel}
          </Button>
        ) : (
          <Button variant="default" size="icon" aria-label="Yeni görev oluştur">
            <PlusIcon />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Yeni görev</SheetTitle>
          <SheetDescription>
            Tek satırda hızlıca ekleyin — #proje, @etiket, p1-p3, tarih, saat ve tekrarı yazıyla
            tanıyabilirim.
          </SheetDescription>
        </SheetHeader>

        <div className="flex gap-1 border-b border-border/70 px-4 pb-2" role="tablist" aria-label="Görev oluşturma yöntemi">
          <button
            type="button"
            role="tab"
            id="quick-add-tab"
            aria-selected={mode === 'quick'}
            aria-controls="quick-add-panel"
            onClick={() => setMode('quick')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === 'quick'
                ? 'bg-secondary text-foreground shadow-inner-edge'
                : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground'
            }`}
          >
            Hızlı ekle
          </button>
          <button
            type="button"
            role="tab"
            id="template-tab"
            aria-selected={mode === 'template'}
            aria-controls="template-panel"
            onClick={() => setMode('template')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === 'template'
                ? 'bg-secondary text-foreground shadow-inner-edge'
                : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground'
            }`}
          >
            Şablon
          </button>
        </div>

        <div
          role="tabpanel"
          id="quick-add-panel"
          aria-labelledby="quick-add-tab"
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
          hidden={mode !== 'quick'}
        >
          {!showAdvanced && (
            <form onSubmit={handleQuickSubmit} className="space-y-3">
              <Field>
                <FieldLabel htmlFor="quick-capture">Hızlı ekle</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="quick-capture"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder='Ör: "Yarın 09:00 p1 toplantı #İş @önemli"'
                  />
                  <Button
                    type="submit"
                    disabled={quickAdd.isPending || csrfQuery.isLoading || !resolutionReady}
                    aria-busy={quickAdd.isPending}
                  >
                    Ekle
                  </Button>
                </div>
              </Field>

              {quickError && <FieldError>{quickError}</FieldError>}

              {parsedPreview && previewTitle !== undefined && (
                <div className="space-y-1 text-sm">
                  {previewTitle !== text.trim() && (
                    <p className="text-muted-foreground">
                      Başlık: <span className="font-medium text-foreground">{previewTitle}</span>
                    </p>
                  )}
                  {described !== undefined && <p className="text-muted-foreground">{described}</p>}
                  {activeProject !== undefined && (
                    <p className="text-muted-foreground">
                      Proje:{' '}
                      <span className="font-medium text-foreground">{activeProject.name}</span>
                    </p>
                  )}
                  {labelResolution.resolved.map((label) => (
                    <p key={label.id} className="text-muted-foreground">
                      Etiket: <span className="font-medium text-foreground">{label.name}</span>
                    </p>
                  ))}
                  {parsedPreview.projectRaw !== undefined && activeProject === undefined && (
                    <p className="text-amber-600">
                      Proje &apos;{parsedPreview.projectRaw}&apos; bulunamadı, başlıkta korundu.
                    </p>
                  )}
                  {labelResolution.missing.map((raw) => (
                    <p key={raw} className="text-amber-600">
                      Etiket &apos;{raw}&apos; bulunamadı, başlıkta korundu.
                    </p>
                  ))}
                </div>
              )}
            </form>
          )}

          <Field>
            <FieldLabel htmlFor="quick-area">Alan</FieldLabel>
            {areas.isLoading ? (
              <Spinner />
            ) : (
              <Select
                id="quick-area"
                value={effectiveAreaId}
                onChange={(event) => {
                  setAreaId(event.target.value);
                  if (projectId !== '' && event.target.value !== initialAreaId) {
                    setProjectId('');
                  }
                }}
              >
                <option value="">Gelen Kutusu</option>
                {sortedOptions.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.isInbox ? 'Gelen Kutusu' : area.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          {projectId !== '' && (
            <p className="text-xs text-muted-foreground">
              Görev bu projeye eklenecek. Alanı değiştirirseniz proje seçimi kaldırılır.
            </p>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdvanced((current) => !current)}
              className="w-full"
            >
              {showAdvanced ? 'Hızlı eklemeye dön' : 'Detaylı form kullan'}
            </Button>
          </div>

          {showAdvanced && open && effectiveAreaId !== '' && (
            <CreateTaskFields
              key={effectiveAreaId}
              areaId={effectiveAreaId}
              {...(projectId !== '' && { initialProjectId: projectId })}
              onCancel={() => setShowAdvanced(false)}
              onSuccess={() => {
                setText('');
                setShowAdvanced(false);
              }}
            />
          )}
        </div>

        <div
          role="tabpanel"
          id="template-panel"
          aria-labelledby="template-tab"
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
          hidden={mode !== 'template'}
        >
          <p className="text-sm text-muted-foreground">
            Bir şablon seçin, alan ve projeyi belirleyin — görev şablon içeriğiyle oluşturulsun.
          </p>
          {open && mode === 'template' && <TemplateQuickApply />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
