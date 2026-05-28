import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useResetPasswordMutation } from "@/hooks/queries/auth";
import { scene } from "@/lib/scene-styles";
import { cn } from "@/lib/utils";
import { ApiError } from "@/services/client";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const resetMutation = useResetPasswordMutation();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("重置链接无效，请重新申请");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    try {
      await resetMutation.mutateAsync({ token, password });
      navigate("/login", {
        replace: true,
        state: { notice: "密码已重置，请使用新密码登录" },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "请求失败");
    }
  };

  return (
    <main className={cn(scene.app, "items-center justify-center px-4")}>
      <div className={scene.authCard}>
        <h1 className="text-xl font-semibold text-card-foreground">设置新密码</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          请输入新的登录密码（至少 6 位）
        </p>

        {!token ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-destructive">重置链接无效或缺少 token 参数</p>
            <Button type="button" variant="outline" className="w-full" asChild>
              <Link to="/forgot-password">重新申请重置</Link>
            </Button>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            <Input
              type="password"
              required
              minLength={6}
              placeholder="新密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              type="password"
              required
              minLength={6}
              placeholder="确认新密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button
              type="submit"
              disabled={resetMutation.isPending}
              className="w-full"
            >
              {resetMutation.isPending ? "保存中..." : "保存新密码"}
            </Button>
          </form>
        )}

        <Link
          to="/login"
          className="mt-6 block text-center text-xs text-muted-foreground hover:text-foreground"
        >
          返回登录
        </Link>
      </div>
    </main>
  );
}
