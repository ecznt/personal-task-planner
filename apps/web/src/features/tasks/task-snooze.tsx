'use client';

import { apiClient } from '@planner/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Calendar, ChevronDown, Check, Bell } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

export type SnoozeTarget = 'PLANNED' | 'DUE' | 'BOTH';
export type SnoozeUnit = 'MINUTES' | 'HOURS' | 'DAYS';

export type TaskSnoozeParams = {
  taskId: string;
  version: number;
  target: SnoozeTarget;
  amount: number;
  unit: SnoozeUnit;
};

type SnoozePreset = {
  label: string;
  amount: number;
  unit: SnoozeUnit;
  icon?: React.ComponentType<{ className?: string }>;
};

const TARGET_LABELS: Record<SnoozeTarget, string> = {
  PLANNED: 'Planlanan Tarih',
  DUE: 'Bitiş Tarihi',
  BOTH: 'Her İkisi',
};

const PRESETS: SnoozePreset[] = [
  { label: '15 dk', amount: 15, unit: 'MINUTES', icon: Clock },
  { label: '30 dk', amount: 30, unit: 'MINUTES', icon: Clock },
  { label: '1 sa', amount: 1, unit: 'HOURS', icon: Clock },
  { label: '3 sa', amount: 3, unit: 'HOURS', icon: Clock },
  { label: '1 gün', amount: 1, unit: 'DAYS', icon: Calendar },
  { label: '3 gün', amount: 3, unit: 'DAYS', icon: Calendar },
  { label: '1 hafta', amount: 7, unit: 'DAYS', icon: Calendar },
];

const REMINDER_PRESETS: SnoozePreset[] = [
  { label: '5 dk', amount: 5, unit: 'MINUTES', icon: Clock },
  { label: '15 dk', amount: 15, unit: 'MINUTES', icon: Clock },
  { label: '30 dk', amount: 30, unit: 'MINUTES', icon: Clock },
  { label: '1 sa', amount: 1, unit: 'HOURS', icon: Clock },
];

const UNIT_LABELS: Record<SnoozeUnit, string> = {
  MINUTES: 'Dakika',
  HOURS: 'Saat',
  DAYS: 'Gün',
};

export function useTaskSnooze() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TaskSnoozeParams) => {
      const csrf = await fetchCsrf();
      queryClient.setQueryData(csrfQueryKey, csrf);

      const idempotencyKey = `task-snooze-${params.taskId}-${params.version}-${Date.now()}`;

      const result = await apiClient.post({
        url: '/api/v1/tasks/{taskId}/snooze-actions',
        path: { taskId: params.taskId },
        body: {
          target: params.target,
          amount: params.amount,
          unit: params.unit,
        },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf.token,
          'If-Match': String(params.version),
          'Idempotency-Key': idempotencyKey,
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'calendar'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'global'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'kanban'] });
      toast.success('Görev ertelenmiştir');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erteleme başarısız');
    },
  });
}

export function useReminderSnooze() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      reminderId,
      version,
      amount,
      unit,
    }: {
      taskId: string;
      reminderId: string;
      version: number;
      amount: number;
      unit: SnoozeUnit;
    }) => {
      const csrf = await fetchCsrf();
      queryClient.setQueryData(csrfQueryKey, csrf);

      const idempotencyKey = `reminder-snooze-${reminderId}-${version}-${Date.now()}`;

      const result = await apiClient.post({
        url: '/api/v1/tasks/{taskId}/reminders/{reminderId}/snooze-actions',
        path: { taskId, reminderId },
        body: { amount, unit },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf.token,
          'If-Match': String(version),
          'Idempotency-Key': idempotencyKey,
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'upcoming'] });
      toast.success('Hatırlatma ertelenmiştir');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erteleme başarısız');
    },
  });
}

interface TaskSnoozeMenuProps {
  taskId: string;
  version: number;
  hasPlannedAt: boolean;
  hasDueAt: boolean;
  className?: string;
}

function renderTargetIcon(target: SnoozeTarget) {
  switch (target) {
    case 'PLANNED':
      return <Calendar className="size-3.5" />;
    case 'DUE':
      return <Clock className="size-3.5" />;
    case 'BOTH':
      return <Bell className="size-3.5" />;
  }
}

