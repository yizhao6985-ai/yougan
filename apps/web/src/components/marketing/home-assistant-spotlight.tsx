import { CheckIcon, MessageCircleQuestionIcon } from "lucide-react";

import { scene } from "@/lib/scene-styles";
import { HELP_ASSISTANT } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

export function HomeAssistantSpotlight() {
  return (
    <div
      className={cn(
        scene.surface,
        "grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]",
      )}
    >
      <div className="flex flex-col p-6 sm:p-8 lg:p-10">
        <span className="inline-flex size-12 items-center justify-center rounded-xl bg-accent text-primary ring-1 ring-primary/10">
          <MessageCircleQuestionIcon className="size-6" aria-hidden />
        </span>

        <h3 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
          有感助手
        </h3>
        <p className="mt-3 max-w-md text-base leading-7 text-muted-foreground">
          {HELP_ASSISTANT.subtitle}
        </p>

        <ul className="mt-8 space-y-3">
          {HELP_ASSISTANT.highlights.map((item) => (
            <li
              key={item}
              className="flex gap-2.5 text-sm leading-6 text-muted-foreground"
            >
              <CheckIcon
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-sm font-medium text-primary">
          {HELP_ASSISTANT.entryHint}
        </p>
      </div>

      <div className="border-t border-border/60 bg-gradient-to-br from-accent/25 via-card to-secondary/30 p-6 sm:p-8 lg:border-t-0 lg:border-l lg:p-10">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {HELP_ASSISTANT.sampleQuestionsTitle}
        </p>
        <ul className="mt-4 space-y-3">
          {HELP_ASSISTANT.sampleQuestions.map((question) => (
            <li
              key={question}
              className="rounded-xl bg-card/90 px-4 py-3.5 text-sm leading-6 text-foreground ring-1 ring-border/50"
            >
              {question}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
