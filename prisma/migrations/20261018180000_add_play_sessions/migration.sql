CREATE TABLE "PlaySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "entries" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PlaySession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlaySession_userId_puzzleId_key" ON "PlaySession"("userId", "puzzleId");

ALTER TABLE "PlaySession" ADD CONSTRAINT "PlaySession_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlaySession" ADD CONSTRAINT "PlaySession_puzzleId_fkey"
    FOREIGN KEY ("puzzleId") REFERENCES "Puzzle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
