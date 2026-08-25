import { apiClient } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';

import { addChecklistItemSchema, type AddChecklistItemFormValues } from './checklist-schema';

type ChecklistItem = {
  readonly id: string;
  readonly text: string;
  readonly position: number;
  readonly completed: boolean;
};

type ChecklistProps = {
  readonly taskId: string;
};

export function Checklist({ taskId }: ChecklistProps) {
  const [isAdding, setIsAdding] = useState(false);
  const queryClient = useQueryClient();

  const csrfQuery = useQuery({
    queryKey: csrfQueryKey,
    queryFn: fetchCsrf,
    staleTime: 20 * 60 * 1_000,
  });

  const items = useQuery({
    queryKey: ['tasks', taskId, 'checklist'],
    queryFn: async () => {
      const result = await apiClient.get({
        url: '/api/v1/tasks/{taskId}/checklist-items',
        path: { taskId },
      });

      if (result.error !== undefined) {
        throw new Error('Kontrol listesi yüklenemedi.');
      }

      return (result.data as { data: ChecklistItem[] }).data ?? [];
    },
  });

  const addItem = useMutation({
    mutationFn: async (values: AddChecklistItemFormValues) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);

      const result = await apiClient.post({
        url: '/api/v1/tasks/{taskId}/checklist-items',
        path: { taskId },
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
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'checklist'] });
      setIsAdding(false);
    },
  });

  const toggleItem = useMutation({
    mutationFn: async (item: ChecklistItem) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);

      const result = await apiClient.patch({
        url: '/api/v1/tasks/{taskId}/checklist-items/{checklistItemId}',
        path: { taskId, checklistItemId: item.id },
        body: {},
        headers: {
          'X-CSRF-Token': csrf.token,
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'checklist'] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);

      const result = await apiClient.delete({
        url: '/api/v1/tasks/{taskId}/checklist-items/{checklistItemId}',
        path: { taskId, checklistItemId: itemId },
        headers: {
          'X-CSRF-Token': csrf.token,
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'checklist'] });
    },
  });

  if (items.isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner />
      </div>
    );
  }

  if (items.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Hata</AlertTitle>
        <AlertDescription>
          {items.error?.message ?? 'Kontrol listesi yüklenemedi.'}
        </AlertDescription>
      </Alert>
    );
  }

  const itemList = items.data ?? [];
  const completedCount = itemList.filter((i) => i.completed).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">
          Kontrol Listesi {itemList.length > 0 && `(${completedCount}/${itemList.length})`}
        </h4>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? 'İptal' : '+ Yeni Madde'}
        </Button>
      </div>

      {isAdding && (
        <AddItemForm
          onSubmit={(values) => addItem.mutate(values)}
          isPending={addItem.isPending}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {itemList.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz kontrol maddesi eklenmemiş.</p>
      ) : (
        <div className="space-y-1">
          {itemList.map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
              <button
                type="button"
                onClick={() => toggleItem.mutate(item)}
                disabled={toggleItem.isPending}
                className={`flex h-5 w-5 items-center justify-center rounded border transition-colors duration-150 active:scale-90 ${
                  item.completed
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-transparent hover:bg-muted'
                }`}
              >
                {item.completed && (
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span
                className={`flex-1 text-sm ${
                  item.completed ? 'text-muted-foreground line-through' : ''
                }`}
              >
                {item.text}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground transition-colors duration-150 active:scale-90 hover:text-destructive"
                onClick={() => deleteItem.mutate(item.id)}
                disabled={deleteItem.isPending}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddItemForm({
  onSubmit,
  isPending,
  onCancel,
}: {
  onSubmit: (values: AddChecklistItemFormValues) => void;
  isPending: boolean;
  onCancel: () => void;
}) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = addChecklistItemSchema.safeParse({ text });
    if (result.success) {
      onSubmit(result.data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Field className="flex-1">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Madde başlığı"
          className="h-8"
        />
      </Field>
      <Button type="submit" size="sm" disabled={isPending || text.trim().length === 0}>
        {isPending ? 'Ekleniyor...' : 'Ekle'}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onCancel}>
        İptal
      </Button>
    </form>
  );
}
