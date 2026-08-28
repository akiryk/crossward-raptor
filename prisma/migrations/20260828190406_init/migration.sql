-- CreateTable
CREATE TABLE "Puzzle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled Puzzle',
    "grid" JSONB NOT NULL,
    "hints" JSONB NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'grid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Puzzle_pkey" PRIMARY KEY ("id")
);
