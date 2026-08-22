import { describe, it, expect } from "vitest";
import type { Coord, Grid } from "./grid";
import { createGrid } from "./grid";
import { extractSlots } from "./slots";
import { numberGrid, slotsWithNumbers } from "./numbering";

const key = (c: Coord): string => `${c.col},${c.row}`;

// Re-skins every active cell with a letter, leaving geometry alone.
const withLetters = (grid: Grid, letter = "A"): Grid => ({
  cols: grid.cols,
  rows: grid.rows,
  at(col: number, row: number) {
    const cell = grid.at(col, row);
    return cell.kind === "active" ? { kind: "active", letter } : cell;
  },
});

// 15x15 with a single black cell at (10,0), splitting row 0 into runs of 10 and 4.
const splitRow0 = (): Grid =>
  createGrid({ cols: 15, rows: 15, black: [{ col: 10, row: 0 }] });

const allBlack3x3 = (): Grid => {
  const black: Coord[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      black.push({ col, row });
    }
  }
  return createGrid({ cols: 3, rows: 3, black });
};

// --- C1: numberGrid ---
describe("C1 numberGrid", () => {
  it("numbers (0,0) as 1 on a fully active grid, appearing once despite starting two slots", () => {
    const entries = numberGrid(createGrid({ cols: 15, rows: 15 }));

    expect(entries[0]).toEqual({ coord: { col: 0, row: 0 }, number: 1 });
    expect(
      entries.filter((e) => e.coord.col === 0 && e.coord.row === 0),
    ).toHaveLength(1);
  });

  it("numbers a down-only start: (0,0) with (1,0) black", () => {
    const entries = numberGrid(
      createGrid({ cols: 15, rows: 15, black: [{ col: 1, row: 0 }] }),
    );

    expect(entries[0]).toEqual({ coord: { col: 0, row: 0 }, number: 1 });
  });

  it("orders all start cells in reading order, so (11,0) is 11 and not 2", () => {
    expect(numberGrid(splitRow0()).slice(0, 11)).toEqual([
      { coord: { col: 0, row: 0 }, number: 1 },
      { coord: { col: 1, row: 0 }, number: 2 },
      { coord: { col: 2, row: 0 }, number: 3 },
      { coord: { col: 3, row: 0 }, number: 4 },
      { coord: { col: 4, row: 0 }, number: 5 },
      { coord: { col: 5, row: 0 }, number: 6 },
      { coord: { col: 6, row: 0 }, number: 7 },
      { coord: { col: 7, row: 0 }, number: 8 },
      { coord: { col: 8, row: 0 }, number: 9 },
      { coord: { col: 9, row: 0 }, number: 10 },
      { coord: { col: 11, row: 0 }, number: 11 },
    ]);
  });

  it("carries reading order across the row boundary: (0,1) is 15, (10,1) is 16", () => {
    const entries = numberGrid(splitRow0());

    expect(entries[14]).toEqual({ coord: { col: 0, row: 1 }, number: 15 });
    expect(entries[15]).toEqual({ coord: { col: 10, row: 1 }, number: 16 });
  });

  it("numbers strictly increase by exactly 1 with no gaps", () => {
    const entries = numberGrid(splitRow0());

    expect(entries.map((e) => e.number)).toEqual(
      Array.from({ length: entries.length }, (_, i) => i + 1),
    );
  });

  it("has one entry per distinct start cell in extractSlots output", () => {
    const grid = splitRow0();
    const distinct = new Set(extractSlots(grid).map((s) => key(s.start)));

    expect(numberGrid(grid)).toHaveLength(distinct.size);
  });
});

// --- C2: slotsWithNumbers ---
describe("C2 slotsWithNumbers", () => {
  it("returns one numbered slot per slot, none added or dropped", () => {
    const grid = splitRow0();

    expect(slotsWithNumbers(grid)).toHaveLength(extractSlots(grid).length);
  });

  it("gives the across slot starting (0,0) number 1", () => {
    const first = slotsWithNumbers(splitRow0())[0];

    expect(first.orientation).toBe("across");
    expect(first.start).toEqual({ col: 0, row: 0 });
    expect(first.number).toBe(1);
  });

  it("gives an across and a down slot starting at the same coord the same number", () => {
    const slots = slotsWithNumbers(splitRow0());
    const at110 = slots.filter((s) => s.start.col === 11 && s.start.row === 0);

    expect(at110).toHaveLength(2);
    expect(at110[0].orientation).toBe("across");
    expect(at110[1].orientation).toBe("down");
    expect(at110[0].number).toBe(at110[1].number);
    expect(at110[0].number).toBe(11);
  });

  it("preserves extractSlots order and every field other than number", () => {
    const grid = splitRow0();
    const stripped = slotsWithNumbers(grid).map((s) => ({
      orientation: s.orientation,
      start: s.start,
      cells: s.cells,
      length: s.length,
    }));

    expect(stripped).toEqual(extractSlots(grid));
  });

  it("agrees with numberGrid on every slot start", () => {
    const grid = splitRow0();
    const byCoord = new Map(
      numberGrid(grid).map((e) => [key(e.coord), e.number]),
    );

    for (const slot of slotsWithNumbers(grid)) {
      expect(slot.number).toBe(byCoord.get(key(slot.start)));
    }
  });
});

// --- C3: purity and letter-independence ---
describe("C3 purity and letter-independence", () => {
  it("called twice on the same grid -> deep-equal results", () => {
    const grid = splitRow0();

    expect(numberGrid(grid)).toEqual(numberGrid(grid));
    expect(slotsWithNumbers(grid)).toEqual(slotsWithNumbers(grid));
  });

  it("same black pattern with letters present -> identical numbering", () => {
    const plain = splitRow0();
    const lettered = withLetters(plain);

    expect(numberGrid(lettered)).toEqual(numberGrid(plain));
    expect(slotsWithNumbers(lettered)).toEqual(slotsWithNumbers(plain));
  });
});

// --- C4: boundary ---
describe("C4 boundary", () => {
  it("fully black grid -> both return empty arrays", () => {
    const grid = allBlack3x3();

    expect(numberGrid(grid)).toEqual([]);
    expect(slotsWithNumbers(grid)).toEqual([]);
  });
});
