import type { Metadata } from 'next';

import { ProjectList } from '@/features/projects/project-list';

export const metadata: Metadata = {
  title: 'Projeler',
};

export default function ProjectsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <ProjectList />
    </div>
  );
}