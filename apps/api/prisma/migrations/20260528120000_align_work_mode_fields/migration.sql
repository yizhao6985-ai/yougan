-- Align Work mode values and JSON column names with 灵感 / 大纲 / 创作
ALTER TABLE "Work" RENAME COLUMN "plan" TO "outline";
ALTER TABLE "Work" RENAME COLUMN "output" TO "creation";

UPDATE "Work" SET mode = 'outline' WHERE mode = 'planning';
UPDATE "Work" SET mode = 'creation' WHERE mode = 'assistant';

UPDATE "Work"
SET outline = (
  (outline::jsonb - 'plan_ready' - 'plan_summary')
  || CASE
    WHEN outline::jsonb ? 'plan_ready'
    THEN jsonb_build_object('outline_ready', outline::jsonb->'plan_ready')
    ELSE '{}'::jsonb
  END
  || CASE
    WHEN outline::jsonb ? 'plan_summary'
    THEN jsonb_build_object('outline_summary', outline::jsonb->'plan_summary')
    ELSE '{}'::jsonb
  END
)
WHERE outline::jsonb ? 'plan_ready' OR outline::jsonb ? 'plan_summary';
