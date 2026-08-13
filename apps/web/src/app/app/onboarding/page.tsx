import type { Metadata } from 'next';

import { SessionBoundary } from '@/features/auth/session-boundary';
import { OnboardingPreferenceForm } from '@/features/onboarding/onboarding-preference-form';
import { OnboardingWelcome } from '@/features/onboarding/onboarding-welcome';

export const metadata: Metadata = {
  description: 'Area, Project ve Task modelini anlatan kişisel onboarding başlangıcı.',
  title: 'İlk kurulum | Kişisel İş Planlayıcı',
};

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-5xl">
        <SessionBoundary returnTo="/app/onboarding">
          <div className="flex flex-col gap-6">
            <OnboardingWelcome />
            <OnboardingPreferenceForm />
          </div>
        </SessionBoundary>
      </div>
    </main>
  );
}
