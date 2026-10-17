BEGIN;

-- Keep the validated legacy set stable through backfill and requiredness.
LOCK TABLE "Puzzle" IN ACCESS EXCLUSIVE MODE;

DO $$
DECLARE
  builder_id TEXT := current_setting('crossward.legacy_builder_id', true);
  supplied_ids TEXT := current_setting('crossward.legacy_puzzle_ids', true);
  puzzle_ids JSONB;
BEGIN
  IF EXISTS (SELECT 1 FROM "Puzzle") THEN
    IF builder_id IS NULL OR btrim(builder_id) = ''
       OR supplied_ids IS NULL OR btrim(supplied_ids) = '' THEN
      RAISE EXCEPTION 'Nonempty Puzzle requires an explicit legacy builder and exact puzzle ID JSON array';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "user" WHERE id = builder_id) THEN
      RAISE EXCEPTION 'The explicit legacy builder does not exist';
    END IF;

    puzzle_ids := supplied_ids::JSONB;
    IF jsonb_typeof(puzzle_ids) IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Legacy puzzle IDs must be a JSON array';
    END IF;
    IF EXISTS (SELECT 1 FROM jsonb_array_elements(puzzle_ids) AS item
               WHERE jsonb_typeof(item) IS DISTINCT FROM 'string') THEN
      RAISE EXCEPTION 'Every legacy puzzle ID must be a string';
    END IF;
    IF (SELECT count(*) FROM jsonb_array_elements_text(puzzle_ids)) <>
       (SELECT count(DISTINCT value) FROM jsonb_array_elements_text(puzzle_ids)) THEN
      RAISE EXCEPTION 'Legacy puzzle IDs must be distinct';
    END IF;
    IF EXISTS (SELECT id FROM "Puzzle"
               EXCEPT SELECT value FROM jsonb_array_elements_text(puzzle_ids))
       OR EXISTS (SELECT value FROM jsonb_array_elements_text(puzzle_ids)
                  EXCEPT SELECT id FROM "Puzzle") THEN
      RAISE EXCEPTION 'Legacy puzzle IDs do not exactly match the existing puzzles';
    END IF;
  END IF;
END $$;

ALTER TABLE "Puzzle" ADD COLUMN "builderId" TEXT;

-- SQL deliberately changes only the new column, preserving updatedAt.
UPDATE "Puzzle"
SET "builderId" = current_setting('crossward.legacy_builder_id', true);

ALTER TABLE "Puzzle" ALTER COLUMN "builderId" SET NOT NULL;
ALTER TABLE "Puzzle" ADD CONSTRAINT "Puzzle_builderId_fkey"
  FOREIGN KEY ("builderId") REFERENCES "user"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
