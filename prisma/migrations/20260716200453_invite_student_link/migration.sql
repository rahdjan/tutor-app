-- AlterTable
ALTER TABLE "invite" ADD COLUMN     "studentId" TEXT;

-- AddForeignKey
ALTER TABLE "invite" ADD CONSTRAINT "invite_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
