-- AlterTable
ALTER TABLE "User" ADD COLUMN "googleAccessToken" TEXT;
ALTER TABLE "User" ADD COLUMN "googleRefreshToken" TEXT;
ALTER TABLE "User" ADD COLUMN "googleTokenExpiry" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "googleClassroomUserId" TEXT;
ALTER TABLE "User" ADD COLUMN "googleEmail" TEXT;

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subjectId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "googleAssignmentId" TEXT,
    "googleCourseId" TEXT,
    "dueDate" TIMESTAMP(3),
    "dueTime" TEXT,
    "maxMarks" DOUBLE PRECISION,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submissionStatus" TEXT,
    "attachments" TEXT,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleCourseMapping" (
    "id" TEXT NOT NULL,
    "googleCourseId" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleCourseMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_googleAssignmentId_key" ON "Assignment"("googleAssignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleCourseMapping_googleCourseId_key" ON "GoogleCourseMapping"("googleCourseId");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleCourseMapping" ADD CONSTRAINT "GoogleCourseMapping_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
