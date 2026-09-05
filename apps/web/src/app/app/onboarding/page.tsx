import type { Metadata } from 'next';

import { OnboardingPreferenceForm } from '@/features/onboarding/onboarding-preference-form';
import { OnboardingWelcome } from '@/features/onboarding/onboarding-welcome';

export const metadata: Metadata = {
  description: 'Area, Project ve Task modelini anlatan kişisel onboarding başlangıcı.',
  title: 'İlk kurulum',
};

export default function OnboardingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex flex-col gap-6">
        <OnboardingWelcome />
        <OnboardingPreferenceForm />
      </div>
    </div>
  );
}
