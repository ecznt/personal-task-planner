'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircleIcon, CheckIcon, ChevronDownIcon, PencilIcon } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import type { TaskSaveStatus } from './task-patch';

const AUTOSAVE_DELAY = 600;

export function AutosaveStatus({ status }: { readonly status: TaskSaveStatus }) {
  if (status === 'idle') {
    return null;
  }

  if (status === 'error') {
    return (
      <span
        role="status"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive"
      >
        <AlertCircleIcon className="size-3.5 shrink-0" aria-hidden="true" />
        Kaydedilemedi
      </span>
    );
  }

  if (status === 'saving') {
    return (
      <span
        role="status"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
      >
        <span className="flex items-center gap-0.5" aria-hidden="true">
          <span className="size-1 animate-pulse rounded-full bg-current" />
          <span className="size-1 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
          <span className="size-1 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
        </span>
        Kaydediliyor
      </span>
    );
  }

  return (
    <span
      role="status"
      className="inline-flex animate-in items-center gap-1.5 text-xs font-medium text-emerald-600 motion-safe:fade-in motion-safe:zoom-in-95 dark:text-emerald-400"
    >
      <CheckIcon className="size-3.5 shrink-0" aria-hidden="true" />
      Kaydedildi
    </span>
  );
}

function editableControlClass(extras?: string): string {
  return cn(
    'w-full rounded-lg border border-input bg-background/40 px-2.5 py-1 text-current shadow-inner-edge outline-none transition-[color,box-shadow,border-color] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/20',
    extras,
  );
}

type InlineTextProps = {
  readonly value: string;
  readonly onCommit: (next: string) => void;
  readonly placeholder?: string;
  readonly className?: string;
  readonly multiline?: boolean;
  readonly required?: boolean;
  readonly rows?: number;
};

export function InlineText({
  value,
  onCommit,
  placeholder,
  className,
  multiline = false,
  required = true,
  rows = 4,
}: InlineTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const debounceTimerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const displayRef = useRef<HTMLButtonElement | null>(null);
  const onCommitRef = useRef(onCommit);
  const committedRef = useRef(value);

  useEffect(() => {
    onCommitRef.current = onCommit;
    committedRef.current = value;
  });

  useEffect(() => {
    if (!editing) {
      return;
    }

    const input = inputRef.current;
    if (input !== null) {
      input.focus();
      if (input instanceof HTMLInputElement) {
        input.select();
      }
    }
  }, [editing]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const clearDebounce = () => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  };

  const openEditor = () => {
    setDraft(value);
    setEditing(true);
  };

  const handleChange = (next: string) => {
    setDraft(next);
    clearDebounce();
    const trimmed = next.trim();
    if (trimmed === committedRef.current) {
      return;
    }
    debounceTimerRef.current = window.setTimeout(() => {
      onCommitRef.current(trimmed);
    }, AUTOSAVE_DELAY);
  };

  const commitNow = () => {
    clearDebounce();
    const next = draft.trim();
    if (next !== committedRef.current && (next.length > 0 || !required)) {
      onCommitRef.current(next);
    }
    setEditing(false);
  };

  const cancelEdit = () => {
    clearDebounce();
    setDraft(committedRef.current);
    setEditing(false);
    requestAnimationFrame(() => displayRef.current?.focus());
  };

  const empty = value.trim().length === 0;

  return (
    <div className={cn('group/editable relative', className)}>
      {editing ? (
        multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            rows={rows}
            value={draft}
            onChange={(event) => handleChange(event.target.value)}
            onBlur={commitNow}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                cancelEdit();
              }
            }}
            placeholder={placeholder}
            className={editableControlClass('resize-y')}
            aria-label={placeholder}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={draft}
            onChange={(event) => handleChange(event.target.value)}
            onBlur={commitNow}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                cancelEdit();
              }
              if (event.key === 'Enter') {
                event.preventDefault();
                inputRef.current?.blur();
              }
            }}
            placeholder={placeholder}
            className={editableControlClass('h-9')}
            aria-label={placeholder}
          />
        )
      ) : (
        <button
          ref={displayRef}
          type="button"
          onClick={openEditor}
          className={cn(
            'w-full cursor-text rounded-lg px-2.5 py-1 pr-8 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
            empty ? 'text-muted-foreground/80 hover:bg-accent/60' : 'hover:bg-accent/60',
          )}
        >
          <span className={cn(multiline && 'whitespace-pre-wrap')}>
            {empty ? (placeholder ?? 'Boş') : value}
          </span>
        </button>
      )}

      {!editing && !empty && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground opacity-0 transition-opacity duration-150 group-hover/editable:opacity-90"
        >
          <PencilIcon className="size-3.5" />
        </span>
      )}
    </div>
  );
}

export type InlineSelectOption = {
  readonly value: string;
  readonly label: string;
};

type InlineSelectProps = {
  readonly value: string | null;
  readonly options: readonly InlineSelectOption[];
  readonly onCommit: (value: string) => void;
  readonly placeholder?: string;
  readonly label?: string;
  readonly triggerClassName?: string;
  readonly onClear?: () => void;
  readonly disabled?: boolean;
};

