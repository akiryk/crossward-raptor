import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const TOKENS = [
  '--font-display',
  '--font-body',
  '--font-data',
  '--color-background',
  '--color-foreground',
  '--color-ink-2',
  '--color-ink-3',
  '--color-rule',
  '--color-rule-strong',
  '--color-hover-tint',
  '--color-panel-tint',
  '--color-accent',
  '--color-accent-hover',
  '--color-ok-tint',
  '--color-grid-empty',
  '--color-grid-line',
  '--color-cell-fill',
  '--color-selected',
  '--color-required',
  '--color-incomplete',
  '--radius-btn',
  '--radius-md',
  '--radius-lg',
  '--radius-grid',
  '--grid-line-width',
  '--text-eyebrow',
];

const SECTIONS = [
  'token-panel',
  'sg-text',
  'sg-buttons',
  'sg-hover',
  'sg-inputs',
  'sg-links',
  'sg-hint-rows',
  'sg-confirmation',
  'sg-error',
  'sg-tooltip',
  'sg-stepper',
  'sg-grid-build',
  'sg-grid-preview',
];

const GRID_SAMPLES = ['sg-grid-build', 'sg-grid-preview'];
const TOLERANCE = 0.5; // browsers lay out on subpixels

function tokenValue(page: Page, name: string) {
  return page.evaluate(
    (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    name
  );
}

function hasOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
}

function styleOf(locator: ReturnType<Page['locator']>, props: string[]) {
  return locator.evaluate((el, keys) => {
    const s = getComputedStyle(el);
    return keys.map((k) => s.getPropertyValue(k)).join('|');
  }, props);
}

/**
 * Measures the sample's rendered geometry rather than its declared CSS.
 *
 * A previous version of these tests asserted on computed `gap`, and passed
 * while columns were ~13px apart: the cells were narrower than their grid
 * tracks, so unused track space sat beside each one in the same colour as
 * the hairline. The declared gap was genuinely 1px; the render was not.
 * Only measurement catches that.
 */
async function measureSample(page: Page, sample: string) {
  return page.evaluate((testid) => {
    const section = document.querySelector(`[data-testid="${testid}"]`);
    const container = section?.querySelector('[data-testid="sg-grid"]');
    if (!container) throw new Error(`no sg-grid inside ${testid}`);

    const cells = Array.from(
      container.querySelectorAll('[data-testid="sg-cell"]')
    ) as HTMLElement[];

    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, w: r.width, h: r.height };
    };

    return { container: box(container), cells: cells.map(box) };
  }, sample);
}

// --- D1-1: tokens ---
test.describe('D1-1 tokens', () => {
  test('every declared token resolves to a non-empty value', async ({ page }) => {
    await page.goto('/style-guide');

    const resolved = await page.evaluate((names) => {
      const style = getComputedStyle(document.documentElement);
      const out: Record<string, string> = {};
      for (const name of names) out[name] = style.getPropertyValue(name).trim();
      return out;
    }, TOKENS);

    for (const [name, value] of Object.entries(resolved)) {
      expect(value, `expected ${name} to be defined in @theme`).not.toBe('');
    }
  });

  test('the token panel lists every token by name', async ({ page }) => {
    await page.goto('/style-guide');

    for (const name of TOKENS) {
      const row = page.locator(`[data-testid="token-row"][data-token-name="${name}"]`);
      await expect(row, `expected a token row for ${name}`).toBeVisible();
      await expect(row).toContainText(name);
    }
  });

  test('the duplicate --color-complete token is gone', async ({ page }) => {
    await page.goto('/style-guide');

    expect(await tokenValue(page, '--color-complete')).toBe('');
    expect(await tokenValue(page, '--color-accent')).not.toBe('');
    expect(await tokenValue(page, '--color-incomplete')).not.toBe('');

    await expect(
      page.locator('[data-testid="token-row"][data-token-name="--color-complete"]')
    ).toHaveCount(0);
  });
});

// --- D1-2: sections ---
test.describe('D1-2 sections', () => {
  test('every style-guide section renders', async ({ page }) => {
    await page.goto('/style-guide');

    for (const section of SECTIONS) {
      await expect(page.getByTestId(section), `expected ${section}`).toBeVisible();
    }
  });
});

