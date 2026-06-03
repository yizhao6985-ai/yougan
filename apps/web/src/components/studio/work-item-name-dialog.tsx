import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

function WorkItemNameForm({
  initialName,
  placeholder,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialName: string;
  placeholder?: string;
  submitLabel: string;
  onSubmit: (name: string) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Input
        autoFocus
        value={name}
        placeholder={placeholder}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") void handleSubmit();
        }}
      />
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={onCancel}
        >
          取消
        </Button>
        <Button
          type="button"
          disabled={submitting || !name.trim()}
          onClick={() => void handleSubmit()}
        >
          {submitting ? "保存中…" : submitLabel}
        </Button>
      </DialogFooter>
    </>
  );
}

export function WorkItemNameDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  initialName = "",
  submitLabel = "确定",
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  placeholder?: string;
  initialName?: string;
  submitLabel?: string;
  onSubmit: (name: string) => void | Promise<void>;
}) {
  const handleSubmit = async (name: string) => {
    await onSubmit(name);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {open ? (
          <WorkItemNameForm
            key={`${title}:${initialName}`}
            initialName={initialName}
            placeholder={placeholder}
            submitLabel={submitLabel}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
