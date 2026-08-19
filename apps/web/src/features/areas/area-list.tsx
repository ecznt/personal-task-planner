'use client';

import { apiClient } from '@planner/api-client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

import { CreateAreaForm } from './create-area-form';

type AreaSummary = {
  readonly id: string;
  readonly name: string;
  readonly lifecycleState: string;
  readonly taskCount: number;
  readonly projectCount: number;
  readonly overdueTaskCount: number;
};

export function AreaList() {
  const areas = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const result = await apiClient.get({
        url: '/api/v1/areas',
      });

      if (result.error !== undefined) {
        throw new Error('Alanlar yüklenemedi.');
      }

      return (result.data as { data: AreaSummary[]; meta: { nextCursor?: string } })?.data ?? [];
    },
  });

  if (areas.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (areas.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Hata</AlertTitle>
        <AlertDescription>{areas.error.message}</AlertDescription>
      </Alert>
    );
  }

  const areaList = areas.data ?? [];

  if (areaList.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alanlar</h1>
          <p className="text-muted-foreground">
            Her görevin bir alana ihtiyacı vardır. İlk alanınızı oluşturun.
          </p>
        </div>
        <CreateAreaForm />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alanlar</h1>
          <p className="text-muted-foreground">
            Görevlerinizi düzenlemek için alanlarınızı yönetin.
          </p>
        </div>
        <CreateAreaForm />
      </div>
      <div className="grid gap-4">
        {areaList.map((area) => (
          <Link key={area.id} href={`/app/areas/${area.id}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{area.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{area.taskCount} görev</span>
                  <span>{area.projectCount} proje</span>
                  {area.overdueTaskCount > 0 && (
                    <span className="text-destructive">{area.overdueTaskCount} gecikmiş</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
