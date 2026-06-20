import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";
import { normalizeChinaMobilePhone } from "@yougan/domain";

import { LocaleSelect } from "@/components/locale-select";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useLoginMutation,
  useSendSmsCodeMutation,
  useSmsLoginMutation,
} from "@/hooks/queries/auth";
import { scene } from "@/lib/scene-styles";
import { AUTH, BRAND } from "@/lib/site-copy";
import { cn } from "@/lib/utils";
import { ApiError } from "@/services/client";

type AuthMethod = "phone" | "password";

const inputShellClassName =
  "h-11 rounded-xl border border-border/70 bg-background/80 px-3.5 text-sm shadow-none transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground/60 focus-visible:border-primary/35 focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-primary/10";

function AuthMethodTabs({
  method,
  onChange,
}: {
  method: AuthMethod;
  onChange: (method: AuthMethod) => void;
}) {
  return (
    <div
      className="flex gap-7 border-b border-border/50"
      role="tablist"
      aria-label="登录方式"
    >
      {(
        [
          { value: "phone" as const, label: AUTH.phoneTab },
          { value: "password" as const, label: AUTH.passwordTab },
        ] as const
      ).map((tab) => {
        const active = method === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(
              "relative -mb-px pb-3.5 text-[15px] transition-colors",
              active
                ? "font-medium text-foreground"
                : "text-muted-foreground/85 hover:text-foreground/75",
              active &&
                "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary",
            )}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function AuthMessage({
  tone,
  children,
}: {
  tone: "notice" | "error";
  children: React.ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : undefined}
      className={cn(
        "rounded-lg px-3 py-2 text-sm leading-5",
        tone === "error" &&
          "bg-destructive/5 text-destructive ring-1 ring-destructive/10",
        tone === "notice" &&
          "bg-muted/40 text-muted-foreground ring-1 ring-border/50",
      )}
    >
      {children}
    </p>
  );
}

function TermsAgreement({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor="terms-login"
      className="flex cursor-pointer items-start gap-2.5 text-left"
    >
      <input
        id="terms-login"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-3.5 shrink-0 rounded-[0.25rem] border-border/70 accent-primary"
      />
      <span className="text-xs leading-[1.45] text-muted-foreground">
        {AUTH.termsAgreePrefix}{" "}
        <span className="text-foreground/80 underline-offset-2 hover:text-primary hover:underline">
          {AUTH.termsService}
        </span>{" "}
        {AUTH.termsAgreeJoin}{" "}
        <span className="text-foreground/80 underline-offset-2 hover:text-primary hover:underline">
          {AUTH.termsPrivacy}
        </span>
      </span>
    </label>
  );
}

function FormFooterLinks({ method }: { method: AuthMethod }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 text-xs leading-4",
        method !== "password" && "invisible",
      )}
      aria-hidden={method !== "password"}
    >
      <Link
        to="/forgot-password"
        tabIndex={method === "password" ? undefined : -1}
        className="text-muted-foreground transition hover:text-primary"
      >
        忘记密码？
      </Link>
      <span className="text-muted-foreground/75">支持手机号或邮箱</span>
    </div>
  );
}

