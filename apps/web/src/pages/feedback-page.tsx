import { Link } from "react-router-dom";
import { ArrowLeftIcon, MessageSquarePlusIcon } from "lucide-react";

import { FeedbackForm } from "@/components/feedback/feedback-form";
import { SiteHeader } from "@/components/site-header";
import { scene } from "@/lib/scene-styles";
import { FEEDBACK } from "@/lib/site-copy";
import { useIsAuthenticated } from "@/store/auth";

export function FeedbackPage() {
  const isLoggedIn = useIsAuthenticated();

  return (
    <div className={scene.marketing}>
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 sm:py-16">
        <Link
          to={isLoggedIn ? "/studio" : "/"}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {isLoggedIn ? FEEDBACK.backStudio : FEEDBACK.backHome}
        </Link>

        <div className="mt-8 flex items-start gap-4">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
            <MessageSquarePlusIcon className="size-6" aria-hidden />
          </span>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-primary/80">
              {FEEDBACK.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {FEEDBACK.title}
            </h1>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              {FEEDBACK.subtitle}
            </p>
          </div>
        </div>

        <section className="mt-10 rounded-lg border border-border/80 bg-card/90 p-6 shadow-sm shadow-border/20 sm:p-8">
          <FeedbackForm />
        </section>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {FEEDBACK.footerNote}{" "}
          <Link to="/about" className="text-primary underline-offset-2 hover:underline">
            {FEEDBACK.footerAboutLink}
          </Link>
        </p>
      </main>
    </div>
  );
}
