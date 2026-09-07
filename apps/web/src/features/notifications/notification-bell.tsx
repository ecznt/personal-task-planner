'use client';

import { apiClient } from '@planner/api-client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

type NotificationSummary = {
  readonly unreadCount: number;
};

export function NotificationBell() {
  const summary = useQuery({
    queryKey: ['notifications', 'summary'],
    queryFn: async () => {
      const result = await apiClient.get({
        url: '/api/v1/notifications/summary',
      });

      if (result.error !== undefined) {
        return { unreadCount: 0 };
      }

      return (result.data as { data: NotificationSummary }).data;
    },
    refetchInterval: 60_000,
  });

  const unreadCount = summary.data?.unreadCount ?? 0;

  return (
    <Link
      href="/app/notifications"
      aria-label={unreadCount > 0 ? `Bildirimler, ${unreadCount} okunmamış` : 'Bildirimler'}
      className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.97]"
    >
      <svg
        className="h-4 w-4 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
