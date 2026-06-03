import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useConfirmEmailQuery } from "@/hooks/queries/auth";
import { scene } from "@/lib/scene-styles";
import { cn } from "@/lib/utils";

export function ConfirmEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const confirmQuery = useConfirmEmailQuery(token);

  useEffect(() => {
    if (!confirmQuery.isSuccess) return;
    const timer = window.setTimeout(() => {
      navigate("/settings/account", { replace: true });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [confirmQuery.isSuccess, navigate]);

  const failed = !token || confirmQuery.isError;

  return (
    <main className={cn(scene.app, "items-center justify-center px-4")}>
      <div className={scene.authCard}>
        <h1 className="text-xl font-semibold text-card-foreground">
          确认新邮箱
        </h1>

        {failed ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-destructive">
              确认链接无效或已过期，请重新在账户设置中发起邮箱修改。
            </p>
            <Button type="button" variant="outline" className="w-full" asChild>
              <Link to="/settings/account">前往账户设置</Link>
            </Button>
          </div>
        ) : confirmQuery.isPending ? (
          <p className="mt-6 text-sm text-muted-foreground">正在验证…</p>
        ) : confirmQuery.isSuccess ? (
          <p className="mt-6 text-sm text-emerald-700">邮箱已更新，正在跳转…</p>
        ) : null}
      </div>
    </main>
  );
}
