'use client';

import { apiClient, getCurrentUser } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { ListSkeleton } from '@/components/list-skeleton';
import { PageHeader } from '@/components/page-header';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';

type NotificationItem = {
  readonly id: string;
  readonly title: string;
  readonly body: string | null;
  readonly readState: string;
  readonly version: number;
  readonly createdAt: string;
  readonly taskTitle: string | null;
  readonly taskDueAt: string | null;
};

type NotificationsPageData = {
  readonly data: readonly NotificationItem[];
  readonly page: {
    readonly nextCursor?: string;
    readonly hasMore: boolean;
  };
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NotificationsView() {
  const queryClient = useQueryClient();

  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const result = await apiClient.get({
        url: '/api/v1/notifications',
        query: { limit: '50' },
      });

      if (result.error !== undefined) {
        throw new Error('Bildirimler yüklenemedi.');
      }

      return result.data as NotificationsPageData;
    },
  });

  const preferences = useQuery({
    queryKey: ['users', 'me', 'notifications-center'],
    queryFn: async () => {
      const result = await getCurrentUser({ client: apiClient });
      return result.data?.data?.inAppReminderNotificationsEnabled ?? true;
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const csrf = (await fetchCsrf()).token;
      queryClient.setQueryData(csrfQueryKey, csrf);

      const result = await apiClient.patch({
        url: '/api/v1/notifications/{notificationId}',
        path: { notificationId },
        body: { readState: 'READ' },
        headers: {
          'X-CSRF-Token': csrf,
          'If-Match': '0',
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
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const csrf = (await fetchCsrf()).token;
      queryClient.setQueryData(csrfQueryKey, csrf);

      const unreadIds = (notifications.data?.data ?? [])
        .filter((n) => n.readState === 'UNREAD')
        .map((n) => n.id);

      if (unreadIds.length === 0) return;

      const result = await apiClient.post({
        url: '/api/v1/notifications/read-actions',
        body: { notificationIds: unreadIds },
        headers: {
          'X-CSRF-Token': csrf,
          'Idempotency-Key': `mark-all-read-${Date.now()}`,
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
    },
  });

  if (notifications.isLoading) {
    return <ListSkeleton rows={6} />;
  }

  if (notifications.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Hata</AlertTitle>
        <AlertDescription>
          {notifications.error?.message ?? 'Bildirimler yüklenemedi.'}
        </AlertDescription>
      </Alert>
    );
  }

  const data = notifications.data?.data ?? [];
  const unreadCount = data.filter((n) => n.readState === 'UNREAD').length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <PageHeader
            title="Bildirimler"
            eyebrow="Bildirimler"
            description={
              unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'
            }
          />
          <p className="sr-only" role="status" aria-live="polite">
            {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
            className="shrink-0 transition-transform duration-150 active:scale-[0.97]"
          >
            {markAllAsRead.isPending ? 'İşleniyor...' : 'Tümünü Okundu İşaretle'}
          </Button>
        )}
      </div>

      {data.length === 0 ? (
        preferences.data === false ? (
          <EmptyState
            icon={<Bell className="size-5" aria-hidden="true" />}
            title="Bildirimler kapalı"
            description="Yaklaşan tarihli görevler için uygulama içi bildirimler kapalı. Hatırlatıcı tanımlarınız korunur; yalnızca bildirim üretimi durduruldu. Tercihlerden yeniden açabilirsiniz."
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/app/settings/preferences">Bildirimleri Aç</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<Bell className="size-5" aria-hidden="true" />}
            title="Henüz bildirim yok"
            description="Bitiş ve plan yaklaşan görevlerle ilgili bildirimler burada görünür."
          />
        )
      ) : (
        <div className="space-y-2">
          {data.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-xl border p-4 transition-all duration-150 ${
                notification.readState === 'UNREAD'
                  ? 'card-surface border-primary/25 bg-card shadow-surface'
                  : 'border-border/70 bg-muted/20 backdrop-blur-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{notification.title}</div>
                  {notification.body && (
                    <div className="mt-1 text-sm text-muted-foreground">{notification.body}</div>
                  )}
                  {notification.taskTitle && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Görev: {notification.taskTitle}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(notification.createdAt)}
                  </span>
                  {notification.readState === 'UNREAD' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead.mutate(notification.id)}
                      disabled={markAsRead.isPending}
                      className="h-6 px-2 text-xs transition-transform duration-150 active:scale-[0.97]"
                    >
                      Okundu
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
