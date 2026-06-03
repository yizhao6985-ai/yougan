import { useState } from "react";
import { useLocation } from "react-router-dom";
import { CheckCircle2Icon, CopyIcon, MailIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMeQuery } from "@/hooks/queries/auth";
import {
  buildFeedbackMailto,
  copyFeedbackToClipboard,
  type FeedbackCategory,
  type FeedbackDraft,
  FEEDBACK_CATEGORY_LABELS,
  formatFeedbackBody,
  readFeedbackDraft,
  writeFeedbackDraft,
} from "@/lib/feedback";
import { FEEDBACK } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

const CATEGORY_OPTIONS = Object.entries(FEEDBACK_CATEGORY_LABELS) as Array<
  [FeedbackCategory, string]
>;

const EMPTY_DRAFT: FeedbackDraft = {
  category: "bug",
  description: "",
  contactEmail: "",
};

type FeedbackFormProps = {
  className?: string;
  /** 提交成功后的回调（例如关闭弹层） */
  onSubmitted?: () => void;
};

export function FeedbackForm({ className, onSubmitted }: FeedbackFormProps) {
  const location = useLocation();
  const { data: user } = useMeQuery();
  const [draft, setDraft] = useState<FeedbackDraft>(() => {
    return readFeedbackDraft() ?? { ...EMPTY_DRAFT };
  });
  const [error, setError] = useState<string | null>(null);
  const [submittedBody, setSubmittedBody] = useState<string | null>(null);
  const [submittedCategory, setSubmittedCategory] =
    useState<FeedbackCategory>("bug");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const contactEmail = draft.contactEmail || user?.email || "";

  const updateDraft = (patch: Partial<FeedbackDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      if (!submittedBody) {
        writeFeedbackDraft(next);
      }
      return next;
    });
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const description = draft.description.trim();
    if (description.length < 10) {
      setError(FEEDBACK.descriptionMinError);
      return;
    }

    setSubmitting(true);
    const body = formatFeedbackBody(
      { ...draft, contactEmail },
      {
        pageUrl: `${window.location.origin}${location.pathname}${location.search}`,
        userAgent: navigator.userAgent,
        userId: user?.id,
        userEmail: user?.email,
      },
    );

    const didCopy = await copyFeedbackToClipboard(body);
    writeFeedbackDraft(null);
    setSubmittedCategory(draft.category);
    setSubmittedBody(body);
    setCopied(didCopy);
    setSubmitting(false);
    onSubmitted?.();
  };

  const handleReset = () => {
    setSubmittedBody(null);
    setCopied(false);
    setError(null);
    setDraft({
      ...EMPTY_DRAFT,
      contactEmail: user?.email ?? "",
    });
  };

  if (submittedBody) {
    return (
      <div className={cn("space-y-5", className)}>
        <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-4 py-4 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100">
          <p className="inline-flex items-start gap-2 font-medium">
            <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
            {copied ? FEEDBACK.submitSuccessCopied : FEEDBACK.submitSuccess}
          </p>
          <p className="mt-2 leading-6 text-emerald-800/90 dark:text-emerald-200/90">
            {FEEDBACK.submitSuccessHint}
          </p>
        </div>

        <pre className="max-h-48 overflow-auto rounded-lg border border-border/80 bg-muted/40 p-3 text-xs leading-5 text-foreground/90">
          {submittedBody}
        </pre>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              void copyFeedbackToClipboard(submittedBody).then((ok) => {
                if (ok) setCopied(true);
              })
            }
          >
            <CopyIcon className="size-4" />
            {copied ? FEEDBACK.copiedAgain : FEEDBACK.copyAgain}
          </Button>
          <Button type="button" asChild>
            <a href={buildFeedbackMailto(submittedBody, submittedCategory)}>
              <MailIcon className="size-4" />
              {FEEDBACK.openMail}
            </a>
          </Button>
          <Button type="button" variant="ghost" onClick={handleReset}>
            {FEEDBACK.submitAnother}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form className={cn("space-y-5", className)} onSubmit={(e) => void handleSubmit(e)}>
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{FEEDBACK.categoryLabel}</p>
        <Select
          value={draft.category}
          onValueChange={(value) =>
            updateDraft({ category: value as FeedbackCategory })
          }
        >
          <SelectTrigger aria-label={FEEDBACK.categoryLabel}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{FEEDBACK.descriptionLabel}</p>
        <Textarea
          value={draft.description}
          onChange={(event) => updateDraft({ description: event.target.value })}
          placeholder={FEEDBACK.descriptionPlaceholder}
          rows={6}
          className="min-h-[9rem] resize-y"
        />
        <p className="text-xs text-muted-foreground">{FEEDBACK.descriptionHint}</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{FEEDBACK.contactLabel}</p>
        <Input
          type="email"
          value={contactEmail}
          onChange={(event) => updateDraft({ contactEmail: event.target.value })}
          placeholder={FEEDBACK.contactPlaceholder}
          autoComplete="email"
        />
        <p className="text-xs text-muted-foreground">{FEEDBACK.contactHint}</p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
        <p className="text-xs text-muted-foreground">{FEEDBACK.privacyNote}</p>
        <Button type="submit" disabled={submitting}>
          {submitting ? FEEDBACK.submitting : FEEDBACK.submit}
        </Button>
      </div>
    </form>
  );
}
