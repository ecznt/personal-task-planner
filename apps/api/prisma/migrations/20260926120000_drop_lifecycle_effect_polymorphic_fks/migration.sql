-- Drop the polymorphic foreign keys on lifecycle_effects.affectedId.
-- Each constraint referenced the same column against areas, projects and tasks
-- simultaneously, so every INSERT failed one of them (tasks against areas,
-- projects against areas, etc.). The relations are not used by any query; the
-- table is an audit log. Effects are cleaned up explicitly on purge.

ALTER TABLE "lifecycle_effects" DROP CONSTRAINT "lifecycle_effects_affected_area_fkey";
ALTER TABLE "lifecycle_effects" DROP CONSTRAINT "lifecycle_effects_affected_project_fkey";
ALTER TABLE "lifecycle_effects" DROP CONSTRAINT "lifecycle_effects_affected_task_fkey";