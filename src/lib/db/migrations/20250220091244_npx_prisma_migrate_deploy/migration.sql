/*
  Warnings:

  - You are about to drop the column `isCompleted1` on the `Upload` table. All the data in the column will be lost.
  - You are about to drop the column `isCompleted2` on the `Upload` table. All the data in the column will be lost.
  - You are about to drop the column `isCompleted3` on the `Upload` table. All the data in the column will be lost.
  - You are about to drop the column `isCompleted4` on the `Upload` table. All the data in the column will be lost.
  - You are about to drop the column `isCompleted5` on the `Upload` table. All the data in the column will be lost.
  - Added the required column `uploadId` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Game_userId_idx";

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "uploadId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Upload" DROP COLUMN "isCompleted1",
DROP COLUMN "isCompleted2",
DROP COLUMN "isCompleted3",
DROP COLUMN "isCompleted4",
DROP COLUMN "isCompleted5",
ADD COLUMN     "isCompleted" JSONB;

-- CreateIndex
CREATE INDEX "Game_userId_uploadId_idx" ON "Game"("userId", "uploadId");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