function LoginBrand() {
  return (
    <Link
      to="/"
      className="group mx-auto mb-9 block max-w-xs text-center outline-none sm:mb-10"
    >
      <p className="text-[1.35rem] font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
        {BRAND.full}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {BRAND.taglineLanding}
      </p>
    </Link>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const notice =
    (location.state as { notice?: string } | null)?.notice ?? null;

  const loginMutation = useLoginMutation();
  const sendSmsMutation = useSendSmsCodeMutation();
  const smsLoginMutation = useSmsLoginMutation();

  const [method, setMethod] = useState<AuthMethod>("phone");
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const loading =
    loginMutation.isPending ||
    sendSmsMutation.isPending ||
    smsLoginMutation.isPending;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    setError(null);
  }, [method]);

  const handleSendSmsCode = async () => {
    setError(null);

    if (!normalizeChinaMobilePhone(phone)) {
      setError("请输入有效的中国大陆手机号");
      return;
    }

    try {
      const result = await sendSmsMutation.mutateAsync(phone);
      setCooldown(result.cooldownSeconds);
      if (result.devCode) {
        window.alert(AUTH.devSmsHint(result.devCode));
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        const match = err.message.match(/(\d+)/);
        if (match) setCooldown(Number(match[1]));
      }
      setError(err instanceof ApiError ? err.message : "验证码发送失败");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!termsAccepted) {
      setError(AUTH.termsRequired);
      return;
    }

    try {
      if (method === "phone") {
        if (!normalizeChinaMobilePhone(phone)) {
          setError("请输入有效的中国大陆手机号");
          return;
        }
        await smsLoginMutation.mutateAsync({ phone, code: smsCode });
      } else {
        await loginMutation.mutateAsync({ login: loginId, password });
      }
      navigate("/studio", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "登录失败");
    }
  };

  return (
    <div className={cn(scene.marketing, "relative min-h-screen overflow-hidden")}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(100vh,52rem)] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(14,165,233,0.12),transparent_60%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(56,189,248,0.08),transparent_60%)]"
      />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <Link
          to="/"
          className={cn(scene.backLink, "rounded-lg px-2 py-1.5 hover:bg-card/70")}
        >
          <ArrowLeftIcon className="size-4 shrink-0" aria-hidden />
          {AUTH.backHome}
        </Link>
        <div className="flex items-center gap-2 sm:gap-2.5">
          <LocaleSelect />
          <ThemeToggle />
        </div>
      </header>

      <main className="relative flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-5 pb-10 pt-2 sm:px-8 sm:pb-14">
        <div className="w-full max-w-[24.5rem] animate-in fade-in slide-in-from-bottom-3 duration-700">
          <LoginBrand />

          <div className="rounded-[1.35rem] border border-border/55 bg-card/92 p-6 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.18)] backdrop-blur-md sm:p-8 dark:border-white/[0.06] dark:bg-card/88 dark:shadow-black/40">
            <AuthMethodTabs method={method} onChange={setMethod} />

            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => void handleSubmit(event)}
            >
              {notice ? <AuthMessage tone="notice">{notice}</AuthMessage> : null}

              {method === "phone" ? (
                <>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    required
                    placeholder={AUTH.phonePlaceholder}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className={inputShellClassName}
                  />

                  <div
                    className={cn(
                      inputShellClassName,
                      "flex items-center gap-2 px-0 focus-within:border-primary/35 focus-within:bg-background focus-within:ring-[3px] focus-within:ring-primary/10",
                    )}
                  >
                    <input
                      id="sms-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      maxLength={6}
                      placeholder={AUTH.smsCodePlaceholder}
                      value={smsCode}
                      onChange={(event) =>
                        setSmsCode(event.target.value.replace(/\D/g, ""))
                      }
                      className="min-w-0 flex-1 bg-transparent px-3.5 text-sm outline-none placeholder:text-muted-foreground/60"
                    />
                    <button
                      type="button"
                      className="shrink-0 px-3 text-sm font-medium text-primary transition hover:text-primary/80 disabled:cursor-not-allowed disabled:text-muted-foreground/70"
                      disabled={loading || cooldown > 0}
                      onClick={() => void handleSendSmsCode()}
                    >
                      {cooldown > 0
                        ? AUTH.resendSmsCode(cooldown)
                        : AUTH.sendSmsCode}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Input
                    id="login-id"
                    required
                    autoComplete="username"
                    placeholder={AUTH.passwordLoginPlaceholder}
                    value={loginId}
                    onChange={(event) => setLoginId(event.target.value)}
                    className={inputShellClassName}
                  />

                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder={AUTH.passwordPlaceholder}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    className={inputShellClassName}
                  />
                </>
              )}

              <TermsAgreement
                checked={termsAccepted}
                onChange={setTermsAccepted}
              />

              {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}

              <Button
                type="submit"
                disabled={loading || !termsAccepted}
                className="h-11 w-full rounded-xl text-[15px] font-medium shadow-sm shadow-primary/15 transition enabled:hover:shadow-md enabled:hover:shadow-primary/20 disabled:opacity-45"
              >
                {loading
                  ? "处理中..."
                  : method === "phone"
                    ? AUTH.phoneSubmit
                    : AUTH.passwordSubmit}
              </Button>

              <FormFooterLinks method={method} />
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
