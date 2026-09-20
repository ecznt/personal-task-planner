'use client';

import { apiClient } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ListPlusIcon, PencilIcon, PlayIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';

import {
  createTemplateSchema,
  splitCommaSeparated,
  splitLines,
  type CreateTemplateFormValues,
} from './template-schema';
import { TemplateApplyForm, type TemplateSummaryForApply } from './template-apply-form';

type TaskTemplateSummary = {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly checklistSteps: readonly string[];
  readonly labelNames: readonly string[];
  readonly defaultPlannedAtOffsetDays?: number;
  readonly version: number;
  readonly updatedAt: string;
};

const PRIORITY_LABEL: Record<'LOW' | 'MEDIUM' | 'HIGH', string> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
};

const PRIORITY_BADGE: Record<'LOW' | 'MEDIUM' | 'HIGH', 'neutral' | 'info' | 'warning'> = {
  LOW: 'neutral',
  MEDIUM: 'info',
  HIGH: 'warning',
};

type TemplateFormValues = {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  checklistText: string;
  labelText: string;
  offsetDays: string;
};

function TemplateForm({
  initial,
  submitLabel,
  busyLabel,
  isBusy,
  onSubmit,
  onCancel,
}: {
  readonly initial: TemplateFormValues | undefined;
  readonly submitLabel: string;
  readonly busyLabel: string;
  readonly isBusy: boolean;
  readonly onSubmit: (values: CreateTemplateFormValues) => void;
  readonly onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>(
    initial?.priority ?? 'MEDIUM',
  );
  const [checklistText, setChecklistText] = useState(initial?.checklistText ?? '');
  const [labelText, setLabelText] = useState(initial?.labelText ?? '');
  const [offsetDays, setOffsetDays] = useState(initial?.offsetDays ?? '');
  const [error, setError] = useState<string | undefined>(undefined);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(undefined);

    const parsed = createTemplateSchema.safeParse({
      title,
      ...(description.trim().length > 0 && { description }),
      priority,
      checklistSteps: splitLines(checklistText),
      labelNames: splitCommaSeparated(labelText),
      ...(offsetDays.trim().length > 0 && { defaultPlannedAtOffsetDays: offsetDays }),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Geçersiz form.');
      return;
    }

    onSubmit(parsed.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field>
        <FieldLabel htmlFor="template-title">Şablon adı</FieldLabel>
        <Input
          id="template-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ör: Haftalık planlama toplantısı"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="template-description">Açıklama (isteğe bağlı)</FieldLabel>
        <textarea
          id="template-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          className="h-auto w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-inner-edge outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="template-priority">Öncelik</FieldLabel>
        <Select
          id="template-priority"
          value={priority}
          onChange={(event) => setPriority(event.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
        >
          <option value="LOW">Düşük</option>
          <option value="MEDIUM">Orta</option>
          <option value="HIGH">Yüksek</option>
        </Select>
      </Field>

      <Field>
        <FieldLabel htmlFor="template-steps">Onay listesi (her satır bir adım)</FieldLabel>
        <textarea
          id="template-steps"
          value={checklistText}
          onChange={(event) => setChecklistText(event.target.value)}
          rows={3}
          placeholder={'Ajandayı kontrol et\nGündem maddelerini yaz'}
          className="h-auto w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-inner-edge outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="template-labels">Etiketler (virgülle ayırın)</FieldLabel>
        <Input
          id="template-labels"
          value={labelText}
          onChange={(event) => setLabelText(event.target.value)}
          placeholder="toplantı, iş"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="template-offset">Planlanma günü sonrası (isteğe bağlı)</FieldLabel>
        <Input
          id="template-offset"
          type="number"
          min={0}
          max={365}
          value={offsetDays}
          onChange={(event) => setOffsetDays(event.target.value)}
          placeholder="0 = bugün"
        />
      </Field>

      {error !== undefined && <FieldError>{error}</FieldError>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isBusy} aria-busy={isBusy}>
          {isBusy ? busyLabel : submitLabel}
        </Button>
        {onCancel !== undefined && (
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>
            İptal
          </Button>
        )}
      </div>
    </form>
  );
}

function ApplyTemplateDialog({
  template,
  onClose,
}: {
  readonly template: TemplateSummaryForApply;
  readonly onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Şablondan görev oluştur</DialogTitle>
          <DialogDescription>
            &apos;{template.title}&apos; alanını ve projesini seçin, görevi oluşturun.
          </DialogDescription>
        </DialogHeader>
        <TemplateApplyForm template={template} onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  );
}

export function TemplateList() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<TemplateFormValues | undefined>(undefined);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const csrfQuery = useQuery({ queryKey: csrfQueryKey, queryFn: fetchCsrf, staleTime: 20 * 60 * 1_000 });

  const templates = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const result = await apiClient.get({ url: '/api/v1/task-templates' });
      if (result.error !== undefined) {
        throw new Error('Şablonlar yüklenemedi.');
      }
      return (result.data as { data: TaskTemplateSummary[] }).data ?? [];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (values: CreateTemplateFormValues) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);
      const result = await apiClient.post({
        url: '/api/v1/task-templates',
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
      toast.success('Şablon oluşturuldu');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setCreating(false);
    },
    onError: (creationError) => {
      toast.error(creationError instanceof Error ? creationError.message : 'Şablon oluşturulamadı.');
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, version, values }: { id: string; version: number; values: CreateTemplateFormValues }) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);
      const result = await apiClient.patch({
        url: '/api/v1/task-templates/{templateId}',
        path: { templateId: id },
        body: values,
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
      toast.success('Şablon güncellendi');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setEditingId(null);
      setEditingValues(undefined);
    },
    onError: (updateError) => {
      toast.error(updateError instanceof Error ? updateError.message : 'Şablon güncellenemedi.');
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async ({ id, version }: { id: string; version: number }) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);
      const result = await apiClient.delete({
        url: '/api/v1/task-templates/{templateId}',
        path: { templateId: id },
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
      toast.success('Şablon silindi');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (deleteError) => {
      toast.error(deleteError instanceof Error ? deleteError.message : 'Şablon silinemedi.');
    },
  });

  const applyingTemplate =
    applyingId !== null ? (templates.data ?? []).find((template) => template.id === applyingId) : undefined;

  if (templates.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (templates.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Hata</AlertTitle>
        <AlertDescription>{templates.error?.message ?? 'Şablonlar yüklenemedi.'}</AlertDescription>
      </Alert>
    );
  }

  const templateList = templates.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Şablonlar"
        eyebrow="Şablonlar"
        description="Sık kullandığınız görev yapılarını saklayın ve tek tıkla görev oluşturun."
      />

      {!creating && (
        <Button type="button" size="sm" onClick={() => setCreating(true)}>
          <ListPlusIcon className="size-4" aria-hidden="true" />
          Yeni şablon
        </Button>
      )}

      {creating && (
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-surface">
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">Yeni Şablon</h4>
          <TemplateForm
            initial={undefined}
            submitLabel="Şablonu kaydet"
            busyLabel="Kaydediliyor..."
            isBusy={createTemplate.isPending}
            onSubmit={(values) => createTemplate.mutate(values)}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {templateList.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz şablon oluşturulmamış.</p>
      ) : (
        <div className="space-y-3">
          {templateList.map((template) => (
            <div
              key={template.id}
              className="card-surface flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-surface transition-all duration-150 hover:border-border hover:shadow-surface-hover active:scale-[0.99] sm:flex-row sm:items-start"
            >
              {editingId === template.id ? (
                <div className="min-w-0 flex-1">
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">Şablonu Düzenle</h4>
                  <TemplateForm
                    initial={editingValues}
                    submitLabel="Kaydet"
                    busyLabel="Kaydediliyor..."
                    isBusy={updateTemplate.isPending}
                    onSubmit={(values) =>
                      updateTemplate.mutate({ id: template.id, version: template.version, values })
                    }
                    onCancel={() => {
                      setEditingId(null);
                      setEditingValues(undefined);
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{template.title}</span>
                      <Badge variant={PRIORITY_BADGE[template.priority]}>
                        {PRIORITY_LABEL[template.priority]}
                      </Badge>
                      {template.defaultPlannedAtOffsetDays !== undefined && (
                        <Badge variant="outline">
                          +{template.defaultPlannedAtOffsetDays} gün
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{template.checklistSteps.length} onay adımı</span>
                      {template.labelNames.map((label) => (
                        <span key={label}>@{label}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setApplyingId(template.id)}
                      className="mr-1"
                    >
                      <PlayIcon className="size-3.5" aria-hidden="true" />
                      Uygula
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground"
                      aria-label={`${template.title} şablonunu düzenle`}
                      onClick={() => {
                        setEditingValues({
                          title: template.title,
                          description: template.description ?? '',
                          priority: template.priority,
                          checklistText: template.checklistSteps.join('\n'),
                          labelText: template.labelNames.join(', '),
                          offsetDays:
                            template.defaultPlannedAtOffsetDays !== undefined
                              ? String(template.defaultPlannedAtOffsetDays)
                              : '',
                        });
                        setEditingId(template.id);
                      }}
                    >
                      <PencilIcon className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      aria-label={`${template.title} şablonunu sil`}
                      onClick={() => {
                        if (!window.confirm(`Şablonu silmek istediğinize emin misiniz? "${template.title}"`)) {
                          return;
                        }
                        deleteTemplate.mutate({ id: template.id, version: template.version });
                      }}
                    >
                      <Trash2Icon className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {applyingTemplate !== undefined && (
        <ApplyTemplateDialog template={applyingTemplate} onClose={() => setApplyingId(null)} />
      )}
    </div>
  );
}