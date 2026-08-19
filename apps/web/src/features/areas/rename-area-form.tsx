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

import { renameAreaSchema, type RenameAreaFormValues } from './area-schema';

type RenameAreaData = {
  readonly id: string;
  readonly name: string;
  readonly version: number;
};

type RenameAreaFormProps = {
  readonly areaId: string;
  readonly currentName: string;
  readonly version: number;
};

export function RenameAreaForm({ areaId, currentName, version }: RenameAreaFormProps) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const csrfQuery = useQuery({
    queryKey: csrfQueryKey,
    queryFn: fetchCsrf,
    staleTime: 20 * 60 * 1_000,
  });
  const form = useForm<RenameAreaFormValues>({
    defaultValues: { name: currentName },
    resolver: zodResolver(renameAreaSchema),
    values: { name: currentName },
  });
  const rename = useMutation({
    mutationFn: async (values: RenameAreaFormValues) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);

      const result = await apiClient.patch({
        url: `/api/v1/areas/${areaId}`,
        body: { name: values.name },
        headers: {
          'X-CSRF-Token': csrf.token,
          'If-Match': String(version),
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      const data = result.data as { data: RenameAreaData } | undefined;

      if (data?.data === undefined) {
        throw new Error('Alan yeniden adlandırılamadı.');
      }

      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      queryClient.invalidateQueries({ queryKey: ['areas', areaId] });
      form.reset();
      setShowForm(false);
    },
  });

  if (!showForm) {
    return (
      <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
        Yeniden Adlandır
      </Button>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-lg font-medium">Alanı Yeniden Adlandır</h3>
      <form
        onSubmit={form.handleSubmit((values) => rename.mutate(values))}
        className="mt-3 space-y-4"
      >
        {rename.isError && (
          <Alert variant="destructive">
            <AlertTitle>Hata</AlertTitle>
            <AlertDescription>{rename.error.message}</AlertDescription>
          </Alert>
        )}
        <Field>
          <FieldLabel htmlFor="name">Yeni Ad</FieldLabel>
          <Input id="name" {...form.register('name')} />
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
          <Button type="submit" disabled={rename.isPending}>
            {rename.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  );
}