export function InlineSelect({
  value,
  options,
  onCommit,
  placeholder,
  label,
  triggerClassName,
  onClear,
  disabled = false,
}: InlineSelectProps) {
  const selected = options.find((option) => option.value === value);

  return (
    <div className="space-y-1">
      {label !== undefined && (
        <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={label}
            disabled={disabled}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/70 bg-muted/60 px-2.5 text-sm font-medium transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97]',
              value === null && 'text-muted-foreground',
              disabled && 'pointer-events-none opacity-60',
              triggerClassName,
            )}
          >
            <span className="truncate">{selected?.label ?? placeholder ?? 'Seç'}</span>
            <ChevronDownIcon className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => onCommit(option.value)}
              className={cn(option.value === value && 'bg-accent text-accent-foreground')}
            >
              <span className="flex-1">{option.label}</span>
              {option.value === value && (
                <CheckIcon className="size-4 text-primary" aria-hidden="true" />
              )}
            </DropdownMenuItem>
          ))}
          {onClear !== undefined && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onClear}>
                Temizle
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function toLocalDatetime(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type InlineDateTimeProps = {
  readonly value: string | null;
  readonly onCommit: (iso: string | null) => void;
  readonly placeholder?: string;
  readonly label?: string;
};

export function InlineDateTime({ value, onCommit, placeholder, label }: InlineDateTimeProps) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const displayRef = useRef<HTMLButtonElement | null>(null);
  const onCommitRef = useRef(onCommit);

  useEffect(() => {
    onCommitRef.current = onCommit;
  });

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const openEditor = () => {
    setLocalValue(toLocalDatetime(value));
    setEditing(true);
  };

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === '') {
      onCommitRef.current(null);
    } else {
      const date = new Date(trimmed);
      if (!Number.isNaN(date.getTime())) {
        onCommitRef.current(date.toISOString());
      }
    }
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditing(false);
    requestAnimationFrame(() => displayRef.current?.focus());
  };

  const empty = value === null;

  return (
    <div className="space-y-1">
      {label !== undefined && (
        <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      )}
      {editing ? (
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="datetime-local"
            value={localValue}
            onChange={(event) => setLocalValue(event.target.value)}
            onBlur={(event) => commit(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                cancelEdit();
              }
              if (event.key === 'Enter') {
                event.preventDefault();
                commit(event.currentTarget.value);
              }
            }}
            className={editableControlClass('h-8')}
            aria-label={label ?? placeholder}
          />
        </div>
      ) : (
        <button
          ref={displayRef}
          type="button"
          onClick={openEditor}
          aria-label={label ?? placeholder}
          className={cn(
            'inline-flex h-8 max-w-full items-center gap-1.5 rounded-lg border border-border/70 bg-muted/60 px-2.5 text-sm font-medium transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97]',
            empty && 'text-muted-foreground',
          )}
        >
          <span className="truncate">
            {empty ? (placeholder ?? 'Tarih') : formatDateTime(value)}
          </span>
          {empty && (
            <PencilIcon className="size-3.5 shrink-0 opacity-0 transition-opacity duration-150 group-hover/editable:opacity-90" />
          )}
        </button>
      )}
    </div>
  );
}
type InlineNumberProps = {
  readonly value: number | null;
  readonly onCommit: (next: number | null) => void;
  readonly placeholder?: string;
  readonly label?: string;
};

export function InlineNumber({ value, onCommit, placeholder, label }: InlineNumberProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const displayRef = useRef<HTMLButtonElement | null>(null);
  const onCommitRef = useRef(onCommit);
  const committedRef = useRef(value);

  useEffect(() => {
    onCommitRef.current = onCommit;
    committedRef.current = value;
  });

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const openEditor = () => {
    setDraft(value === null ? '' : String(value));
    setEditing(true);
  };

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === '') {
      onCommitRef.current(null);
    } else {
      const num = Number(trimmed);
      if (!Number.isNaN(num) && num >= 1 && num <= 1440) {
        onCommitRef.current(num);
      }
    }
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditing(false);
    requestAnimationFrame(() => displayRef.current?.focus());
  };

  const empty = value === null;

  return (
    <div className="space-y-1">
      {label !== undefined && (
        <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      )}
      {editing ? (
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="number"
            min="1"
            max="1440"
            step="5"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={(event) => commit(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                cancelEdit();
              }
              if (event.key === 'Enter') {
                event.preventDefault();
                commit(event.currentTarget.value);
              }
            }}
            className="w-full h-8 rounded-lg border border-input bg-background/40 px-2.5 text-sm shadow-inner-edge outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label={label ?? placeholder}
          />
        </div>
      ) : (
        <button
          ref={displayRef}
          type="button"
          onClick={openEditor}
          aria-label={label ?? placeholder}
          className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-lg border border-border/70 bg-muted/60 px-2.5 text-sm font-medium transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97]"
        >
          <span className="truncate">{empty ? (placeholder ?? 'Süre') : `${value} dk`}</span>
          {empty && (
            <svg
              className="size-3.5 shrink-0 opacity-0 transition-opacity duration-150 group-hover/editable:opacity-90"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5a2.121 2.121 0 0 1 3 3z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
