'use client';

import {
  ArchiveIcon,
  CalendarCheck2Icon,
  CalendarDaysIcon,
  CalendarRangeIcon,
  CircleIcon,
  FolderTreeIcon,
  KanbanSquareIcon,
  LayoutGridIcon,
  LayoutTemplateIcon,
  ListTodoIcon,
  SettingsIcon,
  Trash2Icon,
} from 'lucide-react';

import type { NavItem } from './app-nav';

const ICONS: Record<NavItem['icon'], typeof CalendarDaysIcon> = {
  today: CalendarDaysIcon,
  upcoming: CalendarCheck2Icon,
  calendar: CalendarRangeIcon,
  tasks: ListTodoIcon,
  kanban: KanbanSquareIcon,
  areas: LayoutGridIcon,
  projects: FolderTreeIcon,
  templates: LayoutTemplateIcon,
  archive: ArchiveIcon,
  trash: Trash2Icon,
  settings: SettingsIcon,
};

export function NavIcon({ icon, className }: { icon: NavItem['icon']; className?: string }) {
  const Icon = ICONS[icon] ?? CircleIcon;
  return <Icon className={className} aria-hidden="true" />;
}
