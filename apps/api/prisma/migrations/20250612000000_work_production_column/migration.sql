-- Merge productionPlan + preview into production JSON column
ALTER TABLE "Work" ADD COLUMN "production" JSONB NOT NULL DEFAULT '{}';

UPDATE "Work"
SET "production" = COALESCE("productionPlan", '{}'::jsonb) || jsonb_build_object(
  'preview',
  CASE
    WHEN "preview" IS NULL THEN NULL
    ELSE "preview"
  END
);

ALTER TABLE "Work" DROP COLUMN "productionPlan";
ALTER TABLE "Work" DROP COLUMN "preview";
