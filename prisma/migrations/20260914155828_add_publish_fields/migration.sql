-- AlterTable
ALTER TABLE "Puzzle" ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "visibility" TEXT NOT NULL DEFAULT 'private';
