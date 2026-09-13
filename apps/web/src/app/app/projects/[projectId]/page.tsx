import type { Metadata } from 'next';

import { ProjectDetail } from '@/features/projects/project-detail';

export const metadata: Metadata = {
  title: 'Proje',
};

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <ProjectDetail projectId={projectId} />
    </div>
  );
}