-- CreateTable
CREATE TABLE "PuzzlePresence" (
    "puzzleId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PuzzlePresence_pkey" PRIMARY KEY ("puzzleId","clientId")
);

-- CreateIndex
CREATE INDEX "PuzzlePresence_puzzleId_expiresAt_idx" ON "PuzzlePresence"("puzzleId", "expiresAt");

-- AddForeignKey
ALTER TABLE "PuzzlePresence" ADD CONSTRAINT "PuzzlePresence_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "Puzzle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuzzlePresence" ADD CONSTRAINT "PuzzlePresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
