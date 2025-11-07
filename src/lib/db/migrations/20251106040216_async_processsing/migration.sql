-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Upload" ADD COLUMN     "blobStorageKey" TEXT,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "processingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "processingStartedAt" TIMESTAMP(3),
ADD COLUMN     "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "vectorCount" INTEGER;

-- CreateIndex
CREATE INDEX "Upload_processingStatus_idx" ON "Upload"("processingStatus");
