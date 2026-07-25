import { Injectable } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';

import type {
  VerificationEmailDelivery,
  VerificationEmailMessage,
} from '../../modules/accounts/application/verification-email-delivery.port';
import { parseEmailEnvironment } from '../config/environment';

@Injectable()
export class SmtpVerificationEmailAdapter implements VerificationEmailDelivery {
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

  async send(message: VerificationEmailMessage): Promise<void> {
    const verificationPageUrl = new URL(
      message.verificationPageUrl,
      this.environment.PUBLIC_ORIGIN,
    ).toString();

    await this.transporter.sendMail({
      from: this.environment.SMTP_FROM,
      to: message.recipient,
      subject: 'E-posta adresinizi doğrulayın',
      text: [
        'Kişisel İş Planlayıcı hesabınızı doğrulamak için aşağıdaki kodu kullanın:',
        '',
        message.code,
        '',
        `Doğrulama sayfası: ${verificationPageUrl}`,
        '',
        'Bu kod 24 saat geçerlidir. Bu hesabı siz oluşturmadıysanız bu mesajı yok sayın.',
      ].join('\n'),
      html: [
        '<h1>E-posta adresinizi doğrulayın</h1>',
        '<p>Kişisel İş Planlayıcı hesabınızı doğrulamak için aşağıdaki kodu kullanın:</p>',
        `<p><strong>${message.code}</strong></p>`,
        `<p><a href="${verificationPageUrl}">Doğrulama sayfasını aç</a></p>`,
        '<p>Bu kod 24 saat geçerlidir. Bu hesabı siz oluşturmadıysanız bu mesajı yok sayın.</p>',
      ].join(''),
    });
  }
}
