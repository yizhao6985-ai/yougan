import { Router } from "express";
import { z } from "zod";

import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  loginWithPassword,
  loginWithSmsCode,
  logoutUser,
  registerUser,
  requestPasswordReset,
  resetPasswordWithToken,
  requestEmailChange,
  confirmEmailChange,
  sendSmsLoginCode,
  signToken,
  getUserById,
  updateUserProfile,
} from "../services/auth.js";
import { UpdateProfileSchema } from "../schemas.js";

const loginBodySchema = z
  .object({
    login: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(1),
  })
  .refine((body) => Boolean(body.login ?? body.email), {
    message: "login is required",
  });

const registerBodySchema = z
  .object({
    login: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6),
    name: z.string().optional(),
  })
  .refine((body) => Boolean(body.login ?? body.email), {
    message: "login is required",
  });

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const body = registerBodySchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  try {
    const user = await registerUser({
      login: body.data.login ?? body.data.email!,
      password: body.data.password,
      name: body.data.name,
    });
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "EMAIL_EXISTS" || error.message === "PHONE_EXISTS") {
        res.status(409).json({ error: "该账号已存在，请直接登录" });
        return;
      }
      if (error.message === "INVALID_LOGIN") {
        res.status(400).json({ error: "请输入有效的手机号或邮箱" });
        return;
      }
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

authRouter.post("/login", async (req, res) => {
  const body = loginBodySchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  try {
    const user = await loginWithPassword(
      body.data.login ?? body.data.email!,
      body.data.password,
    );
    const token = signToken(user);
    res.json({ token, user });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_LOGIN") {
      res.status(400).json({ error: "请输入有效的手机号或邮箱" });
      return;
    }
    res.status(401).json({ error: "账号或密码不正确" });
  }
});

authRouter.post("/sms/send", async (req, res) => {
  const body = z.object({ phone: z.string().min(1) }).safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    const result = await sendSmsLoginCode(body.data.phone);
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_PHONE") {
        res.status(400).json({ error: "请输入有效的中国大陆手机号" });
        return;
      }
      if (error.message.startsWith("SMS_COOLDOWN:")) {
        const seconds = Number(error.message.split(":")[1] ?? "60");
        res.status(429).json({
          error: `请 ${seconds} 秒后再试`,
          cooldownSeconds: seconds,
        });
        return;
      }
      if (error.message === "SMS_NOT_CONFIGURED") {
        res.status(503).json({ error: "短信服务未配置" });
        return;
      }
    }
    console.error("[auth] Failed to send SMS code:", error);
    res.status(500).json({ error: "验证码发送失败" });
  }
});

authRouter.post("/sms/login", async (req, res) => {
  const body = z
    .object({
      phone: z.string().min(1),
      code: z.string().min(6).max(6),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    const user = await loginWithSmsCode(body.data.phone, body.data.code);
    const token = signToken(user);
    res.json({ token, user });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_PHONE") {
        res.status(400).json({ error: "请输入有效的中国大陆手机号" });
        return;
      }
      if (
        error.message === "INVALID_SMS_CODE" ||
        error.message === "SMS_CODE_EXPIRED" ||
        error.message === "SMS_CODE_LOCKED"
      ) {
        const message =
          error.message === "SMS_CODE_EXPIRED"
            ? "验证码已过期，请重新获取"
            : error.message === "SMS_CODE_LOCKED"
              ? "验证码错误次数过多，请重新获取"
              : "验证码不正确";
        res.status(400).json({ error: message });
        return;
      }
    }
    res.status(500).json({ error: "登录失败" });
  }
});

authRouter.post("/forgot-password", async (req, res) => {
  const body = z
    .object({
      login: z.string().min(1).optional(),
      email: z.string().email().optional(),
    })
    .refine((value) => Boolean(value.login ?? value.email), {
      message: "login is required",
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    const result = await requestPasswordReset(
      body.data.login ?? body.data.email!,
    );
    res.json({ ok: true, ...result });
  } catch (error) {
    console.error("[auth] Failed to send password reset email:", error);
    res.status(500).json({ error: "Failed to send reset email" });
  }
});

authRouter.post("/reset-password", async (req, res) => {
  const body = z
    .object({
      token: z.string().min(1),
      password: z.string().min(6),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    await resetPasswordWithToken(body.data.token, body.data.password);
    res.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PASSWORD_TOO_SHORT") {
        res.status(400).json({ error: "新密码至少 6 位" });
        return;
      }
      if (error.message === "INVALID_RESET_TOKEN") {
        res.status(400).json({ error: "重置链接无效或已过期" });
        return;
      }
    }
    res.status(500).json({ error: "Reset failed" });
  }
});

authRouter.post("/logout", requireAuth, async (req: AuthedRequest, res) => {
  try {
    await logoutUser(req.userId!);
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Logout failed" });
  }
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const user = await getUserById(req.userId!);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({ user });
});

authRouter.post("/change-email", requireAuth, async (req: AuthedRequest, res) => {
  const body = z
    .object({
      newEmail: z.string().email(),
      currentPassword: z.string().min(1),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    const result = await requestEmailChange(
      req.userId!,
      body.data.newEmail,
      body.data.currentPassword,
    );
    res.json({
      ok: true,
      message: "确认邮件已发送到新邮箱，请查收并完成验证。",
      ...result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_CURRENT_PASSWORD") {
        res.status(400).json({ error: "当前密码不正确" });
        return;
      }
      if (error.message === "EMAIL_EXISTS") {
        res.status(409).json({ error: "该邮箱已被其他账号使用" });
        return;
      }
      if (error.message === "EMAIL_UNCHANGED") {
        res.status(400).json({ error: "新邮箱不能与当前邮箱相同" });
        return;
      }
      if (error.message === "EMAIL_NOT_BOUND") {
        res.status(400).json({ error: "当前账号未绑定邮箱" });
        return;
      }
      if (error.message === "PASSWORD_NOT_SET") {
        res.status(400).json({ error: "请先在账户设置中设置登录密码" });
        return;
      }
    }
    res.status(500).json({ error: "Failed to request email change" });
  }
});

authRouter.post("/confirm-email", async (req, res) => {
  const body = z.object({ token: z.string().min(1) }).safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    const result = await confirmEmailChange(body.data.token);
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_EMAIL_CHANGE_TOKEN") {
        res.status(400).json({ error: "确认链接无效或已过期" });
        return;
      }
      if (error.message === "EMAIL_EXISTS") {
        res.status(409).json({ error: "该邮箱已被其他账号使用" });
        return;
      }
    }
    res.status(500).json({ error: "Email confirmation failed" });
  }
});

authRouter.patch("/me", requireAuth, async (req: AuthedRequest, res) => {
  const body = UpdateProfileSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    const user = await updateUserProfile(req.userId!, body.data);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    res.json({ user });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CURRENT_PASSWORD_REQUIRED") {
        res.status(400).json({ error: "修改密码需要提供当前密码" });
        return;
      }
      if (error.message === "INVALID_CURRENT_PASSWORD") {
        res.status(400).json({ error: "当前密码不正确" });
        return;
      }
      if (error.message === "PASSWORD_TOO_SHORT") {
        res.status(400).json({ error: "新密码至少 6 位" });
        return;
      }
    }
    res.status(500).json({ error: "Update failed" });
  }
});
