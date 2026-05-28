import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useConfirmEmailMutation } from "@/hooks/queries/auth";
import { scene } from "@/lib/scene-styles";
import { cn } from "@/lib/utils";

export function ConfirmEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const confirmMutation = useConfirmEmailMutation();
  const ranRef = useRef(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!token) {
      setFailed(true);
      return;
    }
    if (ranRef.current) return;
    ranRef.current = true;

    confirmMutation.mutate(token, {
      onSuccess: () => {
        setMessage("邮箱已更新，正在跳转…");
        window.setTimeout(() => {
          navigate("/settings/account", { replace: true });
        }, 1200);
      },
      onError: () => {
        setFailed(true);
      },
    });
  }, [confirmMutation, navigate, token]);

  return (
    <main className={cn(scene.app, "items-center justify-center px-4")}>
      <div className={scene.authCard}>
        <h1 className="text-xl font-semibold text-card-foreground">
          确认新邮箱
        </h1>

        {!token || failed ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-destructive">
              确认链接无效或已过期，请重新在账户设置中发起邮箱修改。
            </p>
            <Button type="button" variant="outline" className="w-full" asChild>
              <Link to="/settings/account">前往账户设置</Link>
            </Button>
          </div>
        ) : confirmMutation.isPending ? (
          <p className="mt-6 text-sm text-muted-foreground">正在验证…</p>
        ) : message ? (
          <p className="mt-6 text-sm text-emerald-700">{message}</p>
        ) : null}
      </div>
    </main>
  );
}
