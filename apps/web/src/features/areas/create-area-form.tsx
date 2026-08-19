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
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';

import { createAreaSchema, type CreateAreaFormValues } from './area-schema';

type CreateAreaData = {
  readonly id: string;
  readonly name: string;
};

export function CreateAreaForm() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const csrfQuery = useQuery({
    queryKey: csrfQueryKey,
    queryFn: fetchCsrf,
    staleTime: 20 * 60 * 1_000,
  });
  const form = useForm<CreateAreaFormValues>({
    defaultValues: { name: '' },
    resolver: zodResolver(createAreaSchema),
  });
  const create = useMutation({
    mutationFn: async (values: CreateAreaFormValues) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);

      const result = await apiClient.post({
        url: '/api/v1/areas',
        body: { name: values.name },
        headers: {
          'X-CSRF-Token': csrf.token,
          'Idempotency-Key': crypto.randomUUID(),
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      const data = result.data as { data: CreateAreaData } | undefined;

      if (data?.data === undefined) {
        throw new Error('Alan oluşturulamadı.');
      }

      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      form.reset();
      setShowForm(false);
    },
  });

  if (!showForm) {
    return <Button onClick={() => setShowForm(true)}>Yeni Alan</Button>;
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-lg font-medium">Yeni Alan Oluştur</h3>
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
          <FieldLabel htmlFor="name">Alan Adı</FieldLabel>
          <Input id="name" placeholder="Örn: Kişisel Planlama" {...form.register('name')} />
          {form.formState.errors.name && (
            <FieldError>{form.formState.errors.name.message}</FieldError>
          )}
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
