import { describe, expect, it } from "vitest";
import { createGrid, withLetter, type Coord, type Grid } from "./grid";
import { recommendedCells } from "./slots";
import { intendedGeometry } from "./puzzle-geometry";

const isActive = (grid: Grid, col: number, row: number) =>
  grid.at(col, row).kind === "active";

/** Every active coord, as "col,row" strings, for set comparison. */
const activeKeys = (grid: Grid): Set<string> => {
  const keys = new Set<string>();
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      if (isActive(grid, col, row)) keys.add(`${col},${row}`);
    }
  }
  return keys;
};

const keysOf = (coords: readonly Coord[]) =>
  new Set(coords.map((c) => `${c.col},${c.row}`));

/** Every lookup in the grid, for detecting mutation. */
const snapshot = (grid: Grid) =>
  Array.from({ length: grid.rows }, (_, row) =>
    Array.from({ length: grid.cols }, (_, col) => grid.at(col, row)),
  );

describe("G1 — what survives the conversion", () => {
  it("keeps lettered cells active", () => {
    let grid = createGrid({ cols: 5, rows: 5 });
    grid = withLetter(grid, { col: 0, row: 0 }, "M");

    expect(isActive(intendedGeometry(grid), 0, 0)).toBe(true);
  });

  it("keeps the empty symmetric counterpart of a lettered cell active", () => {
    let grid = createGrid({ cols: 5, rows: 5 });
    grid = withLetter(grid, { col: 0, row: 0 }, "M");

    // counterpart of (0,0) on a 5x5 is (4,4), still empty
    expect(isActive(intendedGeometry(grid), 4, 4)).toBe(true);
  });

  it("blackens an empty cell that is neither lettered nor a counterpart", () => {
    let grid = createGrid({ cols: 5, rows: 5 });
    grid = withLetter(grid, { col: 0, row: 0 }, "M");

    expect(isActive(intendedGeometry(grid), 2, 1)).toBe(false);
  });

  it("leaves already-black cells black", () => {
    const grid = createGrid({ cols: 5, rows: 5, black: [{ col: 2, row: 2 }] });

    expect(isActive(intendedGeometry(grid), 2, 2)).toBe(false);
  });

  it("blackens everything in a grid with no letters at all", () => {
    expect(activeKeys(intendedGeometry(createGrid({ cols: 5, rows: 5 })))).toEqual(
      new Set(),
    );
  });

  it("keeps a lettered cell active even when its counterpart is black", () => {
    let grid = createGrid({ cols: 5, rows: 5, black: [{ col: 4, row: 4 }] });
    grid = withLetter(grid, { col: 0, row: 0 }, "M");

    const effective = intendedGeometry(grid);
    expect(isActive(effective, 0, 0)).toBe(true);
    expect(isActive(effective, 4, 4)).toBe(false);
  });
});

describe("G2 — the exact active set", () => {
  it("yields precisely the lettered cells and their counterparts", () => {
    let grid = createGrid({ cols: 5, rows: 5 });
    grid = withLetter(grid, { col: 0, row: 0 }, "M");
    grid = withLetter(grid, { col: 1, row: 0 }, "A");

    expect(activeKeys(intendedGeometry(grid))).toEqual(
      keysOf([
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 4, row: 4 },
        { col: 3, row: 4 },
      ]),
    );
  });

  it("handles a center cell, whose counterpart is itself", () => {
    let grid = createGrid({ cols: 5, rows: 5 });
    grid = withLetter(grid, { col: 2, row: 2 }, "X");

    expect(activeKeys(intendedGeometry(grid))).toEqual(
      keysOf([{ col: 2, row: 2 }]),
    );
  });
});

describe("G3 — letters and purity", () => {
  it("preserves the letters of surviving cells", () => {
    let grid = createGrid({ cols: 5, rows: 5 });
    grid = withLetter(grid, { col: 0, row: 0 }, "M");

    const cell = intendedGeometry(grid).at(0, 0);
    expect(cell.kind === "active" && cell.letter).toBe("M");
  });

  it("leaves a surviving counterpart cell empty", () => {
    let grid = createGrid({ cols: 5, rows: 5 });
    grid = withLetter(grid, { col: 0, row: 0 }, "M");

    const cell = intendedGeometry(grid).at(4, 4);
    expect(cell.kind === "active" && cell.letter).toBe(null);
  });

  it("preserves grid dimensions", () => {
    const effective = intendedGeometry(createGrid({ cols: 7, rows: 3 }));

    expect(effective.cols).toBe(7);
    expect(effective.rows).toBe(3);
  });

  it("does not mutate the input grid", () => {
    let grid = createGrid({ cols: 5, rows: 5 });
    grid = withLetter(grid, { col: 0, row: 0 }, "M");
    const before = snapshot(grid);

    intendedGeometry(grid);

    expect(snapshot(grid)).toEqual(before);
  });

  it("returns deep-equal results on repeated calls", () => {
    let grid = createGrid({ cols: 5, rows: 5 });
    grid = withLetter(grid, { col: 0, row: 0 }, "M");

    expect(intendedGeometry(grid)).toEqual(intendedGeometry(grid));
  });
});

describe("G4 — composed with recommendedCells", () => {
  const recommended = (grid: Grid) =>
    new Set(recommendedCells(intendedGeometry(grid)).map((c) => `${c.col},${c.row}`));

  it("flags a two-letter word with nothing blackened after it", () => {
    let grid = createGrid({ cols: 5, rows: 5 });
    grid = withLetter(grid, { col: 0, row: 0 }, "M");
    grid = withLetter(grid, { col: 1, row: 0 }, "A");

    // MA, plus its still-empty counterpart pair at the bottom right.
    expect(recommended(grid)).toEqual(
      keysOf([
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 3, row: 4 },
        { col: 4, row: 4 },
      ]),
    );
  });

  it("does not flag a three-letter word with nothing blackened after it", () => {
    let grid = createGrid({ cols: 5, rows: 5 });
    grid = withLetter(grid, { col: 0, row: 0 }, "C");
    grid = withLetter(grid, { col: 1, row: 0 }, "A");
    grid = withLetter(grid, { col: 2, row: 0 }, "T");

    expect(recommended(grid)).toEqual(new Set());
  });

  it("flags the two-letter down words created by two abutting across words", () => {
    // CAT on row 0 (cols 0-2), DOG on row 1 (cols 1-3). The overlap makes
    // cols 1 and 2 two-letter down words; neither across word is short.
    let grid = createGrid({ cols: 5, rows: 5 });
    grid = withLetter(grid, { col: 0, row: 0 }, "C");
    grid = withLetter(grid, { col: 1, row: 0 }, "A");
    grid = withLetter(grid, { col: 2, row: 0 }, "T");
    grid = withLetter(grid, { col: 1, row: 1 }, "D");
    grid = withLetter(grid, { col: 2, row: 1 }, "O");
    grid = withLetter(grid, { col: 3, row: 1 }, "G");

    const flagged = recommended(grid);

    // the two short down words themselves
    expect(flagged.has("1,0")).toBe(true);
    expect(flagged.has("1,1")).toBe(true);
    expect(flagged.has("2,0")).toBe(true);
    expect(flagged.has("2,1")).toBe(true);
    // and their symmetric mirrors, still empty
    expect(flagged.has("3,3")).toBe(true);
    expect(flagged.has("3,4")).toBe(true);
    expect(flagged.has("2,3")).toBe(true);
    expect(flagged.has("2,4")).toBe(true);
    // the lone C, a length-1 down run, is not a slot at all
    expect(flagged.has("0,0")).toBe(false);
  });
});
