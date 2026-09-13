'use client';

import { usePathname, useRouter } from 'next/navigation';
import { CornerDownLeftIcon, KeyboardIcon, SearchIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useKeyboardShortcut } from '@/features/shortcuts/use-keyboard-shortcut';
import { cn } from '@/lib/utils';

import { filterCommands, NAV_DESTINATION_COMMANDS, SHORTCUT_REFERENCES, type Command } from './commands';

function openQuickCreate() {
  window.dispatchEvent(new CustomEvent('planner:new-task'));
}

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useKeyboardShortcut(
    { key: 'k', mod: true },
    () => setOpen((value) => !value),
    { ignoreRepeats: true, skipWhenEditable: false },
  );

  useKeyboardShortcut(
    { key: '?', shift: true },
    () => {
      setOpen(true);
      setShowHelp(true);
    },
    { ignoreRepeats: true },
  );

  const commands: readonly Command[] = useMemo(() => {
    const base: Command[] = [
      {
        id: 'new-task',
        label: 'Yeni Görev',
        keywords: ['task', 'görev', 'ekle', 'oluştur'],
        hint: 'N',
        run: () => {
          openQuickCreate();
          setOpen(false);
        },
      },
      {
        id: 'search',
        label: 'Arama',
        keywords: ['search', 'ara', 'bul'],
        hint: '/',
        run: () => {
          if (pathname.startsWith('/app/search')) {
            document.querySelector<HTMLInputElement>('#app-search-input')?.focus();
          } else {
            router.push('/app/search');
          }
          setOpen(false);
        },
      },
      ...NAV_DESTINATION_COMMANDS.map(
        (destination): Command => ({
          id: `nav:${destination.key}`,
          label: destination.label,
          keywords: destination.keywords,
          run: () => {
            router.push(destination.href);
            setOpen(false);
          },
        }),
      ),
    ];
    base.sort((a, b) => a.label.localeCompare(b.label, 'tr-TR'));
    return base;
  }, [pathname, router]);

  const filtered = useMemo(() => filterCommands(query, commands), [commands, query]);
  const safeIndex = selectedIndex >= filtered.length ? Math.max(filtered.length - 1, 0) : selectedIndex;

  function close() {
    setOpen(false);
    setQuery('');
    setSelectedIndex(0);
    setShowHelp(false);
  }

  function runCommand(command: Command | undefined) {
    if (command !== undefined) {
      command.run();
    }
  }

  function onSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((current) => (filtered.length === 0 ? current : Math.min(current + 1, filtered.length - 1)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      runCommand(filtered[safeIndex]);
    } else if (event.key === 'Escape') {
      if (showHelp) {
        setShowHelp(false);
      } else {
        close();
      }
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (value) {
          setOpen(true);
        } else {
          close();
        }
      }}
    >
      <DialogContent className="gap-3 p-0" aria-describedby="command-palette-description">
        <DialogHeader className="sr-only">
          <DialogTitle>Komut paleti</DialogTitle>
          <DialogDescription id="command-palette-description">
            Komutları arayın ve çalıştırın
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={onSearchKeyDown}
            placeholder="Komut ara…"
            autoComplete="off"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-list"
            aria-label="Komut arama"
            className="border-0 p-0 text-base shadow-none outline-none focus-visible:ring-0"
          />
        </div>

        {showHelp ? (
          <div className="px-4 pb-2">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <KeyboardIcon className="size-4" aria-hidden="true" />
              Klavye kısayolları
            </p>
            <ul className="space-y-1.5">
              {SHORTCUT_REFERENCES.map((reference) => (
                <li key={reference.label} className="flex items-center justify-between text-sm">
                  <span>{reference.label}</span>
                  <kbd className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs">
                    {reference.keys}
                  </kbd>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul
            id="command-palette-list"
            role="listbox"
            aria-label="Komutlar"
            className="max-h-64 overflow-y-auto px-2 pb-2"
          >
            {filtered.length === 0 ? (
              <li
                role="option"
                aria-selected="false"
                className="px-3 py-2 text-sm text-muted-foreground"
              >
                Sonuç bulunamadı
              </li>
            ) : (
              filtered.map((command, index) => {
                const isSelected = index === safeIndex;
                return (
                  <li
                    key={command.id}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => runCommand(command)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        runCommand(command);
                      }
                    }}
                    className={cn(
                      'flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm',
                      isSelected && 'bg-accent text-accent-foreground',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span>{command.label}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      {command.hint !== undefined && (
                        <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                          {command.hint}
                        </kbd>
                      )}
                      {isSelected && (
                        <CornerDownLeftIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      )}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        )}

        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <span>
            <kbd className="mr-1 font-mono">↑</kbd>
            <kbd className="mr-3 font-mono">↓</kbd>
            gezin · <kbd className="mx-1 font-mono">Enter</kbd> seç
          </span>
          <button
            type="button"
            onClick={() => setShowHelp((value) => !value)}
            className="flex items-center gap-1 rounded-md p-1 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <KeyboardIcon className="size-3.5" aria-hidden="true" />
            Kısayollar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}