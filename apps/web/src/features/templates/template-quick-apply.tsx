'use client';

import { apiClient } from '@planner/api-client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { Spinner } from '@/components/ui/spinner';

import { TemplateApplyForm } from './template-apply-form';

type TemplateApplySummary = {
  readonly id: string;
  readonly title: string;
  readonly defaultPlannedAtOffsetDays?: number;
  readonly version: number;
};

export function TemplateQuickApply() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const templates = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const result = await apiClient.get({ url: '/api/v1/task-templates' });
      if (result.error !== undefined) {
        throw new Error('Şablonlar yüklenemedi.');
      }
      return (result.data as { data: TemplateApplySummary[] }).data ?? [];
    },
  });

  const selected = selectedId !== null ? (templates.data ?? []).find((template) => template.id === selectedId) : undefined;

  if (templates.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (templates.isError) {
    return <p className="text-sm text-destructive">Şablonlar yüklenemedi.</p>;
  }

  const templateList = templates.data ?? [];

  if (templateList.length === 0) {
    return <p className="text-sm text-muted-foreground">Henüz şablon oluşturulmamış.</p>;
  }

  return (
    <div className="space-y-3">
      <select
        value={selectedId ?? ''}
        onChange={(event) => setSelectedId(event.target.value !== '' ? event.target.value : null)}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Şablon seçin"
      >
        <option value="">Şablon seçin</option>
        {templateList.map((template) => (
          <option key={template.id} value={template.id}>
            {template.title}
          </option>
        ))}
      </select>

      {selected !== undefined && (
        <TemplateApplyForm
          template={selected}
          onSuccess={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}