// --- D1-3: states are distinguishable ---
test.describe('D1-3 distinguishable states', () => {
  test('primary and quiet buttons differ in background', async ({ page }) => {
    await page.goto('/style-guide');

    const primary = await page
      .getByTestId('sg-button-primary')
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    const quiet = await page
      .getByTestId('sg-button-quiet')
      .evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(primary).not.toBe(quiet);
  });

  test('the disabled button is visually distinct from the primary button', async ({ page }) => {
    await page.goto('/style-guide');

    const primary = await page.getByTestId('sg-button-primary').evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, opacity: s.opacity };
    });
    const disabled = await page.getByTestId('sg-button-disabled').evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, opacity: s.opacity, cursor: s.cursor };
    });

    expect(disabled.bg !== primary.bg || disabled.opacity !== primary.opacity).toBe(true);
    expect(disabled.cursor).toBe('not-allowed');
  });

  test('interactive elements report a pointer cursor', async ({ page }) => {
    await page.goto('/style-guide');

    expect(
      await page.getByTestId('sg-button-primary').evaluate((el) => getComputedStyle(el).cursor)
    ).toBe('pointer');

    expect(
      await page
        .getByTestId('sg-links')
        .locator('a')
        .first()
        .evaluate((el) => getComputedStyle(el).cursor)
    ).toBe('pointer');
  });

  test('inputs have a visible border', async ({ page }) => {
    await page.goto('/style-guide');

    const border = await page.getByTestId('sg-input').evaluate((el) => {
      const s = getComputedStyle(el);
      return { width: s.borderTopWidth, color: s.borderTopColor };
    });

    expect(border.width).not.toBe('0px');
    expect(border.color).not.toBe('rgba(0, 0, 0, 0)');
    expect(border.color).not.toBe('transparent');
  });

  test('a focused input looks different from an unfocused one', async ({ page }) => {
    await page.goto('/style-guide');

    const input = page.getByTestId('sg-input');
    const before = await styleOf(input, ['border-top-color', 'box-shadow', 'outline-width']);
    await input.focus();
    const after = await styleOf(input, ['border-top-color', 'box-shadow', 'outline-width']);

    expect(after).not.toBe(before);
  });

  test('complete and incomplete hint rows differ', async ({ page }) => {
    await page.goto('/style-guide');

    const section = page.getByTestId('sg-hint-rows');
    const complete = await styleOf(section.locator('[data-complete="true"]').first(), [
      'color',
      'background-color',
      'border-left-color',
    ]);
    const incomplete = await styleOf(section.locator('[data-complete="false"]').first(), [
      'color',
      'background-color',
      'border-left-color',
    ]);

    expect(complete).not.toBe(incomplete);
  });
});

// --- D1b-2: hover ---
test.describe('D1b-2 hover states', () => {
  test('hovering the primary button changes its background', async ({ page }) => {
    await page.goto('/style-guide');

    const button = page.getByTestId('sg-hover').getByTestId('sg-button-primary');
    const before = await button.evaluate((el) => getComputedStyle(el).backgroundColor);
    await button.hover();
    const after = await button.evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(after).not.toBe(before);
  });

  test('hovering a link changes its appearance', async ({ page }) => {
    await page.goto('/style-guide');

    const link = page.getByTestId('sg-hover').locator('a').first();
    const before = await styleOf(link, ['color', 'text-decoration-line', 'background-color']);
    await link.hover();
    const after = await styleOf(link, ['color', 'text-decoration-line', 'background-color']);

    expect(after).not.toBe(before);
  });

  test('hovering the disabled button changes nothing', async ({ page }) => {
    await page.goto('/style-guide');

    const button = page.getByTestId('sg-hover').getByTestId('sg-button-disabled');
    const before = await styleOf(button, ['background-color', 'opacity', 'color']);
    await button.hover({ force: true });
    const after = await styleOf(button, ['background-color', 'opacity', 'color']);

    expect(after).toBe(before);
  });
});

