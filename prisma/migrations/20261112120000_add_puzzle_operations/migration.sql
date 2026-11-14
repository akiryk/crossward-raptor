-- Epic 24, 24-S1: additive only. Two columns with constant defaults (no
-- rewrite, no UPDATE, so every row and its updatedAt is preserved) and a new,
-- empty operation log.

-- AlterTable
ALTER TABLE "Puzzle" ADD COLUMN     "resetEpoch" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;
-- CreateTable
CREATE TABLE "PuzzleOperation" (
    "id" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "opId" TEXT NOT NULL,
    "userId" TEXT,
    "clientId" TEXT NOT NULL,
    "epoch" INTEGER NOT NULL,
    "baseVersion" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "code" TEXT,
    "version" INTEGER,
    "operation" JSONB NOT NULL,
    "previous" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PuzzleOperation_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "PuzzleOperation_opId_key" ON "PuzzleOperation"("opId");
-- CreateIndex
CREATE INDEX "PuzzleOperation_puzzleId_createdAt_idx" ON "PuzzleOperation"("puzzleId", "createdAt");
-- CreateIndex
CREATE UNIQUE INDEX "PuzzleOperation_puzzleId_version_key" ON "PuzzleOperation"("puzzleId", "version");
-- AddForeignKey
ALTER TABLE "PuzzleOperation" ADD CONSTRAINT "PuzzleOperation_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "Puzzle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "PuzzleOperation" ADD CONSTRAINT "PuzzleOperation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
