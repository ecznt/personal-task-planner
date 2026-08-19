'use client';

import { apiClient } from '@planner/api-client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

import { RenameAreaForm } from './rename-area-form';

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
            <div className="flex flex-wrap gap-2">
              {areaData.statuses.map((status) => (
                <div key={status.id} className="rounded-full border px-3 py-1 text-sm">
                  {status.name}
                  {status.isDefault && (
                    <span className="ml-1 text-muted-foreground">(varsayılan)</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
