'use client';

import { useEffect, useRef, useState, type FocusEvent } from 'react';
import { PencilIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import { renderMarkdown } from './markdown-render';

const AUTOSAVE_DELAY = 600;
const LABEL = 'Açıklama';

type TaskDescriptionProps = {
  readonly value: string;
  readonly onCommit: (next: string) => void;
  readonly placeholder?: string;
};

type EditorTab = 'edit' | 'preview';

const EDITOR_CONTROL_CLASS =
  'w-full resize-y rounded-lg border border-input bg-background/40 px-2.5 py-1 text-current shadow-inner-edge outline-none transition-[color,box-shadow,border-color] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/20';

export function TaskDescription({
  value,
  onCommit,
  placeholder = 'Açıklama ekle…',
}: TaskDescriptionProps) {
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<EditorTab>('edit');
  const [draft, setDraft] = useState(value);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const debounceRef = useRef<number | null>(null);
  const committedRef = useRef(value);
  const onCommitRef = useRef(onCommit);

  useEffect(() => {
    committedRef.current = value;
    onCommitRef.current = onCommit;
  });

  useEffect(() => {
    if (editing && tab === 'edit') {
      textareaRef.current?.focus();
    }
  }, [editing, tab]);

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const clearDebounce = () => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  };

  const openEditor = () => {
    setDraft(value);
    setTab('edit');
    setEditing(true);
  };

  const handleChange = (next: string) => {
    setDraft(next);
    clearDebounce();
    const trimmed = next.trim();
    if (trimmed === committedRef.current) {
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      onCommitRef.current(trimmed);
    }, AUTOSAVE_DELAY);
  };

  const commitNow = () => {
    clearDebounce();
    const next = draft.trim();
    if (next !== committedRef.current) {
      onCommitRef.current(next);
    }
    setEditing(false);
  };

  const cancelEdit = () => {
    clearDebounce();
    setDraft(committedRef.current);
    setEditing(false);
    requestAnimationFrame(() => containerRef.current?.focus());
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!editing) {
      return;
    }
    const next = event.relatedTarget;
    if (next !== null && next instanceof Node && event.currentTarget.contains(next)) {
      return;
    }
    commitNow();
  };

  const empty = value.trim().length === 0;

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      onBlur={handleBlur}
      className="group/description rounded-lg focus:outline-none"
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="text-sm font-medium text-muted-foreground">{LABEL}</div>
        {editing ? (
          <div
            role="group"
            aria-label={`${LABEL} görünümü`}
            className="inline-flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5"
          >
            <button
              type="button"
              aria-pressed={tab === 'edit'}
              onClick={() => setTab('edit')}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                tab === 'edit' && 'bg-background text-foreground shadow-surface',
              )}
            >
              Kaynak
            </button>
            <button
              type="button"
              aria-pressed={tab === 'preview'}
              onClick={() => setTab('preview')}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                tab === 'preview' && 'bg-background text-foreground shadow-surface',
              )}
            >
              Önizleme
            </button>
          </div>
        ) : (
          !empty && (
            <button
              type="button"
              onClick={openEditor}
              aria-label="Açıklamayı düzenle"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground opacity-0 transition-opacity duration-150 group-hover/description:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <PencilIcon className="size-3.5" aria-hidden="true" />
              Düzenle
            </button>
          )
        )}
      </div>

      {!editing && empty && (
        <button
          type="button"
          onClick={openEditor}
          className="w-full cursor-text rounded-lg px-2.5 py-1 text-left text-sm text-muted-foreground/80 transition-colors duration-150 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {placeholder}
        </button>
      )}

      {!editing && !empty && (
        <div className="rounded-lg px-2.5 py-1 text-sm transition-colors duration-150 hover:bg-accent/40">
          <div data-testid="task-description-render" className="space-y-2">
            {renderMarkdown(value)}
          </div>
        </div>
      )}

      {editing && tab === 'edit' && (
        <textarea
          ref={textareaRef}
          rows={6}
          value={draft}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              cancelEdit();
            }
          }}
          placeholder={placeholder}
          aria-label={LABEL}
          className={EDITOR_CONTROL_CLASS}
        />
      )}

      {editing && tab === 'preview' && (
        <div className="min-h-[120px] rounded-lg border border-border/70 bg-background/40 px-3 py-2 text-sm">
          {draft.trim().length === 0 ? (
            <span className="text-muted-foreground/80">{placeholder}</span>
          ) : (
            <div className="space-y-2">{renderMarkdown(draft)}</div>
          )}
        </div>
      )}
    </div>
  );
}
