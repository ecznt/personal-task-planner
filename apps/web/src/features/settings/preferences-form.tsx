'use client';

import { useMemo, useState } from 'react';
import { apiClient, getCurrentUser, updateCurrentUser } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';
import { usePushChannel } from '@/features/push/use-push-channel';
import { ACCENT_COLORS, useTheme } from '@/components/theme/theme-provider';
import { cn } from '@/lib/utils';

import {
  detectedBrowserTimeZone,
  formatTimeZonePreview,
  timeZoneLabel,
  timeZoneOptions,
} from './time-zones';

type CurrentUserForPreferences = {
  readonly email: string;
  readonly etag: string;
  readonly inAppReminderNotificationsEnabled: boolean;
  readonly pushReminderNotificationsEnabled: boolean;
  readonly timeZone: string;
};

export function PreferencesForm() {
  const queryClient = useQueryClient();
  const [provisionalTimeZone, setProvisionalTimeZone] = useState<string | null>(null);
  const [notificationEnabled, setNotificationEnabled] = useState<boolean | null>(null);
  const [pushEnabled, setPushEnabled] = useState<boolean | null>(null);
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const currentUser = useQuery({
    queryKey: ['users', 'me', 'preferences'],
    queryFn: readCurrentUserForPreferences,
  });
  const csrfQuery = useQuery({
    queryKey: csrfQueryKey,
    queryFn: fetchCsrf,
    staleTime: 20 * 60 * 1_000,
  });
  const pushChannel = usePushChannel(
    pushEnabled ?? currentUser.data?.pushReminderNotificationsEnabled ?? false,
  );
  const options = useMemo(
    () =>
      timeZoneOptions(
        [currentUser.data?.timeZone, detectedBrowserTimeZone()].filter(
          (value): value is string => Boolean(value),
        ),
      ),
    [currentUser.data?.timeZone],
  );
  const pendingTimeZone = provisionalTimeZone ?? currentUser.data?.timeZone ?? '';
  const hasTimeZoneChange =
    provisionalTimeZone !== null &&
    provisionalTimeZone !== currentUser.data?.timeZone;
  const notificationsChecked =
    notificationEnabled ?? currentUser.data?.inAppReminderNotificationsEnabled ?? true;
  const pushChecked = pushEnabled ?? currentUser.data?.pushReminderNotificationsEnabled ?? true;

  const save = useMutation({
    mutationFn: async (body: {
      readonly inAppReminderNotificationsEnabled?: boolean;
      readonly pushReminderNotificationsEnabled?: boolean;
      readonly timeZone?: string;
    }) => {
      if (currentUser.data === undefined) {
        throw new Error('Hesap tercihleri alınamadı.');
      }

      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);

      const result = await updateCurrentUser({
        body,
        client: apiClient,
        headers: {
          'If-Match': currentUser.data.etag,
          'X-CSRF-Token': csrf.token,
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      const etag = result.response?.headers.get('etag');
      const profile = result.data?.data;

      if (etag === null || etag === undefined || profile === undefined) {
        throw new Error('Tercihler kaydedilemedi.');
      }

      return { etag, profile };
    },
    onSuccess: ({ etag, profile }) => {
      queryClient.setQueryData(
        ['users', 'me', 'preferences'],
        {
          email: profile.email,
          etag,
          inAppReminderNotificationsEnabled: profile.inAppReminderNotificationsEnabled,
          pushReminderNotificationsEnabled: profile.pushReminderNotificationsEnabled,
          timeZone: profile.timeZone,
        } satisfies CurrentUserForPreferences,
      );
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'onboarding'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'summary'] });
      setNotificationEnabled(profile.inAppReminderNotificationsEnabled);
      setPushEnabled(profile.pushReminderNotificationsEnabled);
      setPushMessage(null);
      setProvisionalTimeZone(null);
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'preferences'] });
    },
  });

  if (currentUser.isPending) {
    return (
      <p className="flex items-center gap-2" role="status">
        <Spinner /> Tercihler yükleniyor…
      </p>
    );
  }

  if (currentUser.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Tercihler alınamadı</AlertTitle>
        <AlertDescription>Sayfayı yenileyin veya yeniden oturum açın.</AlertDescription>
      </Alert>
    );
  }

  const previousTimeZone = currentUser.data.timeZone;
  const pendingLabel = timeZoneLabel(pendingTimeZone, options);

  function saveTimeZone() {
    if (!hasTimeZoneChange) {
      setProvisionalTimeZone(null);
      return;
    }

    if (
      !window.confirm(
        `Saat dilimi ${pendingLabel} olarak güncellenecek. Saat içeren görevler ve hatırlatıcılar farklı saatlerde görünebilir. Devam etmek istiyor musunuz?`,
      )
    ) {
      setProvisionalTimeZone(null);
      return;
    }

    save.mutate({ timeZone: pendingTimeZone });
  }

  function saveNotifications(next: boolean) {
    if (!next) {
      const confirmed = window.confirm(
        `Bildirimler kapatılacak. Yaklaşan tarihli görevler için hatırlatıcı tanımlarınız ve mevcut bildirimleriniz korunur; ancak kapalı dönemde zamanı gelen hatırlatıcılar için bildirim üretilmez. Yeniden açtığınızda yalnızca gelecek zamanlar için geçerli olur; atlanan bildirimler geri getirilmez. Devam etmek istiyor musunuz?`,
      );

      if (!confirmed) {
        return;
      }
    }

    setNotificationEnabled(next);
    save.mutate({ inAppReminderNotificationsEnabled: next });
  }

  function savePushNotifications(next: boolean) {
    if (save.isPending) {
      return;
    }

    if (!next) {
      const confirmed = window.confirm(
        'İnternet tarayıcısı bildirimleri kapatılacak. Bu cihazdaki aboneliğiniz kaldırılır; hatırlatıcı tanımlarınız ve uygulama içi bildirimleriniz korunur. Devam etmek istiyor musunuz?',
      );

      if (!confirmed) {
        return;
      }

      setPushEnabled(false);
      void pushChannel.disable().finally(() => {
        save.mutate({ pushReminderNotificationsEnabled: false });
      });
      return;
    }

    setPushMessage(null);
    setPushEnabled(true);

    void pushChannel.enable().then(async (outcome) => {
      switch (outcome) {
        case 'granted':
          save.mutate({ pushReminderNotificationsEnabled: true });
          break;
        case 'denied':
          setPushMessage(
            'Tarayıcı bildirim izni verilmedi. Ayarlarınızdan bildirimlere izin verip tekrar deneyin.',
          );
          setPushEnabled(false);
          break;
        case 'unsupported':
          setPushMessage('Bu tarayıcı web bildirimlerini desteklemiyor.');
          setPushEnabled(false);
          break;
        case 'not-configured':
          setPushMessage('Bildirim hizmeti henüz yapılandırılmadı.');
          setPushEnabled(false);
          break;
      }
    });
  }

  return (
    <div className="space-y-6">
      {save.isError && (
        <Alert variant="destructive">
          <AlertTitle>Tercihler kaydedilemedi</AlertTitle>
          <AlertDescription>
            {save.error?.message ?? 'Değişiklikler uygulanamadı. Lütfen tekrar deneyin.'}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle role="heading" aria-level={2}>
            Vurgu rengi
          </CardTitle>
          <CardDescription>
            Uygulamanın odak ve vurgu rengini seçin. Seçiminiz bu cihazda saklanır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccentColorPicker />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle role="heading" aria-level={2}>
            Saat dilimi
          </CardTitle>
          <CardDescription>
            Tarih ve saat gösterimleri seçtiğiniz dilimi kullanır. Varsayılan tarayıcı dilimi{' '}
            <span className="font-medium text-foreground">{previousTimeZone}</span> olarak
            kayıtlıdır.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="settings-time-zone">Saat dilimi</FieldLabel>
              <Select
                id="settings-time-zone"
                value={pendingTimeZone}
                onChange={(e) => setProvisionalTimeZone(e.target.value)}
              >
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <FieldDescription id="settings-time-zone-preview">
                Seçilen dilimde şu an: {formatTimeZonePreview(pendingTimeZone)}
              </FieldDescription>
            </Field>
          </FieldGroup>
          {hasTimeZoneChange && (
            <Button
              type="button"
              onClick={saveTimeZone}
              disabled={save.isPending}
              className="w-fit transition-transform duration-150 active:scale-[0.98]"
            >
              {save.isPending && provisionalTimeZone !== null ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle role="heading" aria-level={2}>
            Bildirimler
          </CardTitle>
          <CardDescription>
            Yaklaşan tarihli görevler için uygulama içi ve internet tarayıcısı hatırlatıcı
            bildirimlerini yönetin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="flex items-start gap-3">
              <Checkbox
                id="settings-notifications"
                checked={notificationsChecked}
                disabled={save.isPending}
                onCheckedChange={(checked) => saveNotifications(checked === true)}
              />
              <div className="min-w-0">
                <label htmlFor="settings-notifications" className="font-medium text-sm">
                  Uygulama içi bildirimler
                </label>
                <p className="mt-1 text-sm text-muted-foreground">
                  {notificationsChecked
                    ? 'Açık — zamanı gelen hatırlatıcılar için uygulama içi bildirim üretilir.'
                    : 'Kapalı — hatırlatıcı tanımları korunur, ancak kapalı dönemde zamanı gelenler için bildirim üretilmez.'}
                </p>
              </div>
            </div>
          </FieldGroup>
          <FieldGroup>
            <div className="flex items-start gap-3">
              <Checkbox
                id="settings-web-push"
                checked={pushChecked}
                disabled={save.isPending}
                onCheckedChange={(checked) => savePushNotifications(checked === true)}
              />
              <div className="min-w-0">
                <label htmlFor="settings-web-push" className="font-medium text-sm">
                  Tarayıcı bildirimleri
                </label>
                <p className="mt-1 text-sm text-muted-foreground">
                  {pushChecked
                    ? 'Açık — zamanı gelen hatırlatıcılar bu cihaza tarayıcı kapalıyken bile gönderilir.'
                    : 'Kapalı — bu cihazdaki abonelik kaldırıldı.'}
                </p>
              </div>
            </div>
          </FieldGroup>
          {pushMessage !== null && (
            <p className="mt-2 text-sm text-destructive" role="status">
              {pushMessage}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AccentColorPicker() {
  const { accentColor, setAccentColor } = useTheme();

  return (
    <FieldGroup>
      <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Vurgu rengi">
        {ACCENT_COLORS.map((color) => {
          const selected = color.id === accentColor.id;
          return (
            <button
              key={color.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={color.name}
              onClick={() => setAccentColor(color.id)}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border transition-transform duration-[var(--duration-fast)] active:scale-90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                selected ? 'border-foreground ring-2 ring-foreground/20' : 'border-border hover:scale-105',
              )}
              style={{
                backgroundColor: color.lightPrimary,
                ...(selected
                  ? {
                      boxShadow: `0 0 0 4px var(--card), 0 0 0 6px ${color.lightPrimary}40`,
                    }
                  : {}),
              }}
            >
              {selected ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  className="size-4 text-white"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                </svg>
              ) : null}
            </button>
          );
        })}
      </div>
      <FieldDescription>
        Seçili vurgu: <span className="font-medium text-foreground">{accentColor.name}</span>
      </FieldDescription>
    </FieldGroup>
  );
}

async function readCurrentUserForPreferences(): Promise<CurrentUserForPreferences> {
  const result = await getCurrentUser({ client: apiClient });
  const etag = result.response?.headers.get('etag');

  if (result.data?.data === undefined || etag === null || etag === undefined) {
    throw new Error('Hesap tercihleri alınamadı.');
  }

  return {
    email: result.data.data.email,
    etag,
    inAppReminderNotificationsEnabled: result.data.data.inAppReminderNotificationsEnabled,
    pushReminderNotificationsEnabled: result.data.data.pushReminderNotificationsEnabled,
    timeZone: result.data.data.timeZone,
  };
}