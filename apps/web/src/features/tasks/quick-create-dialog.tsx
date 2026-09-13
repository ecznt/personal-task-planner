'use client';

import { apiClient } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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

import { CreateTaskFields } from './create-task-fields';
import { parseQuickCapture, type ParsedQuickCapture } from './natural-language';

type AreaOption = {
  readonly id: string;
  readonly name: string;
  readonly isInbox: boolean;
};

function describeParsed(parsed: ParsedQuickCapture): string | undefined {
  const labels: string[] = [];

  if (parsed.dueAt) {
    labels.push(
      new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'short',
        hour: parsed.dueAt.getHours() === 23 && parsed.dueAt.getMinutes() === 59 ? undefined : '2-digit',
        minute: parsed.dueAt.getHours() === 23 && parsed.dueAt.getMinutes() === 59 ? undefined : '2-digit',
      }).format(parsed.dueAt),
    );
  }

  if (parsed.priority === 'HIGH') {
    labels.push('Önemli');
  }
  if (parsed.priority === 'LOW') {
    labels.push('Düşük öncelik');
  }
  if (parsed.recurrence !== undefined) {
    const frequency = {
      DAILY: 'Her gün',
      WEEKDAYS: 'Her iş günü',
      WEEKLY: 'Her hafta',
      MONTHLY: 'Her ay',
      YEARLY: 'Her yıl',
    }[parsed.recurrence.frequency];
    labels.push(frequency ?? 'Tekrarlı');
  }

  return labels.length > 0 ? labels.join(' · ') : undefined;
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

  const quickAdd = useMutation({
    mutationFn: async (payload: { title: string; parsed: ParsedQuickCapture }) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);

      const body: Record<string, unknown> = {
        title: payload.title,
        ...(areaId !== '' && { areaId }),
        ...(projectId !== '' && { projectId }),
        ...(payload.parsed.dueAt !== undefined && { dueAt: payload.parsed.dueAt.toISOString() }),
        ...(payload.parsed.priority !== undefined && { priority: payload.parsed.priority }),
        ...(payload.parsed.recurrence !== undefined && { recurrence: payload.parsed.recurrence }),
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

  const handleOpenChange = (next: boolean) => {
    if (!next) {
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

    if (parsed.title.length === 0) {
      setQuickError('Görev başlığı girin.');
      return;
    }

    quickAdd.mutate({ title: parsed.title, parsed });
  };

  const areaOptions = Array.isArray(areas.data) ? areas.data : [];
  const sortedOptions = [...areaOptions].sort((left, right) => {
    if (left.isInbox === right.isInbox) {
      return 0;
    }
    return left.isInbox ? -1 : 1;
  });
  const inboxArea = areaOptions.find((area) => area.isInbox);
  const effectiveAreaId = areaId !== '' ? areaId : inboxArea?.id ?? '';
  const parsedPreview = text.trim().length > 0 ? parseQuickCapture(text) : undefined;

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
            Tek satırda hızlıca ekleyin — tarih, saat, tekrar ve önceliği yazıyla tanıyabilirim.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          {!showAdvanced && (
            <form onSubmit={handleQuickSubmit} className="space-y-3">
              <Field>
                <FieldLabel htmlFor="quick-capture">Hızlı ekle</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="quick-capture"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder='Ör: "Pazartesi 09:00 önemli toplantı"'
                  />
                  <Button
                    type="submit"
                    disabled={quickAdd.isPending || csrfQuery.isLoading}
                    aria-busy={quickAdd.isPending}
                  >
                    Ekle
                  </Button>
                </div>
              </Field>

              {quickError && <FieldError>{quickError}</FieldError>}

              {parsedPreview && parsedPreview.title.length > 0 && parsedPreview.title !== text.trim() && (
                <p className="text-sm text-muted-foreground">
                  Başlık: <span className="font-medium text-foreground">{parsedPreview.title}</span>
                </p>
              )}
              {parsedPreview && describeParsed(parsedPreview) !== undefined && (
                <p className="text-sm text-muted-foreground">{describeParsed(parsedPreview)}</p>
              )}
              {parsedPreview && parsedPreview.title !== text.trim() && (
                <p className="text-xs text-muted-foreground/70">
                  Girdiğiniz metin tarih ve zaman bilgisi içeriyor — aldığım değerler daha yukarıda görünür, düzeltmek için detaylı formu kullanın.
                </p>
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
      </SheetContent>
    </Sheet>
  );
}