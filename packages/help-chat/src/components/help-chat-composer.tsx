import { CornerDownLeftIcon, Loader2Icon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { helpChatStyles } from "../lib/help-chat-styles";

type HelpChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => Promise<boolean> | boolean;
  disabled?: boolean;
  placeholder?: string;
  sendLabel?: string;
  autoFocus?: boolean;
};

export function HelpChatComposer({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "输入你的问题…",
  sendLabel = "发送",
  autoFocus = false,
}: HelpChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!autoFocus) return;
    textareaRef.current?.focus();
  }, [autoFocus]);

  const submit = useCallback(async () => {
    if (disabled || !value.trim()) return;
    const sent = await onSubmit(value);
    if (sent) onChange("");
  }, [disabled, onChange, onSubmit, value]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await submit();
    },
    [submit],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
        return;
      }
      event.preventDefault();
      void submit();
    },
    [submit],
  );

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className={helpChatStyles.composerWrap}>
      <div aria-hidden className={helpChatStyles.composerGradient} />
      <div className={helpChatStyles.composerCard}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={placeholder}
          className={helpChatStyles.composerInput}
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          aria-label={sendLabel}
          className={helpChatStyles.composerSubmit}
        >
          {disabled ? (
            <Loader2Icon
              className="size-4 animate-spin"
              role="status"
              aria-label="Loading"
            />
          ) : (
            <CornerDownLeftIcon className="size-4" aria-hidden />
          )}
        </button>
      </div>
      <p className={helpChatStyles.composerHint}>Enter 发送 · Shift+Enter 换行</p>
    </form>
  );
}
