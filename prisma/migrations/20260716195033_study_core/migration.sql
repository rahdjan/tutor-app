-- CreateEnum
CREATE TYPE "Goal" AS ENUM ('EGE_PROF', 'EGE_BASE', 'OGE', 'OTHER');

-- CreateEnum
CREATE TYPE "Exam" AS ENUM ('EGE_PROF', 'EGE_BASE', 'OGE');

-- CreateEnum
CREATE TYPE "AnswerType" AS ENUM ('SHORT', 'DETAILED');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'MASTERED');

-- CreateTable
CREATE TABLE "student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" INTEGER,
    "goal" "Goal" NOT NULL DEFAULT 'OTHER',
    "examDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tutorId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "exam" "Exam",
    "section" TEXT,
    "kimNumber" INTEGER,
    "fipiCode" TEXT,
    "order" INTEGER,
    "parentId" TEXT,

    CONSTRAINT "topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task" (
    "id" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "answerType" "AnswerType" NOT NULL DEFAULT 'SHORT',
    "answer" TEXT,
    "solution" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "source" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "topicId" TEXT,
    "tutorId" TEXT NOT NULL,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worksheet" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tutorId" TEXT NOT NULL,

    CONSTRAINT "worksheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worksheet_task" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "worksheetId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,

    CONSTRAINT "worksheet_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Программа подготовки',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "study_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_item" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "plannedFor" TIMESTAMP(3),
    "planId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "plan_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment" (
    "id" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "worksheetId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,

    CONSTRAINT "assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "assignmentId" TEXT NOT NULL,

    CONSTRAINT "submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer_entry" (
    "id" TEXT NOT NULL,
    "answerText" TEXT,
    "fileUrl" TEXT,
    "autoScore" INTEGER,
    "manualScore" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submissionId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,

    CONSTRAINT "answer_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson" (
    "id" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 60,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tutorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lessonsCount" INTEGER,
    "note" TEXT,
    "tutorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_userId_key" ON "student"("userId");

-- CreateIndex
CREATE INDEX "student_tutorId_idx" ON "student"("tutorId");

-- CreateIndex
CREATE INDEX "topic_exam_kimNumber_idx" ON "topic"("exam", "kimNumber");

-- CreateIndex
CREATE INDEX "task_tutorId_idx" ON "task"("tutorId");

-- CreateIndex
CREATE INDEX "task_topicId_idx" ON "task"("topicId");

-- CreateIndex
CREATE INDEX "worksheet_tutorId_idx" ON "worksheet"("tutorId");

-- CreateIndex
CREATE INDEX "worksheet_task_worksheetId_idx" ON "worksheet_task"("worksheetId");

-- CreateIndex
CREATE UNIQUE INDEX "worksheet_task_worksheetId_taskId_key" ON "worksheet_task"("worksheetId", "taskId");

-- CreateIndex
CREATE INDEX "study_plan_studentId_idx" ON "study_plan"("studentId");

-- CreateIndex
CREATE INDEX "plan_item_planId_idx" ON "plan_item"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "plan_item_planId_topicId_key" ON "plan_item"("planId", "topicId");

-- CreateIndex
CREATE INDEX "assignment_tutorId_idx" ON "assignment"("tutorId");

-- CreateIndex
CREATE INDEX "assignment_studentId_idx" ON "assignment"("studentId");

-- CreateIndex
CREATE INDEX "submission_assignmentId_idx" ON "submission"("assignmentId");

-- CreateIndex
CREATE INDEX "answer_entry_submissionId_idx" ON "answer_entry"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "answer_entry_submissionId_taskId_key" ON "answer_entry"("submissionId", "taskId");

-- CreateIndex
CREATE INDEX "lesson_tutorId_idx" ON "lesson"("tutorId");

-- CreateIndex
CREATE INDEX "lesson_studentId_idx" ON "lesson"("studentId");

-- CreateIndex
CREATE INDEX "payment_tutorId_idx" ON "payment"("tutorId");

-- CreateIndex
CREATE INDEX "payment_studentId_idx" ON "payment"("studentId");

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic" ADD CONSTRAINT "topic_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worksheet" ADD CONSTRAINT "worksheet_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worksheet_task" ADD CONSTRAINT "worksheet_task_worksheetId_fkey" FOREIGN KEY ("worksheetId") REFERENCES "worksheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worksheet_task" ADD CONSTRAINT "worksheet_task_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan" ADD CONSTRAINT "study_plan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_item" ADD CONSTRAINT "plan_item_planId_fkey" FOREIGN KEY ("planId") REFERENCES "study_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_item" ADD CONSTRAINT "plan_item_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_worksheetId_fkey" FOREIGN KEY ("worksheetId") REFERENCES "worksheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_entry" ADD CONSTRAINT "answer_entry_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_entry" ADD CONSTRAINT "answer_entry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
