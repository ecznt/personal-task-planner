'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckIcon } from 'lucide-react';
import { useState } from 'react';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AmbientBackground } from '@/components/ambient-background';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { SignOutButton } from '@/features/auth/sign-out-button';
import { NotificationBell } from '@/features/notifications/notification-bell';
import { QuickCreateDialog } from '@/features/tasks/quick-create-dialog';

import { MOBILE_MORE, MOBILE_PRIMARY, type NavItem } from './app-nav';
import { NavIcon } from './nav-icon';
import { useSearchShortcut } from './search-shortcut';

function isActive(pathname: string, href: string): boolean {
  if (href === '/app/areas') {
    return pathname.startsWith('/app/areas');
  }
  if (href === '/app/settings/account') {
    return pathname.startsWith('/app/settings');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const linkProps = onNavigate !== undefined ? { onClick: onNavigate } : {};
  return (
    <Link
      href={item.href}
      {...linkProps}
      aria-current={active ? 'page' : undefined}
      className={
        active
          ? 'relative flex items-center gap-3 rounded-lg bg-secondary/90 px-2.5 py-2 text-sm font-medium text-foreground shadow-inner-edge ring-1 ring-border'
          : 'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent/70 hover:text-foreground'
      }
    >
      <span
        className={
          active
            ? 'flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-glow'
            : 'flex size-6 shrink-0 items-center justify-center rounded-md'
        }
      >
        <NavIcon icon={item.icon} className="size-4 shrink-0" />
      </span>
      <span className="truncate">{item.label}</span>
      {active ? (
        <span
          className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary"
          aria-hidden="true"
        />
      ) : null}
    </Link>
  );
}

function SidebarNav() {
  return (
    <nav aria-label="Ana menü (masaüstü)" className="flex flex-col gap-0.5">
      {MOBILE_PRIMARY.map((item) => (
        <NavLink key={item.key} item={item} />
      ))}
      <div className="my-2 h-px bg-border" role="separator" />
      {MOBILE_MORE.map((item) => (
        <NavLink key={item.key} item={item} />
      ))}
    </nav>
  );
}

function MoreSheet() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Daha fazla menüyü aç"
          className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground"
        >
          <NavIcon icon="settings" className="size-5" />
          <span>Daha</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="px-0 py-4">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-sm">Menü</SheetTitle>
        </SheetHeader>
        <nav aria-label="Daha fazla menü" className="flex flex-col">
          {MOBILE_MORE.map((item) => (
            <NavLink key={item.key} item={item} onNavigate={() => setOpen(false)} />
          ))}
        </nav>
        <div className="flex justify-center px-4 pt-4">
          <SignOutButton />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Ana menü (mobil)"
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border/70 bg-nav-bg backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {MOBILE_PRIMARY.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className="relative flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium"
            style={active ? { color: 'var(--primary)' } : undefined}
          >
            {active ? (
              <span
                className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary"
                aria-hidden="true"
              />
            ) : null}
            <NavIcon icon={item.icon} className="size-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <MoreSheet />
    </nav>
  );
}

function SearchLink() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href="/app/search"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.97]"
          aria-label="Ara"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="size-4"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="m20 20-3.5-3.5" />
          </svg>
        </Link>
      </TooltipTrigger>
      <TooltipContent>Ara</TooltipContent>
    </Tooltip>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  useSearchShortcut();
  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="skip-link">
        İçeriğe geç
      </a>

      <AmbientBackground subtle />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border/80 bg-nav-bg backdrop-blur-xl md:flex">
        <div className="flex h-14 items-center border-b border-border/60 px-4">
          <Link
            href="/app/today"
            className="flex items-center gap-2.5"
            aria-label="Bugün sayfasına git"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#5E6AD2] to-[#3B46C4] text-primary-foreground shadow-glow">
              <CheckIcon className="size-3.5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-gradient">Kişisel İş Planlayıcı</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-2.5 py-4">
          <SidebarNav />
        </div>
        <div className="border-t border-border/60 p-2.5">
          <SignOutButton />
        </div>
      </aside>

      <div className="md:pl-60">
        <div className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b border-border/60 bg-header-bg px-4 backdrop-blur-xl md:px-6">
          <div className="text-sm font-semibold md:hidden">Kişisel İş Planlayıcı</div>
          <div className="flex items-center gap-2 md:ml-auto">
            <ThemeToggle />
            <QuickCreateDialog />
            <SearchLink />
            <Tooltip>
              <TooltipTrigger asChild>
                <NotificationBell />
              </TooltipTrigger>
              <TooltipContent>Bildirimler</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <main
          id="main-content"
          className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8"
        >
          {children}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
