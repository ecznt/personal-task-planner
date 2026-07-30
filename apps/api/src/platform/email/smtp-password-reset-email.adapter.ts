import { Injectable } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';

import type {
  PasswordResetEmailDelivery,
  PasswordResetEmailMessage,
} from '../../modules/accounts/application/password-reset-email-delivery.port';
import { parseEmailEnvironment } from '../config/environment';

@Injectable()
export class SmtpPasswordResetEmailAdapter implements PasswordResetEmailDelivery {
  private readonly environment = parseEmailEnvironment();
  private readonly transporter: Transporter = nodemailer.createTransport({
    ...(this.environment.SMTP_USERNAME === undefined || this.environment.SMTP_PASSWORD === undefined
      ? {}
      : {
          auth: {
            pass: this.environment.SMTP_PASSWORD,
            user: this.environment.SMTP_USERNAME,
          },
        }),
    host: this.environment.SMTP_HOST,
    port: this.environment.SMTP_PORT,
    secure: this.environment.SMTP_SECURE,
  });

  async send(message: PasswordResetEmailMessage): Promise<void> {
    const resetUrl = new URL(message.resetPageUrl, this.environment.PUBLIC_ORIGIN);
    resetUrl.hash = `token=${encodeURIComponent(message.token)}`;

    await this.transporter.sendMail({
      from: this.environment.SMTP_FROM,
      to: message.recipient,
      subject: 'Parolanızı sıfırlayın',
      text: [
        'Kişisel İş Planlayıcı parolanızı sıfırlamak için aşağıdaki bağlantıyı açın:',
        '',
        resetUrl.toString(),
        '',
        'Bu bağlantı 30 dakika geçerlidir. Bu isteği siz başlatmadıysanız bu mesajı yok sayın.',
      ].join('\n'),
      html: [
        '<h1>Parolanızı sıfırlayın</h1>',
        '<p>Kişisel İş Planlayıcı parolanızı sıfırlamak için aşağıdaki bağlantıyı açın:</p>',
        `<p><a href="${resetUrl.toString()}">Parola sıfırlama sayfasını aç</a></p>`,
        '<p>Bu bağlantı 30 dakika geçerlidir. Bu isteği siz başlatmadıysanız bu mesajı yok sayın.</p>',
      ].join(''),
    });
  }
}