// --- D1c-1 / D1c-2 / D1c-3: measured grid geometry ---
test.describe('D1c grid geometry (measured, not declared)', () => {
  for (const sample of GRID_SAMPLES) {
    test(`${sample}: adjacent cells are exactly one hairline apart`, async ({ page }) => {
      await page.goto('/style-guide');

      const line = parseFloat(await tokenValue(page, '--grid-line-width'));
      const { cells } = await measureSample(page, sample);
      expect(cells.length).toBeGreaterThan(1);

      let horizontal = 0;
      let vertical = 0;

      for (const a of cells) {
        for (const b of cells) {
          const sameRow = Math.abs(a.top - b.top) < TOLERANCE;
          const sameCol = Math.abs(a.left - b.left) < TOLERANCE;

          if (sameRow && b.left > a.right - TOLERANCE) {
            const distance = b.left - a.right;
            if (distance < line * 4) {
              expect(distance, `${sample}: column gap`).toBeCloseTo(line, 0);
              horizontal++;
            }
          }
          if (sameCol && b.top > a.bottom - TOLERANCE) {
            const distance = b.top - a.bottom;
            if (distance < line * 4) {
              expect(distance, `${sample}: row gap`).toBeCloseTo(line, 0);
              vertical++;
            }
          }
        }
      }

      // the sample must actually contain adjacent pairs in both directions,
      // or the assertions above are vacuous
      expect(horizontal, `${sample}: horizontally adjacent pairs`).toBeGreaterThan(0);
      expect(vertical, `${sample}: vertically adjacent pairs`).toBeGreaterThan(0);
    });

    test(`${sample}: a hairline surrounds the outside too`, async ({ page }) => {
      await page.goto('/style-guide');

      const line = parseFloat(await tokenValue(page, '--grid-line-width'));
      const { container, cells } = await measureSample(page, sample);

      const left = Math.min(...cells.map((c) => c.left)) - container.left;
      const top = Math.min(...cells.map((c) => c.top)) - container.top;
      const right = container.right - Math.max(...cells.map((c) => c.right));
      const bottom = container.bottom - Math.max(...cells.map((c) => c.bottom));

      expect(left, `${sample}: left edge`).toBeCloseTo(line, 0);
      expect(top, `${sample}: top edge`).toBeCloseTo(line, 0);
      expect(right, `${sample}: right edge`).toBeCloseTo(line, 0);
      expect(bottom, `${sample}: bottom edge`).toBeCloseTo(line, 0);
    });

    test(`${sample}: cells are square and uniformly sized`, async ({ page }) => {
      await page.goto('/style-guide');

      const { cells } = await measureSample(page, sample);
      expect(cells.length).toBeGreaterThan(0);

      for (const cell of cells) {
        expect(cell.w).toBeCloseTo(cell.h, 0);
        expect(cell.w).toBeCloseTo(cells[0].w, 0);
        expect(cell.h).toBeCloseTo(cells[0].h, 0);
      }
    });
  }
});

// --- D1b-4: grid samples show real states ---
test.describe('D1b-4 grid samples', () => {
  test('the build sample shows a letter and a number', async ({ page }) => {
    await page.goto('/style-guide');

    const sample = page.getByTestId('sg-grid-build');
    await expect(sample.locator('[data-cell-state="letter"]').first()).toBeVisible();
    await expect(sample.locator('[data-testid="sg-cell-number"]').first()).toBeVisible();
  });

  test('the preview sample shows a letter, a number, and a required cell', async ({ page }) => {
    await page.goto('/style-guide');

    const sample = page.getByTestId('sg-grid-preview');
    await expect(sample.locator('[data-cell-state="letter"]').first()).toBeVisible();
    await expect(sample.locator('[data-testid="sg-cell-number"]').first()).toBeVisible();
    await expect(sample.locator('[data-cell-state="required"]').first()).toBeVisible();
  });
});

// --- D1-4: responsive ---
test.describe('D1-4 responsive', () => {
  test('no horizontal overflow at phone width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/style-guide');

    await expect(page.getByTestId('token-panel')).toBeVisible();
    expect(await hasOverflow(page)).toBe(false);
  });

  test('no horizontal overflow at laptop width', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/style-guide');

    await expect(page.getByTestId('token-panel')).toBeVisible();
    expect(await hasOverflow(page)).toBe(false);
  });
});
