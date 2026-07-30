export const RESET_PASSWORD_EMAIL_DELIVERY = Symbol('RESET_PASSWORD_EMAIL_DELIVERY');
export const PASSWORD_RESET_JOB_TYPE = 'PASSWORD_RESET_DELIVERY';

export type PasswordResetEmailMessage = {
  readonly recipient: string;
  readonly resetPageUrl: string;
  readonly token: string;
};

export interface PasswordResetEmailDelivery {
  send(message: PasswordResetEmailMessage): Promise<void>;
}
