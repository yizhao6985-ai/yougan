import { Router } from "express";
import { z } from "zod";

import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  loginUser,
  logoutUser,
  registerUser,
  requestPasswordReset,
  resetPasswordWithToken,
  requestEmailChange,
  confirmEmailChange,
  signToken,
  getUserById,
  updateUserProfile,
} from "../services/auth.js";
import { UpdateProfileSchema } from "../schemas.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const body = z
    .object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  try {
    const user = await registerUser(body.data);
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

authRouter.post("/login", async (req, res) => {
  const body = z
    .object({ email: z.string().email(), password: z.string().min(1) })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  try {
    const user = await loginUser(body.data.email, body.data.password);
    const token = signToken(user);
    res.json({ token, user });
  } catch {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

authRouter.post("/forgot-password", async (req, res) => {
  const body = z.object({ email: z.string().email() }).safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    const result = await requestPasswordReset(body.data.email);
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
