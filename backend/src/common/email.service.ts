import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

@Injectable()
export class EmailService {
  async send(input: SendEmailInput) {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      return this.sendSmtp(input);
    }

    if (process.env.RESEND_API_KEY) {
      return this.sendResend(input);
    }

    throw new InternalServerErrorException('O serviço de e-mail ainda não foi configurado.');
  }

  private async sendSmtp(input: SendEmailInput) {
    const port = Number(process.env.SMTP_PORT || 465);
    const secure = String(process.env.SMTP_SECURE ?? 'true').toLowerCase() !== 'false';
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
  }

  private async sendResend(input: SendEmailInput) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const envio = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'SINPAPEL <noreply@seudominio.com>',
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    if (envio.error) {
      throw new Error(envio.error.message);
    }
  }
}
