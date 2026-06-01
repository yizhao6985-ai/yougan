import { FolderPlusIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STUDIO } from "@/lib/site-copy";

export function WorksCreateMenu({
  onCreateWork,
  onCreateGroup,
  align = "end",
}: {
  onCreateWork: () => void;
  onCreateGroup: () => void;
  align?: "start" | "end" | "center";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0 gap-1.5"
        >
          <PlusIcon className="size-3.5" />
          {STUDIO.createMenuLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuItem onClick={onCreateWork}>
          <PlusIcon className="size-4" />
          {STUDIO.newWork}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCreateGroup}>
          <FolderPlusIcon className="size-4" />
          {STUDIO.newGroup}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