function TargetSelector({
  value,
  onChange,
  disabled,
}: {
  value: SnoozeTarget;
  onChange: (v: SnoozeTarget) => void;
  disabled?: boolean;
}) {
  const options = (['PLANNED', 'DUE', 'BOTH'] as SnoozeTarget[]).filter((t) => {
    if (t === 'PLANNED') return true;
    if (t === 'DUE') return true;
    if (t === 'BOTH') return true;
    return false;
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between gap-2 data-[disabled]:opacity-50"
          disabled={disabled}
        >
          <span className="flex items-center gap-2">
            {renderTargetIcon(value)}
            <span className="text-sm font-medium">{TARGET_LABELS[value]}</span>
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 p-1">
        <DropdownMenuGroup>
          {options.map((t) => (
            <DropdownMenuItem
              key={t}
              onSelect={() => onChange(t)}
              disabled={disabled ?? false}
              className={cn(
                'flex items-center gap-2 py-1.5 px-2',
                value === t && 'bg-accent text-accent-foreground',
              )}
            >
              {renderTargetIcon(t)}
              <span className="text-sm">{TARGET_LABELS[t]}</span>
              {value === t && <Check className="size-3.5 ml-auto text-current" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UnitSelector({
  value,
  onChange,
  disabled,
}: {
  value: SnoozeUnit;
  onChange: (v: SnoozeUnit) => void;
  disabled?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between gap-2 data-[disabled]:opacity-50"
          disabled={disabled}
        >
          <span className="text-sm font-medium">{UNIT_LABELS[value]}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 p-1">
        <DropdownMenuGroup>
          {(['MINUTES', 'HOURS', 'DAYS'] as SnoozeUnit[]).map((u) => (
            <DropdownMenuItem
              key={u}
              onSelect={() => onChange(u)}
              disabled={disabled ?? false}
              className={cn(
                'flex items-center gap-2 py-1.5 px-2',
                value === u && 'bg-accent text-accent-foreground',
              )}
            >
              <span className="text-sm">{UNIT_LABELS[u]}</span>
              {value === u && <Check className="size-3.5 ml-auto text-current" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function renderPresetIcon(preset: SnoozePreset) {
  if (preset.icon) {
    return <preset.icon className="size-3.5" aria-hidden="true" />;
  }
  return <Clock className="size-3.5" aria-hidden="true" />;
}

function PresetButton({
  preset,
  isSelected,
  onClick,
  disabled,
}: {
  preset: SnoozePreset;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={isSelected ? 'default' : 'outline'}
      size="sm"
      className={cn(
        'h-9 min-w-0 flex-1 gap-1.5 transition-all duration-150',
        isSelected && 'shadow-glow',
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {renderPresetIcon(preset)}
      <span className="text-sm font-medium truncate">{preset.label}</span>
    </Button>
  );
}

function CustomAmountInput({
  amount,
  setAmount,
  unit,
  setUnit,
  disabled,
  inputId = 'snooze-amount',
}: {
  amount: number;
  setAmount: (v: number) => void;
  unit: SnoozeUnit;
  setUnit: (v: SnoozeUnit) => void;
  disabled?: boolean;
  inputId?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={inputId} className="w-20 text-sm font-medium text-muted-foreground">
        Miktar
      </label>
      <div className="flex-1 flex items-center gap-1">
        <input
          id={inputId}
          type="number"
          min="1"
          max="365"
          value={amount}
          onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
          className="flex-1 h-9 w-20 rounded-lg border bg-background px-3 py-1.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          disabled={disabled}
          inputMode="numeric"
        />
        <UnitSelector value={unit} onChange={setUnit} disabled={disabled ?? false} />
      </div>
    </div>
  );
}

function SnoozeContent({
  presets,
  target,
  setTarget,
  amount,
  setAmount,
  unit,
  setUnit,
  isPending,
  onSnooze,
  onClose,
  showTargetSelector = true,
  hasPlannedAt,
  hasDueAt,
}: {
  presets: SnoozePreset[];
  target: SnoozeTarget;
  setTarget: (v: SnoozeTarget) => void;
  amount: number;
  setAmount: (v: number) => void;
  unit: SnoozeUnit;
  setUnit: (v: SnoozeUnit) => void;
  isPending: boolean;
  onSnooze: () => void;
  onClose: () => void;
  showTargetSelector?: boolean;
  hasPlannedAt: boolean;
  hasDueAt: boolean;
}) {
  const filteredPresets = presets.filter((p) => {
    if (!hasPlannedAt && p.unit === 'DAYS' && target === 'PLANNED') return false;
    if (!hasDueAt && p.unit === 'DAYS' && target === 'DUE') return false;
    return true;
  });

  const handleSnooze = () => {
    if (amount < 1) return;
    onSnooze();
    onClose();
  };

  const canSnooze = hasPlannedAt || hasDueAt;

  if (!canSnooze) {
    return null;
  }

  return (
    <div className="space-y-4">
      {showTargetSelector && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">Erteleme Türü</span>
          <TargetSelector
            value={target}
            onChange={setTarget}
            disabled={isPending}
          />
        </div>
      )}

      <div className="space-y-2">
        <span className="text-sm font-medium text-muted-foreground">Hızlı Seçim</span>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Hızlı erteleme seçenekleri">
          {filteredPresets.map((preset) => (
            <PresetButton
              key={preset.label}
              preset={preset}
              isSelected={amount === preset.amount && unit === preset.unit}
              onClick={() => {
                setAmount(preset.amount);
                setUnit(preset.unit);
              }}
              disabled={isPending}
            />
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-border/50">
        <CustomAmountInput
          amount={amount}
          setAmount={setAmount}
          unit={unit}
          setUnit={setUnit}
          disabled={isPending}
          inputId="snooze-amount-dropdown"
        />
      </div>

      <DialogFooter className="border-0 p-0 mt-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onClose}
          disabled={isPending}
        >
          İptal
        </Button>
        <Button className="flex-1" onClick={handleSnooze} disabled={isPending || amount < 1}>
          {isPending ? 'Erteleniyor...' : 'Ertele'}
        </Button>
      </DialogFooter>
    </div>
  );
}

export function TaskSnoozeMenu({
  taskId,
  version,
  hasPlannedAt,
  hasDueAt,
  className,
}: TaskSnoozeMenuProps) {
  const [target, setTarget] = useState<SnoozeTarget>(
    hasPlannedAt && hasDueAt ? 'BOTH' : hasPlannedAt ? 'PLANNED' : 'DUE',
  );
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState<SnoozeUnit>('DAYS');
  const [open, setOpen] = useState(false);

  const snoozeMutation = useTaskSnooze();
  const isPending = snoozeMutation.isPending;

  const handleSnooze = () => {
    if (amount < 1) return;
    snoozeMutation.mutate({ taskId, version, target, amount, unit });
    setOpen(false);
  };

  const canSnooze = hasPlannedAt || hasDueAt;

  if (!canSnooze) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-1.5 h-7 px-2 text-xs', className)}
          aria-label="Görevi ertele"
        >
          <Clock className="size-3.5" />
          <span>Ertele</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:duration-150"
      >
        <Card className="w-full border-border/70 shadow-surface-hover">
          <CardContent className="p-4">
            <SnoozeContent
              presets={PRESETS}
              target={target}
              setTarget={setTarget}
              amount={amount}
              setAmount={setAmount}
              unit={unit}
              setUnit={setUnit}
              isPending={isPending}
              onSnooze={handleSnooze}
              onClose={() => setOpen(false)}
              showTargetSelector={true}
              hasPlannedAt={hasPlannedAt}
              hasDueAt={hasDueAt}
            />
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface SnoozeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  version: number;
  hasPlannedAt: boolean;
  hasDueAt: boolean;
}

export function SnoozeDialog({
  open,
  onOpenChange,
  taskId,
  version,
  hasPlannedAt,
  hasDueAt,
}: SnoozeDialogProps) {
  const [target, setTarget] = useState<SnoozeTarget>(
    hasPlannedAt && hasDueAt ? 'BOTH' : hasPlannedAt ? 'PLANNED' : 'DUE',
  );
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState<SnoozeUnit>('DAYS');

  const snoozeMutation = useTaskSnooze();
  const isPending = snoozeMutation.isPending;

  const handleSnooze = () => {
    if (amount < 1) return;
    snoozeMutation.mutate({ taskId, version, target, amount, unit });
    onOpenChange(false);
  };

  const canSnooze = hasPlannedAt || hasDueAt;

  if (!canSnooze) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-semibold">Görevi Ertele</DialogTitle>
        </DialogHeader>
        <SnoozeContent
          presets={PRESETS}
          target={target}
          setTarget={setTarget}
          amount={amount}
          setAmount={setAmount}
          unit={unit}
          setUnit={setUnit}
          isPending={isPending}
          onSnooze={handleSnooze}
          onClose={() => onOpenChange(false)}
          showTargetSelector={true}
          hasPlannedAt={hasPlannedAt}
          hasDueAt={hasDueAt}
        />
      </DialogContent>
    </Dialog>
  );
}

interface ReminderSnoozeButtonProps {
  taskId: string;
  reminderId: string;
  version: number;
  className?: string;
}

export function ReminderSnoozeButton({
  taskId,
  reminderId,
  version,
  className,
}: ReminderSnoozeButtonProps) {
  const [amount, setAmount] = useState(15);
  const [unit, setUnit] = useState<SnoozeUnit>('MINUTES');
  const [open, setOpen] = useState(false);

  const snoozeMutation = useReminderSnooze();
  const isPending = snoozeMutation.isPending;

  const handleSnooze = () => {
    if (amount < 1) return;
    snoozeMutation.mutate({ taskId, reminderId, version, amount, unit });
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-1.5 h-7 px-2 text-xs', className)}
          aria-label="Hatırlatmayı ertele"
        >
          <Clock className="size-3.5" />
          <span>Ertele</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-72 p-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:duration-150"
      >
        <Card className="w-full border-border/70 shadow-surface-hover">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Erteleme Süresi</span>
                <div className="grid grid-cols-4 gap-2" role="group" aria-label="Hızlı erteleme seçenekleri">
                  {REMINDER_PRESETS.map((preset) => (
                    <PresetButton
                      key={preset.label}
                      preset={preset}
                      isSelected={amount === preset.amount && unit === preset.unit}
                      onClick={() => {
                        setAmount(preset.amount);
                        setUnit(preset.unit);
                      }}
                      disabled={isPending}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-border/50">
                <CustomAmountInput
                  amount={amount}
                  setAmount={setAmount}
                  unit={unit}
                  setUnit={setUnit}
                  disabled={isPending}
                  inputId="snooze-amount-reminder"
                />
              </div>

              <DialogFooter className="border-0 p-0 mt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  İptal
                </Button>
                <Button className="flex-1" onClick={handleSnooze} disabled={isPending || amount < 1}>
                  {isPending ? 'Erteleniyor...' : 'Ertele'}
                </Button>
              </DialogFooter>
            </div>
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}