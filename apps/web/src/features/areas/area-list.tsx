'use client';

import { apiClient } from '@planner/api-client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
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
          <Link
            key={area.id}
            href={`/app/areas/${area.id}`}
            className="animate-fade-slide-in"
            style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
          >
            <Card className="transition-all duration-150 active:scale-[0.97] hover:border-border hover:shadow-surface-hover">
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
