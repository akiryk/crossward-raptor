-- CreateTable
CREATE TABLE "PuzzleCollaborator" (
    "puzzleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PuzzleCollaborator_pkey" PRIMARY KEY ("puzzleId","userId")
);

-- CreateTable
CREATE TABLE "PuzzleInvitation" (
    "id" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PuzzleInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PuzzleCollaborator_userId_idx" ON "PuzzleCollaborator"("userId");

-- CreateIndex
CREATE INDEX "PuzzleInvitation_email_idx" ON "PuzzleInvitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PuzzleInvitation_puzzleId_email_key" ON "PuzzleInvitation"("puzzleId", "email");

-- AddForeignKey
ALTER TABLE "PuzzleCollaborator" ADD CONSTRAINT "PuzzleCollaborator_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "Puzzle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuzzleCollaborator" ADD CONSTRAINT "PuzzleCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuzzleInvitation" ADD CONSTRAINT "PuzzleInvitation_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "Puzzle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

