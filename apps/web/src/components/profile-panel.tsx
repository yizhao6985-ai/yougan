import { useCallback, useMemo, useState } from "react";
import { CheckIcon, PencilIcon, Trash2Icon } from "lucide-react";

import {
  getProfileStepCopy,
  type ProfileSetupStep,
} from "@yougan/domain";

import {
  CreativeContextInset,
  CreativeContextList,
  CreativeContextListItem,
  CreativeContextSection,
  formatContextTime,
} from "@/components/studio/creative-context/shared";
import { cn } from "@/lib/utils";
import { PROFILE_WIZARD } from "@/lib/site-copy";
import { buildProfileSetupView } from "@/lib/profile-setup-display";
import { formatLabel } from "@/lib/discover-taxonomy";
import { platformLabel } from "@/lib/platform-labels";
import type { WorkProfile, ProfileSettingKind } from "@/lib/types";

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

function EditableTextItem({
  description,
  heading,
  confirmedAt,
  editable,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: {
  description: string;
  heading?: string;
  confirmedAt: string;
  editable: boolean;
  onEdit: (next: string) => void;
  onDelete: () => void;
  editLabel: string;
  deleteLabel: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(description);

  const save = () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === description.trim()) {
      setDraft(description);
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
                setDraft(description);
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
          <p className="text-pretty leading-6">{description}</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground/70">
              {formatContextTime(confirmedAt)}
            </p>
            {editable ? (
              <div className="flex items-center gap-1">
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
          </div>
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

function formatDeliveryRows(profile: WorkProfile) {
  const { delivery } = profile;
  const { params } = delivery;
  const rows: Array<{ label: string; value: string }> = [];

  if (delivery.format) {
    rows.push({
      label: "体裁",
      value: formatLabel(delivery.format) ?? delivery.format,
    });
  }
  if (delivery.platform) {
    rows.push({ label: "平台", value: platformLabel(delivery.platform) });
  }

  if (params.kind === "text") {
    const { min, max } = params.word_count ?? {};
    if (min != null || max != null) {
      const parts = [
        min != null ? `最少 ${min} 字` : null,
        max != null ? `最多 ${max} 字` : null,
      ].filter(Boolean);
      rows.push({ label: "字数", value: parts.join("，") });
    }
    if (params.emoji_level) {
      const labels = { none: "不用", light: "少量", heavy: "较多" } as const;
      rows.push({ label: "Emoji", value: labels[params.emoji_level] });
    }
    if (params.aspect_ratio) rows.push({ label: "画幅", value: params.aspect_ratio });
  }

  if (params.kind === "illustration") {
    if (params.aspect_ratio) rows.push({ label: "画幅", value: params.aspect_ratio });
    if (params.image_count != null) {
      rows.push({ label: "图片数", value: String(params.image_count) });
    }
    if (params.negative_hints?.length) {
      rows.push({ label: "负面提示", value: params.negative_hints.join("、") });
    }
  }

  if (params.kind === "video") {
    if (params.duration_sec != null) {
      rows.push({ label: "时长", value: `${params.duration_sec} 秒` });
    }
    if (params.aspect_ratio) rows.push({ label: "画幅", value: params.aspect_ratio });
    if (params.pacing) rows.push({ label: "节奏", value: params.pacing });
  }

  if (params.kind === "audio") {
    if (params.duration_sec != null) {
      rows.push({ label: "时长", value: `${params.duration_sec} 秒` });
    }
    if (params.segment_count != null) {
      rows.push({ label: "段落数", value: String(params.segment_count) });
    }
  }

  return rows;
}

function formatExpressionRows(profile: WorkProfile) {
  const { expression } = profile;
  const rows: Array<{ label: string; value: string }> = [];
  if (expression.audience) rows.push({ label: "受众", value: expression.audience });
  if (expression.verbal?.trim()) {
    rows.push({ label: "文字风格", value: expression.verbal.trim() });
  }
  if (expression.visual?.trim()) {
    rows.push({ label: "画面方向", value: expression.visual.trim() });
  }
  return rows;
}

function formatSettingHeading(item: {
  kind: ProfileSettingKind;
  title?: string | null;
}) {
  const kindLabel = PROFILE_WIZARD.settingKindLabels[item.kind] ?? item.kind;
  const name = item.title?.trim();
  return name ? `${kindLabel} · ${name}` : kindLabel;
}

function ProfileStepList({
  steps,
  profile,
  activeStepId,
  editable,
  onUpdateConstraint,
  onDeleteConstraint,
  onUpdateSetting,
  onDeleteSetting,
  onUpdateSegment,
  onDeleteSegment,
  onClearConstraints,
  onClearSettings,
  onClearSegments,
  onSkipStep,
}: {
  steps: ReturnType<typeof buildProfileSetupView>["state"]["steps"];
  profile: WorkProfile;
  activeStepId: ProfileSetupStep;
  editable: boolean;
  onUpdateConstraint?: (id: string, description: string) => void;
  onDeleteConstraint?: (id: string) => void;
  onUpdateSetting?: (id: string, description: string) => void;
  onDeleteSetting?: (id: string) => void;
  onUpdateSegment?: (id: string, description: string) => void;
  onDeleteSegment?: (id: string) => void;
  onClearConstraints?: () => void;
  onClearSettings?: () => void;
  onClearSegments?: () => void;
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
          (step.id === "expression" ||
            step.id === "structure" ||
            step.id === "constraints") &&
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
                <div className="flex flex-wrap items-start justify-between gap-2">
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
                </div>

                {skipped ? null : (
                  <div
                    className={cn(
                      !isActive && !done && "opacity-90",
                    )}
                  >
                    <StepContent
                      step={step.id}
                      profile={profile}
                      editable={editable}
                      onUpdateConstraint={onUpdateConstraint}
                      onDeleteConstraint={onDeleteConstraint}
                      onUpdateSetting={onUpdateSetting}
                      onDeleteSetting={onDeleteSetting}
                      onUpdateSegment={onUpdateSegment}
                      onDeleteSegment={onDeleteSegment}
                      onClearConstraints={onClearConstraints}
                      onClearSettings={onClearSettings}
                      onClearSegments={onClearSegments}
                    />
                  </div>
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
  onUpdateConstraint,
  onDeleteConstraint,
  onUpdateSetting,
  onDeleteSetting,
  onUpdateSegment,
  onDeleteSegment,
  onClearConstraints,
  onClearSettings,
  onClearSegments,
}: {
  step: ProfileSetupStep;
  profile: WorkProfile;
  editable: boolean;
  onUpdateConstraint?: (id: string, description: string) => void;
  onDeleteConstraint?: (id: string) => void;
  onUpdateSetting?: (id: string, description: string) => void;
  onDeleteSetting?: (id: string) => void;
  onUpdateSegment?: (id: string, description: string) => void;
  onDeleteSegment?: (id: string) => void;
  onClearConstraints?: () => void;
  onClearSettings?: () => void;
  onClearSegments?: () => void;
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
    case "intent": {
      const intentText = profile.intent.summary.trim();
      return intentText ? (
        <CreativeContextInset>
          <p className="text-pretty leading-6">{intentText}</p>
        </CreativeContextInset>
      ) : (
        empty
      );
    }

    case "delivery":
      return formatDeliveryRows(profile).length > 0 ? (
        <SpecRows rows={formatDeliveryRows(profile)} />
      ) : (
        empty
      );

    case "expression":
      return formatExpressionRows(profile).length > 0 ? (
        <SpecRows rows={formatExpressionRows(profile)} />
      ) : (
        empty
      );

    case "structure":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {profile.structure.settings.length > 0
                  ? `${PROFILE_WIZARD.settingsLabel} · ${profile.structure.settings.length}`
                  : PROFILE_WIZARD.settingsLabel}
              </p>
              {editable && profile.structure.settings.length > 0 ? (
                <button
                  type="button"
                  className="text-xs text-muted-foreground transition hover:text-red-600"
                  onClick={onClearSettings}
                >
                  {PROFILE_WIZARD.clearSettings}
                </button>
              ) : null}
            </div>
            {profile.structure.settings.length > 0 ? (
              <CreativeContextList>
                {profile.structure.settings.map((item) => (
                  <EditableTextItem
                    key={item.id}
                    description={item.description}
                    heading={formatSettingHeading(item)}
                    confirmedAt={item.confirmed_at}
                    editable={editable}
                    editLabel="修改创作设定"
                    deleteLabel="删除创作设定"
                    onEdit={(next) => onUpdateSetting?.(item.id, next)}
                    onDelete={() => onDeleteSetting?.(item.id)}
                  />
                ))}
              </CreativeContextList>
            ) : (
              <GuidedEmpty
                title={PROFILE_WIZARD.settingsEmptyTitle}
                body={PROFILE_WIZARD.settingsEmptyBody}
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {profile.structure.segments.length > 0
                  ? `${PROFILE_WIZARD.segmentsLabel} · ${profile.structure.segments.length}`
                  : PROFILE_WIZARD.segmentsLabel}
              </p>
              {editable && profile.structure.segments.length > 0 ? (
                <button
                  type="button"
                  className="text-xs text-muted-foreground transition hover:text-red-600"
                  onClick={onClearSegments}
                >
                  {PROFILE_WIZARD.clearSegments}
                </button>
              ) : null}
            </div>
            {profile.structure.segments.length > 0 ? (
              <CreativeContextList>
                {profile.structure.segments.map((item, index) => (
                  <EditableTextItem
                    key={item.id}
                    description={`${index + 1}. ${item.description}`}
                    confirmedAt={item.confirmed_at}
                    editable={editable}
                    editLabel="修改结构段"
                    deleteLabel="删除结构段"
                    onEdit={(next) =>
                      onUpdateSegment?.(item.id, next.replace(/^\d+\.\s*/, ""))
                    }
                    onDelete={() => onDeleteSegment?.(item.id)}
                  />
                ))}
              </CreativeContextList>
            ) : (
              <GuidedEmpty
                title={PROFILE_WIZARD.segmentsEmptyTitle}
                body={PROFILE_WIZARD.segmentsEmptyBody}
              />
            )}
          </div>
        </div>
      );

    case "constraints":
      return profile.constraints.rules.length > 0 ? (
        <div className="space-y-2">
          {editable ? (
            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs text-muted-foreground transition hover:text-red-600"
                onClick={onClearConstraints}
              >
                {PROFILE_WIZARD.clearConstraints}
              </button>
            </div>
          ) : null}
          <CreativeContextList>
            {profile.constraints.rules.map((item) => (
              <EditableTextItem
                key={item.id}
                description={item.description}
                confirmedAt={item.confirmed_at}
                editable={editable}
                editLabel="修改创作规则"
                deleteLabel="删除创作规则"
                onEdit={(next) => onUpdateConstraint?.(item.id, next)}
                onDelete={() => onDeleteConstraint?.(item.id)}
              />
            ))}
          </CreativeContextList>
        </div>
      ) : (
        empty
      );

    default:
      return empty;
  }
}

const EMPTY_PROFILE: WorkProfile = {
  intent: { summary: "" },
  delivery: {
    format: null,
    modalities: [],
    platform: null,
    category: null,
    params: { kind: "text" },
  },
  expression: {},
  structure: { settings: [], segments: [] },
  constraints: { rules: [] },
};

export function ProfilePanel({
  profile,
  editable = false,
  compact = false,
  onUpdateConstraint,
  onDeleteConstraint,
  onUpdateSetting,
  onDeleteSetting,
  onUpdateSegment,
  onDeleteSegment,
  onClearConstraints,
  onClearSettings,
  onClearSegments,
}: {
  profile?: WorkProfile;
  editable?: boolean;
  compact?: boolean;
  onUpdateConstraint?: (id: string, description: string) => void;
  onDeleteConstraint?: (id: string) => void;
  onUpdateSetting?: (id: string, description: string) => void;
  onDeleteSetting?: (id: string) => void;
  onUpdateSegment?: (id: string, description: string) => void;
  onDeleteSegment?: (id: string) => void;
  onClearConstraints?: () => void;
  onClearSettings?: () => void;
  onClearSegments?: () => void;
}) {
  const data = profile ?? EMPTY_PROFILE;
  const [skippedSteps, setSkippedSteps] = useState<ProfileSetupStep[]>([]);

  const setupView = useMemo(
    () => buildProfileSetupView(data, { skippedSteps }),
    [data, skippedSteps],
  );
  const { state, headline, activeStep } = setupView;

  const handleSkip = useCallback((stepId: ProfileSetupStep) => {
    if (
      stepId !== "expression" &&
      stepId !== "structure" &&
      stepId !== "constraints"
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
          profile={data}
          activeStepId={activeStep}
          editable={editable}
          onUpdateConstraint={onUpdateConstraint}
          onDeleteConstraint={onDeleteConstraint}
          onUpdateSetting={onUpdateSetting}
          onDeleteSetting={onDeleteSetting}
          onUpdateSegment={onUpdateSegment}
          onDeleteSegment={onDeleteSegment}
          onClearConstraints={onClearConstraints}
          onClearSettings={onClearSettings}
          onClearSegments={onClearSegments}
          onSkipStep={handleSkip}
        />
      </div>
    </CreativeContextSection>
  );
}
