import { YouganStreamProvider } from "@/components/studio/yougan-stream-provider";
import { WorksSettingsPanel } from "@/components/settings/works-settings-panel";

export function SettingsWorksPage() {
  return (
    <YouganStreamProvider>
      <WorksSettingsPanel />
    </YouganStreamProvider>
  );
}
