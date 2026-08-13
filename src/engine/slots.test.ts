import { describe, expect, it } from "vitest";
import { createGrid, type Coord, type Grid } from "./grid";
import { extractSlots, type Slot } from "./slots";

const across = (slots: readonly Slot[]): readonly Slot[] =>
  slots.filter((s) => s.orientation === "across");

const down = (slots: readonly Slot[]): readonly Slot[] =>
  slots.filter((s) => s.orientation === "down");

const onRow = (slots: readonly Slot[], row: number): readonly Slot[] =>
  slots.filter((s) => s.start.row === row);

const starts = (slots: readonly Slot[]): readonly Coord[] =>
  slots.map((s) => s.start);

/**
 * Re-skins every active cell of a grid with a letter, leaving geometry alone.
 * Grid is a structural interface, so this needs no support from createGrid —
 * which is what lets B5 assert letter-independence today.
 */
const withLetters = (grid: Grid, letter = "A"): Grid => ({
  cols: grid.cols,
  rows: grid.rows,
  at(col: number, row: number) {
    const cell = grid.at(col, row);
    return cell.kind === "active" ? { kind: "active", letter } : cell;
  },
});

/** Every lookup in the grid, for detecting mutation. */
const snapshot = (grid: Grid) =>
  Array.from({ length: grid.rows }, (_, row) =>
    Array.from({ length: grid.cols }, (_, col) => grid.at(col, row)),
  );

const splitRow0 = () =>
  createGrid({ cols: 15, rows: 15, black: [{ col: 10, row: 0 }] });

describe("B1 — across runs", () => {
  it("splits a row at a black cell into two maximal across slots", () => {
    const row0 = onRow(across(extractSlots(splitRow0())), 0);

    expect(row0).toHaveLength(2);
    expect(row0[0].start).toEqual({ col: 0, row: 0 });
    expect(row0[0].length).toBe(10);
    expect(row0[1].start).toEqual({ col: 11, row: 0 });
    expect(row0[1].length).toBe(4);
  });

  it("lists cells in reading order, with start and length agreeing", () => {
    const first = onRow(across(extractSlots(splitRow0())), 0)[0];

    expect(first.cells).toEqual(
      Array.from({ length: 10 }, (_, col) => ({ col, row: 0 })),
    );
    expect(first.start).toEqual(first.cells[0]);
    expect(first.length).toBe(first.cells.length);
  });
});

describe("B2 — the >=2 rule", () => {
  it("yields no slots for a lone active cell surrounded by black", () => {
    const black: Coord[] = [];
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        if (col !== 1 || row !== 1) black.push({ col, row });
      }
    }

    expect(extractSlots(createGrid({ cols: 3, rows: 3, black }))).toEqual([]);
  });

  it("starts no across slot at a cell that still starts a down slot", () => {
    const slots = extractSlots(
      createGrid({ cols: 15, rows: 15, black: [{ col: 1, row: 0 }] }),
    );
    const at00 = (s: Slot) => s.start.col === 0 && s.start.row === 0;

    expect(across(slots).some(at00)).toBe(false);
    expect(down(slots).find(at00)?.length).toBe(15);
  });

  it("treats a run of exactly two active cells as a slot", () => {
    const slots = extractSlots(
      createGrid({ cols: 3, rows: 1, black: [{ col: 2, row: 0 }] }),
    );

    expect(slots).toHaveLength(1);
    expect(slots[0].orientation).toBe("across");
    expect(slots[0].length).toBe(2);
  });
});

describe("B3 — full grid", () => {
  it("yields 15 across and 15 down slots of length 15", () => {
    const slots = extractSlots(createGrid({ cols: 15, rows: 15 }));

    expect(slots).toHaveLength(30);
    expect(across(slots)).toHaveLength(15);
    expect(down(slots)).toHaveLength(15);
    expect(slots.every((s) => s.length === 15)).toBe(true);
  });

  it("puts the across slot at (0,0) first and the down slot at (0,0) sixteenth", () => {
    const slots = extractSlots(createGrid({ cols: 15, rows: 15 }));

    expect(slots[0].orientation).toBe("across");
    expect(slots[0].start).toEqual({ col: 0, row: 0 });
    expect(slots[15].orientation).toBe("down");
    expect(slots[15].start).toEqual({ col: 0, row: 0 });
  });
});

describe("B4 — ordering", () => {
  it("orders across slots by start cell in reading order", () => {
    expect(starts(across(extractSlots(splitRow0()))).slice(0, 3)).toEqual([
      { col: 0, row: 0 },
      { col: 11, row: 0 },
      { col: 0, row: 1 },
    ]);
  });

  it("orders down slots by start cell in reading order, not by column", () => {
    const downStarts = starts(down(extractSlots(splitRow0())));

    expect(downStarts[0]).toEqual({ col: 0, row: 0 });
    expect(downStarts[9]).toEqual({ col: 9, row: 0 });
    expect(downStarts[10]).toEqual({ col: 11, row: 0 });
    expect(downStarts[14]).toEqual({ col: 10, row: 1 });
  });

  it("places every across slot before every down slot", () => {
    const slots = extractSlots(
      createGrid({
        cols: 15,
        rows: 15,
        black: [
          { col: 10, row: 0 },
          { col: 4, row: 6 },
        ],
      }),
    );
    const firstDown = slots.findIndex((s) => s.orientation === "down");

    expect(firstDown).toBeGreaterThan(0);
    expect(
      slots.slice(0, firstDown).every((s) => s.orientation === "across"),
    ).toBe(true);
    expect(slots.slice(firstDown).every((s) => s.orientation === "down")).toBe(
      true,
    );
  });
});

describe("B5 — purity and letter-independence", () => {
  it("returns deep-equal results on repeated calls", () => {
    const grid = splitRow0();

    expect(extractSlots(grid)).toEqual(extractSlots(grid));
  });

  it("does not mutate the grid", () => {
    const grid = splitRow0();
    const before = snapshot(grid);

    extractSlots(grid);

    expect(snapshot(grid)).toEqual(before);
  });

  it("yields identical slots for a grid whose active cells hold letters", () => {
    const plain = splitRow0();

    expect(extractSlots(withLetters(plain))).toEqual(extractSlots(plain));
  });
});
