'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';

type AreaOption = {
  readonly id: string;
  readonly name: string;
};

const quickSchema = z.object({
  title: z.string().trim().min(1, 'Görev başlığı zorunludur.'),
  areaId: z.string().min(1, 'Bir alan seçin.'),
});

type QuickValues = z.infer<typeof quickSchema>;

export function QuickCreateDialog() {
  const [open, setOpen] = useState(false);
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
  });

  const form = useForm<QuickValues>({
    defaultValues: { title: '', areaId: '' },
    resolver: zodResolver(quickSchema),
  });
  const { setFocus } = form;

  useEffect(() => {
    if (open) {
      setFocus('title');
    }
  }, [open, setFocus]);

  const create = useMutation({
    mutationFn: async (values: QuickValues) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);
      const result = await apiClient.post({
        url: '/api/v1/areas/{areaId}/tasks',
        path: { areaId: values.areaId },
        body: {
          title: values.title,
          description: null,
          plannedAt: null,
          dueAt: null,
          priority: 'MEDIUM',
        },
        headers: { 'X-CSRF-Token': csrf.token, 'Idempotency-Key': crypto.randomUUID() },
      });
      if (result.error !== undefined) {
        throw apiError(result);
      }
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['areas'] });
      void queryClient.invalidateQueries({ queryKey: ['today'] });
      setOpen(false);
      form.reset();
    },
  });

  const areaOptions = Array.isArray(areas.data) ? areas.data : [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="default" size="icon" aria-label="Yeni görev oluştur">
          <PlusIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Yeni görev</SheetTitle>
          <SheetDescription>Görevin başlığını ve alanını seçin.</SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-1 flex-col gap-4 px-4"
          onSubmit={form.handleSubmit((values) => create.mutate(values))}
        >
          <Field>
            <FieldLabel htmlFor="quick-title">Başlık</FieldLabel>
            <Input
              id="quick-title"
              {...form.register('title')}
              aria-invalid={Boolean(form.formState.errors.title)}
            />
            {form.formState.errors.title && (
              <FieldError>{form.formState.errors.title.message}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="quick-area">Alan</FieldLabel>
            {areas.isLoading ? (
              <Spinner />
            ) : (
              <select
                id="quick-area"
                className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-invalid={Boolean(form.formState.errors.areaId)}
                {...form.register('areaId')}
              >
                <option value="">Alan seçin</option>
                {areaOptions.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            )}
            {form.formState.errors.areaId && (
              <FieldError>{form.formState.errors.areaId.message}</FieldError>
            )}
          </Field>

          {create.isError && (
            <p role="alert" className="text-sm text-destructive">
              {create.error.message}
            </p>
          )}

          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" variant="outline">
                İptal
              </Button>
            </SheetClose>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Spinner /> : 'Oluştur'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
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
