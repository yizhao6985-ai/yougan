import { Outlet } from "react-router-dom";

import { SiteHeader } from "@/components/site-header";
import {
  YouganStreamProvider,
} from "@/components/studio/yougan-stream-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function StudioLayout() {
  return (
    <TooltipProvider delayDuration={300}>
      <YouganStreamProvider>
        <div className="flex h-screen flex-col overflow-hidden bg-background">
          <SiteHeader />
          <div className="min-h-0 flex-1 overflow-hidden">
            <Outlet />
          </div>
        </div>
      </YouganStreamProvider>
    </TooltipProvider>
  );
}
