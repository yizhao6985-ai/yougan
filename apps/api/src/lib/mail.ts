import nodemailer from "nodemailer";

import { env } from "../env.js";

function getTransport() {
  const { smtp } = env.mail;
  if (!env.mail.smtpConfigured) return null;

  return nodemailer.createTransport({
    host: smtp.host!,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user!, pass: smtp.pass! },
  });
}

function logDevLink(label: string, to: string, url: string) {
  console.info(`[mail] ${label} for ${to}:\n${url}`);
}

export async function sendEmailChangeEmail(
  to: string,
  confirmUrl: string,
) {
  const subject = "确认你的 Yougan 新邮箱";
  const text = [
    "你好，",
    "",
    "你正在将 Yougan 账号绑定到新邮箱。请点击以下链接完成确认（1 小时内有效）：",
    confirmUrl,
    "",
    "如果这不是你的操作，请忽略此邮件并保持原邮箱登录。",
  ].join("\n");

  const transport = getTransport();
  if (!transport) {
    logDevLink("Email change confirmation", to, confirmUrl);
    return;
  }

  await transport.sendMail({
    from: env.mail.from,
    to,
    subject,
    text,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const subject = "重置你的 Yougan 密码";
  const text = [
    "你好，",
    "",
    "我们收到了重置 Yougan 账号密码的请求。请点击以下链接设置新密码（1 小时内有效）：",
    resetUrl,
    "",
    "如果这不是你的操作，请忽略此邮件。",
  ].join("\n");

  const transport = getTransport();
  if (!transport) {
    logDevLink("Password reset", to, resetUrl);
    return;
  }

  await transport.sendMail({
    from: env.mail.from,
    to,
    subject,
    text,
  });
}
