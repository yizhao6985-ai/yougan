import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";

import { LocaleSelect } from "@/components/locale-select";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  useLoginMutation,
  useRegisterMutation,
} from "@/hooks/queries/auth";
import { scene } from "@/lib/scene-styles";
import { AUTH, BRAND, HOME } from "@/lib/site-copy";
import { cn } from "@/lib/utils";
import { ApiError } from "@/services/client";

function AuthField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const notice =
    (location.state as { notice?: string } | null)?.notice ?? null;
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loading = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      if (mode === "login") {
        await loginMutation.mutateAsync({ email, password });
      } else {
        await registerMutation.mutateAsync({
          email,
          password,
          name: name || undefined,
        });
      }
      navigate("/studio", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "请求失败");
    }
  };

  return (
    <main className={cn(scene.marketing, "relative min-h-screen overflow-x-hidden")}>
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-1/4 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-900/20"
      />

      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-end gap-2 px-4 py-4 sm:px-6 sm:py-5">
        <LocaleSelect />
        <ThemeToggle />
      </header>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-[4.5rem] sm:px-6 sm:pb-14 sm:pt-24 lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center lg:gap-14 lg:px-10 lg:py-20 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,28rem)] xl:gap-20">
        <section className="hidden lg:flex lg:flex-col lg:justify-center lg:pr-6 xl:pr-10">
          <Link
            to="/"
            className="mb-10 inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4 shrink-0" aria-hidden />
            {AUTH.backHome}
          </Link>

          <div className="max-w-md space-y-6">
            <p className={scene.eyebrow}>{BRAND.en}</p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground xl:text-5xl">
              {HOME.title}
              <span className="mt-3 block text-2xl font-medium leading-snug text-muted-foreground xl:text-3xl">
                {BRAND.taglineLanding}
              </span>
            </h1>
            <p className={cn("max-w-sm leading-8", scene.subtitle)}>
              {AUTH.loginSubtitle}
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none lg:pl-2 xl:pl-4">
          <Link
            to="/"
            className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground lg:hidden"
          >
            <ArrowLeftIcon className="size-4 shrink-0" aria-hidden />
            {AUTH.backHome}
          </Link>

          <div className="mb-6 space-y-2 px-1 text-center lg:hidden">
            <p className={scene.eyebrow}>{BRAND.en}</p>
            <p className="text-lg font-semibold text-foreground">{HOME.title}</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {BRAND.taglineLanding}
            </p>
          </div>

          <div
            className={cn(
              scene.card,
              "border-border/80 bg-card/95 shadow-lg shadow-primary/5 backdrop-blur",
            )}
          >
            <div className="space-y-6 px-5 py-7 sm:px-7 sm:py-8">
              <div className="space-y-2 px-0.5">
                <h2 className="text-xl font-semibold text-card-foreground">
                  {mode === "login" ? AUTH.loginTitle : "创建账号"}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {mode === "login"
                    ? "使用邮箱登录，继续你的创作"
                    : "注册后作品与记录将云端保存"}
                </p>
              </div>

              {notice ? (
                <p className="rounded-lg border border-border/80 bg-muted/50 px-4 py-3 text-sm leading-6 text-muted-foreground">
                  {notice}
                </p>
              ) : null}

              <form
                className="space-y-5"
                onSubmit={(e) => void handleSubmit(e)}
              >
                {mode === "register" ? (
                  <AuthField id="name" label="昵称（可选）">
                    <Input
                      id="name"
                      placeholder="如何称呼你"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </AuthField>
                ) : null}

                <AuthField id="email" label="邮箱">
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </AuthField>

                <AuthField id="password" label="密码">
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="至少 6 位"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                </AuthField>

                {error ? (
                  <p
                    className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm leading-6 text-destructive"
                    role="alert"
                  >
                    {error}
                  </p>
                ) : null}

                {mode === "login" ? (
                  <div className="flex justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-xs text-muted-foreground transition hover:text-foreground"
                    >
                      忘记密码？
                    </Link>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-lg px-4 text-base shadow-sm shadow-primary/15"
                >
                  {loading
                    ? "处理中..."
                    : mode === "login"
                      ? "登录"
                      : "注册"}
                </Button>
              </form>

              <div className="space-y-5">
                <Separator className="bg-border/80" />
                <p className="text-center text-sm leading-6 text-muted-foreground">
                  {mode === "login" ? "还没有账号？" : "已有账号？"}
                  <button
                    type="button"
                    className="ml-1 font-medium text-primary transition hover:text-primary/85"
                    onClick={() => {
                      setMode(mode === "login" ? "register" : "login");
                      setError(null);
                    }}
                  >
                    {mode === "login" ? "立即注册" : "去登录"}
                  </button>
                </p>
              </div>

              <p className="px-2 text-center text-xs leading-relaxed text-muted-foreground">
                继续即表示你同意我们的服务条款与隐私政策。
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
