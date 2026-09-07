'use client';

import { apiClient } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/list-skeleton';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bildirimler</h1>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
            className="transition-transform duration-150 active:scale-[0.97]"
          >
            {markAllAsRead.isPending ? 'İşleniyor...' : 'Tümünü Okundu İşaretle'}
          </Button>
        )}
      </div>

      {data.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <div className="text-muted-foreground">Henüz bildirim yok</div>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-lg border p-4 transition-colors duration-150 ${
                notification.readState === 'UNREAD' ? 'bg-card border-primary/20' : 'bg-muted/30'
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
