'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { CreateTaskFields } from './create-task-fields';

type CreateTaskFormProps = {
  readonly areaId: string;
  readonly onSuccess?: () => void;
};

export function CreateTaskForm({ areaId, onSuccess }: CreateTaskFormProps) {
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return <Button onClick={() => setShowForm(true)}>Yeni Görev</Button>;
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-lg font-medium">Yeni Görev Oluştur</h3>
      <div className="mt-3">
        <CreateTaskFields
          areaId={areaId}
          onCancel={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            onSuccess?.();
          }}
        />
      </div>
    </div>
  );
}
