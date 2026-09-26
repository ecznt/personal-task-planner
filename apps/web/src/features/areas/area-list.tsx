'use client';

import { apiClient } from '@planner/api-client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { Spinner } from '@/components/ui/spinner';
import { RowLifecycleMenu } from '@/features/lifecycle/row-lifecycle-menu';

import { CreateAreaForm } from './create-area-form';

type AreaSummary = {
  readonly id: string;
  readonly name: string;
  readonly lifecycleState: string;
  readonly version: number;
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
        <PageHeader
          title="Alanlar"
          eyebrow="Alanlar"
          description="Her görevin bir alana ihtiyacı vardır. İlk alanınızı oluşturun."
        />
        <CreateAreaForm />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PageHeader
          title="Alanlar"
          eyebrow="Alanlar"
          description="Görevlerinizi düzenlemek için alanlarınızı yönetin."
        />
        <CreateAreaForm />
      </div>
      <div className="grid gap-4">
        {areaList.map((area, index) => (
          <div
            key={area.id}
            className="animate-fade-slide-in"
            style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
          >
            <Card className="transition-all duration-150 active:scale-[0.97] hover:border-border hover:shadow-surface-hover">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <Link href={`/app/areas/${area.id}`} className="min-w-0 flex-1">
                  <CardTitle className="text-lg">{area.name}</CardTitle>
                </Link>
                <RowLifecycleMenu
                  resourceType="areas"
                  id={area.id}
                  name={area.name}
                  version={area.version}
                />
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
          </div>
        ))}
      </div>
    </div>
  );
}
