-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "subtasks" JSONB NOT NULL DEFAULT '[]';
