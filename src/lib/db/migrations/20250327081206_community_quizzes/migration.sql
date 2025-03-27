-- CreateTable
CREATE TABLE "Communityquiz" (
    "id" TEXT NOT NULL,
    "wallet" TEXT,
    "userId" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "options" JSONB,
    "timeStarted" TIMESTAMP(3) NOT NULL,
    "isCompleted" JSONB,
    "timeEnded" TIMESTAMP(3),

    CONSTRAINT "Communityquiz_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Communityquiz_userId_uploadId_idx" ON "Communityquiz"("userId", "uploadId");

-- AddForeignKey
ALTER TABLE "Communityquiz" ADD CONSTRAINT "Communityquiz_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communityquiz" ADD CONSTRAINT "Communityquiz_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
