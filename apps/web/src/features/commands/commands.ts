import type { NavDestination } from '@/features/navigation/app-nav';
import { PRIMARY_NAV } from '@/features/navigation/app-nav';

export type Command = {
  readonly id: string;
  readonly label: string;
  readonly keywords: readonly string[];
  readonly hint?: string;
  readonly run: () => void;
};

export type NavDestinationCommand = {
  readonly key: NavDestination | 'notifications';
  readonly href: string;
  readonly label: string;
  readonly keywords: readonly string[];
};

export const NAV_DESTINATION_COMMANDS: readonly NavDestinationCommand[] = [
  ...PRIMARY_NAV.map((item) => ({
    key: item.key as NavDestination | 'notifications',
    href: item.href,
    label: item.label,
    keywords: [item.key],
  })),
  { key: 'notifications', href: '/app/notifications', label: 'Bildirimler', keywords: ['notifications', 'bell', 'zil'] },
];

export const SHORTCUT_REFERENCES = [
  { keys: '⌘K', label: 'Komut paleti', hint: 'Sunucu kısayolu' },
  { keys: 'N', label: 'Yeni görev' },
  { keys: '/', label: 'Arama' },
] as const;

export function filterCommands<C extends { readonly label: string; readonly keywords: readonly string[] }>(
  query: string,
  commands: readonly C[],
): readonly C[] {
  const normalized = query.trim().toLocaleLowerCase('tr-TR');
  if (normalized.length === 0) {
    return commands;
  }
  return commands.filter((command) => {
    const haystack = [command.label, ...command.keywords].join(' ').toLocaleLowerCase('tr-TR');
    return haystack.includes(normalized);
  });
}