import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckIcon, PencilIcon, Trash2Icon } from "lucide-react";

import {
  EMPTY_WORK_PROFILE,
  getProfileStepCopy,
  mediaModalityLabel,
  parseProfileJson,
  type ProfileSetupStep,
} from "@yougan/domain";

import {
  CreativeContextInset,
  CreativeContextList,
  CreativeContextListItem,
  CreativeContextSection,
} from "@/components/studio/creative-context/shared";
import { cn } from "@/lib/utils";
import { PROFILE_WIZARD } from "@/lib/site-copy";
import { buildProfileSetupView } from "@/lib/profile-setup-display";
import { formatLabel } from "@yougan/domain";
import type { WorkProfile } from "@/lib/types";

function GuidedEmpty({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="min-h-[4.5rem] rounded-lg border border-dashed border-border bg-muted/50 px-4 py-4">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1.5 text-pretty text-xs leading-6 text-muted-foreground">
        {body}
      </p>
    </div>
  );
}

function EditableSpecItem({
  spec,
  heading,
  editable,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: {
  spec: string;
  heading?: string;
  editable: boolean;
  onEdit: (next: string) => void;
  onDelete: () => void;
  editLabel: string;
  deleteLabel: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(spec);

  useEffect(() => {
    if (!editing) {
      setDraft(spec);
    }
  }, [editing, spec]);

  const save = () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === spec.trim()) {
      setDraft(spec);
      setEditing(false);
      return;
    }
    onEdit(trimmed);
    setEditing(false);
  };

  return (
    <CreativeContextListItem>
      {editing ? (
        <div className="space-y-2">
          <textarea
            className="min-h-16 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
              onClick={save}
            >
              保存
            </button>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs text-muted-foreground"
              onClick={() => {
                setDraft(spec);
                setEditing(false);
              }}
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <>
          {heading ? (
            <p className="text-xs font-medium text-primary">{heading}</p>
          ) : null}
          <p className="text-pretty leading-6">{spec}</p>
          {editable ? (
            <div className="mt-1 flex justify-end gap-1">
              <button
                type="button"
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={editLabel}
                onClick={() => setEditing(true)}
              >
                <PencilIcon className="size-3.5" />
              </button>
              <button
                type="button"
                className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                aria-label={deleteLabel}
                onClick={onDelete}
              >
                <Trash2Icon className="size-3.5" />
              </button>
            </div>
          ) : null}
        </>
      )}
    </CreativeContextListItem>
  );
}

function SpecRows({ rows }: { rows: Array<{ label: string; value: string }> }) {
  if (!rows.length) return null;
  return (
    <CreativeContextInset>
      <dl className="grid gap-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[4.5rem_1fr] gap-2">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
    </CreativeContextInset>
  );
}

function SpecList({
  items,
  editable,
  onUpdate,
  onDelete,
  onClear,
  clearLabel,
  editLabel,
  deleteLabel,
}: {
  items: Array<{ id: string; spec: string }>;
  editable: boolean;
  onUpdate?: (id: string, spec: string) => void;
  onDelete?: (id: string) => void;
  onClear?: () => void;
  clearLabel: string;
  editLabel: string;
  deleteLabel: string;
}) {
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      {editable && onClear ? (
        <div className="flex justify-end">
          <button
            type="button"
            className="text-xs text-muted-foreground transition hover:text-red-600"
            onClick={onClear}
          >
            {clearLabel}
          </button>
        </div>
      ) : null}
      <CreativeContextList>
        {items.map((item) => (
          <EditableSpecItem
            key={item.id}
            spec={item.spec}
            editable={editable}
            editLabel={editLabel}
            deleteLabel={deleteLabel}
            onEdit={(next) => onUpdate?.(item.id, next)}
            onDelete={() => onDelete?.(item.id)}
          />
        ))}
      </CreativeContextList>
    </div>
  );
}

function DirectionDisplay({ profile }: { profile: WorkProfile }) {
  const { direction } = profile;
  const rows: Array<{ label: string; value: string }> = [];
  if (direction.summary.trim()) {
    rows.push({ label: "定位", value: direction.summary.trim() });
  }
  if (direction.format) {
    rows.push({
      label: "形式",
      value: formatLabel(direction.format) ?? direction.format,
    });
  }
  if (direction.audience?.trim()) {
    rows.push({ label: "受众", value: direction.audience.trim() });
  }
  return rows.length ? <SpecRows rows={rows} /> : null;
}

function StyleDisplay({ profile }: { profile: WorkProfile }) {
  const style = profile.style ?? {};
  const rows: Array<{ label: string; value: string }> = [];
  if (style.verbal?.trim()) {
    rows.push({ label: "文字", value: style.verbal.trim() });
  }
  if (style.visual?.trim()) {
    rows.push({ label: "画面", value: style.visual.trim() });
  }
  return rows.length ? <SpecRows rows={rows} /> : null;
}

