-- AlterTable: admin flag + user settings (prefs sync)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "settings" JSONB NOT NULL DEFAULT '{}';

-- AlterTable: track when tasks were actually completed
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);

-- Backfill completedAt for existing done tasks
UPDATE "Task" SET "completedAt" = "createdAt" WHERE "status" = 'done' AND "completedAt" IS NULL;

-- AlterTable: calendar-day key for habit logs (one check-in per habit per day)
ALTER TABLE "HabitLog" ADD COLUMN IF NOT EXISTS "day" TEXT;

UPDATE "HabitLog"
SET "day" = to_char(("date" AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD')
WHERE "day" IS NULL OR "day" = '';

-- Deduplicate same habit+day before unique index (keep earliest)
DELETE FROM "HabitLog" a
USING "HabitLog" b
WHERE a."habitId" = b."habitId"
  AND a."day" = b."day"
  AND a."id" > b."id";

ALTER TABLE "HabitLog" ALTER COLUMN "day" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "HabitLog_habitId_day_key" ON "HabitLog"("habitId", "day");

-- CreateTable: Feedback (was in schema but missing from migrations)
CREATE TABLE IF NOT EXISTS "Feedback" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Feedback_userId_fkey'
  ) THEN
    ALTER TABLE "Feedback"
      ADD CONSTRAINT "Feedback_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
