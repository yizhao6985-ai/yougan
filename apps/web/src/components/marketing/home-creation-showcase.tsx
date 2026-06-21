import { PRODUCTION_FORMS, HOME_MEDIA_MODALITIES } from "@/lib/product-capabilities";
import { scene } from "@/lib/scene-styles";
import { HOME } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

export function HomeCreationShowcase() {
  return (
    <div className={cn(scene.surfaceInset, "p-6 sm:p-8")}>
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {HOME.modalitiesLabel}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {HOME_MEDIA_MODALITIES.map((modality) => (
            <span
              key={modality}
              className={cn(scene.pill, "bg-primary/10 font-medium text-primary ring-primary/20")}
            >
              {modality}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {HOME.formsLabel}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRODUCTION_FORMS.map((form) => (
            <span key={form} className={scene.pill}>
              {form}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