function ProfileStepList({
  steps,
  profile,
  activeStepId,
  editable,
  onUpdateBound,
  onDeleteBound,
  onUpdateContext,
  onDeleteContext,
  onUpdateSequence,
  onDeleteSequence,
  onClearBounds,
  onClearContext,
  onClearSequence,
  onSkipStep,
}: {
  steps: ReturnType<typeof buildProfileSetupView>["state"]["steps"];
  profile: WorkProfile;
  activeStepId: ProfileSetupStep;
  editable: boolean;
  onUpdateBound?: (id: string, spec: string) => void;
  onDeleteBound?: (id: string) => void;
  onUpdateContext?: (id: string, spec: string) => void;
  onDeleteContext?: (id: string) => void;
  onUpdateSequence?: (id: string, spec: string) => void;
  onDeleteSequence?: (id: string) => void;
  onClearBounds?: () => void;
  onClearContext?: () => void;
  onClearSequence?: () => void;
  onSkipStep?: (stepId: ProfileSetupStep) => void;
}) {
  return (
    <ol className="space-y-3" aria-label={PROFILE_WIZARD.stepsOverviewLabel}>
      {steps.map((step) => {
        const isActive = step.id === activeStepId;
        const skipped = step.status === "skipped";
        const done = step.status === "done";
        const copy = getProfileStepCopy(profile, step.id);
        const canSkip =
          isActive &&
          (step.id === "style" ||
            step.id === "context" ||
            step.id === "sequence" ||
            step.id === "bounds") &&
          !step.filled;

        return (
          <li
            key={step.id}
            className={cn(
              "rounded-lg border px-3 py-3 transition-colors",
              isActive
                ? "border-primary/30 bg-primary/[0.04] ring-1 ring-primary/10"
                : "border-border/70 bg-background/80",
            )}
            aria-current={isActive ? "step" : undefined}
          >
            <div className="flex items-start gap-2.5">
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-primary/15 text-primary"
                      : skipped
                        ? "bg-muted text-muted-foreground/50"
                        : "bg-muted text-muted-foreground",
                )}
                aria-hidden
              >
                {done && !isActive ? (
                  <CheckIcon className="size-3" />
                ) : (
                  step.index
                )}
              </span>
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        skipped
                          ? "text-muted-foreground/60 line-through"
                          : "text-foreground",
                      )}
                    >
                      {step.title}
                    </p>
                    {step.required ? (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {PROFILE_WIZARD.tierRequired}
                      </span>
                    ) : step.id !== "ready" ? (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                        {PROFILE_WIZARD.tierOptional}
                      </span>
                    ) : null}
                    {isActive ? (
                      <span className="text-[10px] font-medium text-primary">
                        {PROFILE_WIZARD.currentStepLabel}
                      </span>
                    ) : null}
                  </div>
                  {!skipped ? (
                    <p className="mt-1 text-pretty text-xs leading-5 text-muted-foreground">
                      {copy.hint}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      已跳过，可在对话中随时补充
                    </p>
                  )}
                </div>

                {skipped ? null : (
                  <StepContent
                    step={step.id}
                    profile={profile}
                    editable={editable}
                    onUpdateBound={onUpdateBound}
                    onDeleteBound={onDeleteBound}
                    onUpdateContext={onUpdateContext}
                    onDeleteContext={onDeleteContext}
                    onUpdateSequence={onUpdateSequence}
                    onDeleteSequence={onDeleteSequence}
                    onClearBounds={onClearBounds}
                    onClearContext={onClearContext}
                    onClearSequence={onClearSequence}
                  />
                )}

                {canSkip && onSkipStep ? (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground transition hover:text-foreground"
                    onClick={() => onSkipStep(step.id)}
                  >
                    {PROFILE_WIZARD.skipStep}
                  </button>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StepContent({
  step,
  profile,
  editable,
  onUpdateBound,
  onDeleteBound,
  onUpdateContext,
  onDeleteContext,
  onUpdateSequence,
  onDeleteSequence,
  onClearBounds,
  onClearContext,
  onClearSequence,
}: {
  step: ProfileSetupStep;
  profile: WorkProfile;
  editable: boolean;
  onUpdateBound?: (id: string, spec: string) => void;
  onDeleteBound?: (id: string) => void;
  onUpdateContext?: (id: string, spec: string) => void;
  onDeleteContext?: (id: string) => void;
  onUpdateSequence?: (id: string, spec: string) => void;
  onDeleteSequence?: (id: string) => void;
  onClearBounds?: () => void;
  onClearContext?: () => void;
  onClearSequence?: () => void;
}) {
  const copy = getProfileStepCopy(profile, step);

  if (step === "ready") {
    return (
      <CreativeContextInset>
        <p className="text-sm leading-6 text-foreground">
          {PROFILE_WIZARD.readyBody}
        </p>
      </CreativeContextInset>
    );
  }

  const empty = (
    <GuidedEmpty title={copy.emptyTitle} body={copy.emptyBody} />
  );

  switch (step) {
    case "direction": {
      const hasDirection =
        Boolean(profile.direction.summary.trim()) ||
        Boolean(profile.direction.format) ||
        Boolean(profile.direction.audience?.trim());
      return hasDirection ? (
        <DirectionDisplay profile={profile} />
      ) : (
        empty
      );
    }

    case "style": {
      const hasStyle =
        Boolean(profile.style?.verbal?.trim()) ||
        Boolean(profile.style?.visual?.trim());
      return hasStyle ? <StyleDisplay profile={profile} /> : empty;
    }

    case "context":
      return profile.context.length > 0 ? (
        <SpecList
          items={profile.context}
          editable={editable}
          onUpdate={onUpdateContext}
          onDelete={onDeleteContext}
          onClear={onClearContext}
          clearLabel={PROFILE_WIZARD.clearContext}
          editLabel="修改设定"
          deleteLabel="删除设定"
        />
      ) : (
        empty
      );

    case "sequence":
      return profile.sequence.length > 0 ? (
        <div className="space-y-2">
          {editable && onClearSequence ? (
            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs text-muted-foreground transition hover:text-red-600"
                onClick={onClearSequence}
              >
                {PROFILE_WIZARD.clearSequence}
              </button>
            </div>
          ) : null}
          <CreativeContextList>
            {profile.sequence.map((item, index) => (
              <EditableSpecItem
                key={item.id}
                spec={item.spec}
                heading={
                  item.role
                    ? `${index + 1}. ${mediaModalityLabel(item.role) ?? item.role}`
                    : `${index + 1}.`
                }
                editable={editable}
                editLabel="修改节拍"
                deleteLabel="删除节拍"
                onEdit={(next) => onUpdateSequence?.(item.id, next)}
                onDelete={() => onDeleteSequence?.(item.id)}
              />
            ))}
          </CreativeContextList>
        </div>
      ) : (
        empty
      );

    case "bounds":
      return profile.bounds.length > 0 ? (
        <SpecList
          items={profile.bounds}
          editable={editable}
          onUpdate={onUpdateBound}
          onDelete={onDeleteBound}
          onClear={onClearBounds}
          clearLabel={PROFILE_WIZARD.clearBounds}
          editLabel="修改边界"
          deleteLabel="删除边界"
        />
      ) : (
        empty
      );

    default:
      return empty;
  }
}

const EMPTY_PROFILE = EMPTY_WORK_PROFILE;

export function ProfilePanel({
  profile,
  editable = false,
  compact = false,
  onUpdateBound,
  onDeleteBound,
  onUpdateContext,
  onDeleteContext,
  onUpdateSequence,
  onDeleteSequence,
  onClearBounds,
  onClearContext,
  onClearSequence,
}: {
  profile?: WorkProfile;
  editable?: boolean;
  compact?: boolean;
  onUpdateBound?: (id: string, spec: string) => void;
  onDeleteBound?: (id: string) => void;
  onUpdateContext?: (id: string, spec: string) => void;
  onDeleteContext?: (id: string) => void;
  onUpdateSequence?: (id: string, spec: string) => void;
  onDeleteSequence?: (id: string) => void;
  onClearBounds?: () => void;
  onClearContext?: () => void;
  onClearSequence?: () => void;
}) {
  const normalizedProfile = useMemo(
    () => parseProfileJson(profile ?? EMPTY_PROFILE),
    [profile],
  );
  const [skippedSteps, setSkippedSteps] = useState<ProfileSetupStep[]>([]);

  const setupView = useMemo(
    () => buildProfileSetupView(normalizedProfile, { skippedSteps }),
    [normalizedProfile, skippedSteps],
  );
  const { state, headline, activeStep } = setupView;

  const handleSkip = useCallback((stepId: ProfileSetupStep) => {
    if (
      stepId !== "style" &&
      stepId !== "context" &&
      stepId !== "sequence" &&
      stepId !== "bounds"
    ) {
      return;
    }
    setSkippedSteps((prev) =>
      prev.includes(stepId) ? prev : [...prev, stepId],
    );
  }, []);

  return (
    <CreativeContextSection
      title={PROFILE_WIZARD.title}
      hint={compact ? PROFILE_WIZARD.hint : undefined}
      compact={compact}
    >
      <div className="space-y-4">
        <p className="text-sm font-medium text-foreground">{headline}</p>
        <ProfileStepList
          steps={state.steps}
          profile={normalizedProfile}
          activeStepId={activeStep}
          editable={editable}
          onUpdateBound={onUpdateBound}
          onDeleteBound={onDeleteBound}
          onUpdateContext={onUpdateContext}
          onDeleteContext={onDeleteContext}
          onUpdateSequence={onUpdateSequence}
          onDeleteSequence={onDeleteSequence}
          onClearBounds={onClearBounds}
          onClearContext={onClearContext}
          onClearSequence={onClearSequence}
          onSkipStep={handleSkip}
        />
      </div>
    </CreativeContextSection>
  );
}
