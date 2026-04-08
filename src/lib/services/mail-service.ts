import nodemailer from "nodemailer";

type PasswordResetEmailInput = {
  to: string;
  name: string;
  resetUrl: string;
  expiresAt: Date;
};

type MailDeliveryResult = {
  mode: "smtp" | "log";
};

function readSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT?.trim() || "587");
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD?.trim();
  const secure = process.env.SMTP_SECURE?.trim() === "true";
  const from =
    process.env.MAIL_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    "nao-responda@mtcprop.com.br";

  if (!host || !user || !password || Number.isNaN(port)) {
    return null;
  }

  return {
    host,
    port,
    user,
    password,
    secure,
    from,
  };
}

function buildPasswordResetEmail(input: PasswordResetEmailInput) {
  const expiresLabel = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(input.expiresAt);

  const subject = "MTCprop | Redefinicao de senha";

  const text = [
    `Olá, ${input.name}.`,
    "",
    "Recebemos uma solicitacao para redefinir a senha do seu acesso administrativo da MTCprop.",
    `Use este link para criar uma nova senha: ${input.resetUrl}`,
    `Esse link expira em ${expiresLabel}.`,
    "",
    "Se voce nao solicitou essa alteracao, ignore este e-mail.",
  ].join("\n");

  const html = `
    <div style="background:#eef4ee;padding:32px 16px;font-family:Arial,sans-serif;color:#071108;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid rgba(7,17,8,0.08);border-radius:18px;padding:32px;box-shadow:0 24px 60px rgba(7,17,8,0.08);">
        <div style="display:inline-block;border-radius:10px;border:1px solid rgba(69,225,95,0.2);background:rgba(69,225,95,0.08);padding:10px 14px;font-size:11px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;color:#176124;">
          Ambiente interno da MTCprop
        </div>
        <h1 style="margin:22px 0 10px;font-size:28px;line-height:1.15;">Redefinicao de senha</h1>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#4b5c4d;">
          Ola, ${input.name}. Recebemos uma solicitacao para redefinir a senha do seu acesso administrativo.
        </p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#4b5c4d;">
          Clique no botao abaixo para criar uma nova senha. O link expira em <strong>${expiresLabel}</strong>.
        </p>
        <a href="${input.resetUrl}" style="display:inline-block;border-radius:12px;background:#071108;color:#ffffff;text-decoration:none;padding:14px 22px;font-weight:700;">
          Criar nova senha
        </a>
        <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#6c7b6e;">
          Se o botao nao abrir, copie este link no navegador:<br />
          <span style="word-break:break-all;">${input.resetUrl}</span>
        </p>
        <p style="margin:18px 0 0;font-size:13px;line-height:1.7;color:#6c7b6e;">
          Se voce nao solicitou essa alteracao, pode ignorar este e-mail com seguranca.
        </p>
      </div>
    </div>
  `;

  return { subject, text, html };
}

export async function sendPasswordResetEmail(
  input: PasswordResetEmailInput,
): Promise<MailDeliveryResult> {
  const smtpConfig = readSmtpConfig();

  if (!smtpConfig) {
    if (!process.env.VERCEL) {
      console.log("[auth:password-reset] SMTP nao configurado. Link local:");
      console.log(input.resetUrl);
    } else {
      console.warn(
        "[auth:password-reset] SMTP nao configurado no ambiente. E-mail nao enviado.",
      );
    }

    return {
      mode: "log",
    };
  }

  const transport = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.password,
    },
  });

  const content = buildPasswordResetEmail(input);

  await transport.sendMail({
    from: smtpConfig.from,
    to: input.to,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });

  return {
    mode: "smtp",
  };
}
