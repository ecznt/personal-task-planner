'use client';

import {
  ArchiveIcon,
  CalendarDaysIcon,
  CircleIcon,
  FolderTreeIcon,
  KanbanSquareIcon,
  LayoutGridIcon,
  ListTodoIcon,
  SettingsIcon,
  Trash2Icon,
} from 'lucide-react';

import type { NavItem } from './app-nav';

const ICONS: Record<NavItem['icon'], typeof CalendarDaysIcon> = {
  today: CalendarDaysIcon,
  tasks: ListTodoIcon,
  kanban: KanbanSquareIcon,
  areas: LayoutGridIcon,
  projects: FolderTreeIcon,
  archive: ArchiveIcon,
  trash: Trash2Icon,
  settings: SettingsIcon,
};

export function NavIcon({ icon, className }: { icon: NavItem['icon']; className?: string }) {
  const Icon = ICONS[icon] ?? CircleIcon;
  return <Icon className={className} aria-hidden="true" />;
}
