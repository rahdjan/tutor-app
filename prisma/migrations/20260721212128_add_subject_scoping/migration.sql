-- CreateEnum
CREATE TYPE "Subject" AS ENUM ('MATH', 'ENGLISH');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Exam" ADD VALUE 'EGE_ENG';
ALTER TYPE "Exam" ADD VALUE 'OGE_ENG';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Goal" ADD VALUE 'EGE_ENG';
ALTER TYPE "Goal" ADD VALUE 'OGE_ENG';

-- AlterTable
ALTER TABLE "topic" ADD COLUMN     "subject" "Subject" NOT NULL DEFAULT 'MATH';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "subject" "Subject" NOT NULL DEFAULT 'MATH';

-- CreateIndex
CREATE INDEX "topic_subject_idx" ON "topic"("subject");
