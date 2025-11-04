-- AlterTable
ALTER TABLE "Upload" ADD COLUMN     "likedBy" TEXT[] DEFAULT ARRAY[]::TEXT[];
