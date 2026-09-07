'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';

import { createTaskSchema, type CreateTaskFormValues } from './task-schema';

type CreateTaskData = {
  readonly id: string;
  readonly title: string;
};

type CreateTaskFormProps = {
  readonly areaId: string;
  readonly onSuccess?: () => void;
};

export function CreateTaskForm({ areaId, onSuccess }: CreateTaskFormProps) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const csrfQuery = useQuery({
    queryKey: csrfQueryKey,
    queryFn: fetchCsrf,
    staleTime: 20 * 60 * 1_000,
  });
  const form = useForm<CreateTaskFormValues>({
    defaultValues: { title: '', description: '', priority: 'MEDIUM' },
    resolver: zodResolver(createTaskSchema),
  });
  const create = useMutation({
    mutationFn: async (values: CreateTaskFormValues) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);

      const result = await apiClient.post({
        url: '/api/v1/areas/{areaId}/tasks',
        path: { areaId },
        body: {
          title: values.title,
          description: values.description || null,
          plannedAt: values.plannedAt || null,
          dueAt: values.dueAt || null,
          priority: values.priority,
        },
        headers: {
          'X-CSRF-Token': csrf.token,
          'Idempotency-Key': crypto.randomUUID(),
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      const data = result.data as { data: CreateTaskData } | undefined;

      if (data?.data === undefined) {
        throw new Error('Görev oluşturulamadı.');
      }

      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', areaId, 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['areas', areaId] });
      form.reset();
      setShowForm(false);
      onSuccess?.();
    },
  });

  if (!showForm) {
    return <Button onClick={() => setShowForm(true)}>Yeni Görev</Button>;
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-lg font-medium">Yeni Görev Oluştur</h3>
      <form
        onSubmit={form.handleSubmit((values) => create.mutate(values))}
        className="mt-3 space-y-4"
      >
        {create.isError && (
          <Alert variant="destructive">
            <AlertTitle>Hata</AlertTitle>
            <AlertDescription>{create.error.message}</AlertDescription>
          </Alert>
        )}
        <Field>
          <FieldLabel htmlFor="title">Başlık</FieldLabel>
          <Input id="title" placeholder="Örn: Marketten süt al" {...form.register('title')} />
          {form.formState.errors.title && (
            <FieldError>{form.formState.errors.title.message}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="description">Açıklama (isteğe bağlı)</FieldLabel>
          <textarea
            id="description"
            rows={3}
            className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            placeholder="Görev detayları..."
            {...form.register('description')}
          />
          {form.formState.errors.description && (
            <FieldError>{form.formState.errors.description.message}</FieldError>
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="plannedAt">Başlangıç Tarihi</FieldLabel>
            <Input id="plannedAt" type="datetime-local" {...form.register('plannedAt')} />
          </Field>
          <Field>
            <FieldLabel htmlFor="dueAt">Bitiş Tarihi</FieldLabel>
            <Input id="dueAt" type="datetime-local" {...form.register('dueAt')} />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="priority">Öncelik</FieldLabel>
          <Select id="priority" {...form.register('priority')}>
            <option value="LOW">Düşük</option>
            <option value="MEDIUM">Orta</option>
            <option value="HIGH">Yüksek</option>
          </Select>
        </Field>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowForm(false);
              form.reset();
            }}
          >
            İptal
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
          </Button>
        </div>
      </form>
    </div>
  );
}
