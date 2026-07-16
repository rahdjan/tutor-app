-- AlterTable
ALTER TABLE "topic" ADD COLUMN     "tutorId" TEXT;

-- CreateIndex
CREATE INDEX "topic_tutorId_idx" ON "topic"("tutorId");

-- AddForeignKey
ALTER TABLE "topic" ADD CONSTRAINT "topic_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
