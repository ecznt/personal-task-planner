export const VERIFICATION_EMAIL_DELIVERY = Symbol('VERIFICATION_EMAIL_DELIVERY');
export const EMAIL_VERIFICATION_JOB_TYPE = 'EMAIL_VERIFICATION_DELIVERY';

export type VerificationEmailMessage = {
  readonly code: string;
  readonly recipient: string;
  readonly verificationPageUrl: string;
};

export interface VerificationEmailDelivery {
  send(message: VerificationEmailMessage): Promise<void>;
}
