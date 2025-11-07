-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "processingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "processingStartedAt" TIMESTAMP(3),
ADD COLUMN     "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Game_processingStatus_idx" ON "Game"("processingStatus");
