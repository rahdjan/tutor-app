-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('SCHEDULED', 'DONE', 'CANCELLED');

-- AlterTable
ALTER TABLE "lesson" ADD COLUMN     "status" "LessonStatus" NOT NULL DEFAULT 'SCHEDULED';
