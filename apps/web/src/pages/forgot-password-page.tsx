import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForgotPasswordMutation } from "@/hooks/queries/auth";
import { scene } from "@/lib/scene-styles";
import { AUTH } from "@/lib/site-copy";
import { cn } from "@/lib/utils";
import { ApiError } from "@/services/client";

export function ForgotPasswordPage() {
  const forgotMutation = useForgotPasswordMutation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const result = await forgotMutation.mutateAsync(email);
      setDevResetUrl(result.devResetUrl ?? null);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "请求失败");
    }
  };

  return (
    <main className={cn(scene.app, "items-center justify-center px-4")}>
      <div className={scene.authCard}>
        <h1 className="text-xl font-semibold text-card-foreground">
          {AUTH.forgotTitle}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {AUTH.forgotSubtitle}
        </p>

        {sent ? (
          <div className="mt-6 space-y-4">
            {devResetUrl ? (
              <>
                <p className="text-sm leading-6 text-muted-foreground">
                  {AUTH.forgotDev}
                </p>
                <a
                  href={devResetUrl}
                  className="block break-all rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-primary hover:underline"
                >
                  {devResetUrl}
                </a>
              </>
            ) : (
              <>
                <p className="text-sm leading-6 text-muted-foreground">
                  {AUTH.forgotSent}
                </p>
                <p className="text-xs text-muted-foreground">{AUTH.forgotSentHint}</p>
              </>
            )}
            <Button type="button" variant="outline" className="w-full" asChild>
              <Link to="/login">{AUTH.backLogin}</Link>
            </Button>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            <Input
              type="email"
              required
              placeholder="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button
              type="submit"
              disabled={forgotMutation.isPending}
              className="w-full"
            >
              {forgotMutation.isPending ? "发送中..." : "发送重置链接"}
            </Button>
          </form>
        )}

        {!sent ? (
          <Link
            to="/login"
            className="mt-6 block text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {AUTH.backLogin}
          </Link>
        ) : null}
      </div>
    </main>
  );
}
