'use client';

import { apiClient } from '@planner/api-client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { AreaKanbanBoard } from '@/features/kanban/area-kanban-board';
import { ProjectManager } from '@/features/projects/project-manager';
import { TaskList } from '@/features/tasks/task-list';

import { RenameAreaForm } from './rename-area-form';
import { StatusEditor } from './status-editor';

type AreaStatusData = {
  readonly id: string;
  readonly name: string;
  readonly canonicalStatus: string;
  readonly position: number;
  readonly isDefault: boolean;
  readonly active: boolean;
};

type AreaDetailData = {
  readonly id: string;
  readonly name: string;
  readonly lifecycleState: string;
  readonly version: number;
  readonly taskCount: number;
  readonly projectCount: number;
  readonly statuses: readonly AreaStatusData[];
};

type AreaDetailProps = {
  readonly areaId: string;
};

export function AreaDetail({ areaId }: AreaDetailProps) {
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const area = useQuery({
    queryKey: ['areas', areaId],
    queryFn: async () => {
      const result = await apiClient.get({
        url: `/api/v1/areas/${areaId}`,
      });

      if (result.error !== undefined) {
        throw new Error('Alan yüklenemedi.');
      }

      return (result.data as { data: AreaDetailData })?.data;
    },
  });

  if (area.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (area.isError || area.data === undefined) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Hata</AlertTitle>
        <AlertDescription>{area.error?.message ?? 'Alan bulunamadı.'}</AlertDescription>
      </Alert>
    );
  }

  const areaData = area.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/app/areas" className="text-sm text-muted-foreground hover:underline">
            ← Alanlara dön
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">{areaData.name}</h1>
        </div>
        <RenameAreaForm areaId={areaId} currentName={areaData.name} version={areaData.version} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Görevler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{areaData.taskCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Projeler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{areaData.projectCount}</div>
          </CardContent>
        </Card>
      </div>

      {areaData.statuses && areaData.statuses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Durumlar</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusEditor areaId={areaId} areaData={areaData} />
          </CardContent>
        </Card>
      )}

      <div className="rounded-lg border bg-card p-4">
        <ProjectManager areaId={areaId} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Görevler</h2>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border bg-muted p-0.5">
              <button
                type="button"
                onClick={() => setView('list')}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors duration-150 ${
                  view === 'list'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                Liste
              </button>
              <button
                type="button"
                onClick={() => setView('kanban')}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors duration-150 ${
                  view === 'kanban'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                Kanban
              </button>
            </div>
            <Link href={`/app/areas/${areaId}/tasks/new`}>
              <Button size="sm">Yeni Görev</Button>
            </Link>
          </div>
        </div>
        {view === 'list' ? <TaskList areaId={areaId} /> : <AreaKanbanBoard areaId={areaId} />}
      </div>
    </div>
  );
}
