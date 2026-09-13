export type NavDestination =
  | 'today'
  | 'upcoming'
  | 'tasks'
  | 'kanban'
  | 'areas'
  | 'projects'
  | 'archive'
  | 'trash'
  | 'settings';

export type NavItem = {
  readonly key: NavDestination;
  readonly href: string;
  readonly label: string;
  readonly icon:
    | 'today'
    | 'upcoming'
    | 'tasks'
    | 'kanban'
    | 'areas'
    | 'projects'
    | 'archive'
    | 'trash'
    | 'settings';
};

export const PRIMARY_NAV: readonly NavItem[] = [
  { key: 'today', href: '/app/today', label: 'Bugün', icon: 'today' },
  { key: 'upcoming', href: '/app/upcoming', label: 'Yaklaşan', icon: 'upcoming' },
  { key: 'tasks', href: '/app/tasks', label: 'Görevler', icon: 'tasks' },
  { key: 'kanban', href: '/app/kanban', label: 'Kanban', icon: 'kanban' },
  { key: 'areas', href: '/app/areas', label: 'Alanlar', icon: 'areas' },
  { key: 'projects', href: '/app/projects', label: 'Projeler', icon: 'projects' },
  { key: 'archive', href: '/app/archive', label: 'Arşiv', icon: 'archive' },
  { key: 'trash', href: '/app/trash', label: 'Çöp Kutusu', icon: 'trash' },
  { key: 'settings', href: '/app/settings/account', label: 'Ayarlar', icon: 'settings' },
];

export const MOBILE_PRIMARY: readonly NavItem[] = [
  { key: 'today', href: '/app/today', label: 'Bugün', icon: 'today' },
  { key: 'upcoming', href: '/app/upcoming', label: 'Yaklaşan', icon: 'upcoming' },
  { key: 'tasks', href: '/app/tasks', label: 'Görevler', icon: 'tasks' },
  { key: 'kanban', href: '/app/kanban', label: 'Kanban', icon: 'kanban' },
];

export const MOBILE_MORE: readonly NavItem[] = [
  { key: 'areas', href: '/app/areas', label: 'Alanlar', icon: 'areas' },
  { key: 'projects', href: '/app/projects', label: 'Projeler', icon: 'projects' },
  { key: 'archive', href: '/app/archive', label: 'Arşiv', icon: 'archive' },
  { key: 'trash', href: '/app/trash', label: 'Çöp Kutusu', icon: 'trash' },
  { key: 'settings', href: '/app/settings/account', label: 'Ayarlar', icon: 'settings' },
];
