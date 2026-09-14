import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const COLOR_TOKENS = [
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
  '--color-slot',
  '--color-required',
  '--color-incomplete',
];

const OTHER_TOKENS = [
  '--font-display',
  '--font-body',
  '--font-data',
  '--radius-btn',
  '--radius-md',
  '--radius-lg',
  '--radius-grid',
  '--grid-line-width',
  '--text-headline',
  '--text-body',
  '--text-help',
  '--text-label',
  '--weight-normal',
  '--weight-bold',
];

const SIZE_TOKENS = [
  '--text-headline',
  '--text-body',
  '--text-help',
  '--text-label',
];

const WEIGHT_TOKENS = ['--weight-normal', '--weight-bold'];

const SECTIONS = [
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
const TOLERANCE = 0.5;

function tokenValue(page: Page, name: string) {
  return page.evaluate(
    (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    name
  );
}

/** Resolves any CSS colour string to the rgb() form getComputedStyle reports. */
function asRgb(page: Page, raw: string) {
  return page.evaluate((value) => {
    const probe = document.createElement('div');
    probe.style.color = value;
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved;
  }, raw);
}

function picker(page: Page, token: string) {
  return page.locator(`[data-testid="color-picker"][data-token-name="${token}"]`);
}

function colorInput(page: Page, token: string) {
  return picker(page, token).locator('[data-testid="color-input"]');
}

async function setToken(page: Page, token: string, hex: string) {
  await colorInput(page, token).evaluate((el, value) => {
    const input = el as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, hex);
}

function cellIn(page: Page, sample: string, state: string) {
  return page.getByTestId(sample).locator(`[data-cell-state="${state}"]`);
}

function bgOf(locator: ReturnType<Page['locator']>) {
  return locator.evaluate((el) => getComputedStyle(el).backgroundColor);
}

async function measureSample(page: Page, sample: string) {
  return page.evaluate((testid) => {
    const section = document.querySelector(`[data-testid="${testid}"]`);
    const container = section?.querySelector('[data-testid="puzzle-grid"]');
    if (!container) throw new Error(`no puzzle-grid inside ${testid}`);
    const cells = Array.from(
      container.querySelectorAll('[data-testid="grid-cell"]')
    ) as HTMLElement[];
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return {
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        w: r.width,
        h: r.height,
      };
    };
    return { container: box(container), cells: cells.map(box) };
  }, sample);
}

// --- D8-1: structure ---
test.describe('D8-1 structure', () => {
  test('both panes render', async ({ page }) => {
    await page.goto('/style-guide');

    await expect(page.getByTestId('token-pane')).toBeVisible();
    await expect(page.getByTestId('examples-pane')).toBeVisible();
  });

  test('three tabs render with colors selected by default', async ({ page }) => {
    await page.goto('/style-guide');

    await expect(page.getByTestId('token-tab')).toHaveCount(3);
    await expect(
      page.locator('[data-testid="token-tab"][data-tab-id="colors"]')
    ).toHaveAttribute('data-selected', 'true');
    await expect(
      page.locator('[data-testid="token-tab"][data-tab-id="fonts"]')
    ).toHaveAttribute('data-selected', 'false');
    await expect(
      page.locator('[data-testid="token-tab"][data-tab-id="utility"]')
    ).toHaveAttribute('data-selected', 'false');

    await expect(
      page.locator('[data-testid="token-tab-panel"][data-tab-id="colors"]')
    ).toBeVisible();
    await expect(page.getByTestId('token-tab-panel')).toHaveCount(1);
  });

  test('selecting another tab swaps the panel', async ({ page }) => {
    await page.goto('/style-guide');

    await page.locator('[data-testid="token-tab"][data-tab-id="utility"]').click();

    await expect(
      page.locator('[data-testid="token-tab-panel"][data-tab-id="utility"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="token-tab-panel"][data-tab-id="colors"]')
    ).toHaveCount(0);
  });

  test('every example section still renders', async ({ page }) => {
    await page.goto('/style-guide');

    for (const section of SECTIONS) {
      await expect(page.getByTestId(section), `expected ${section}`).toBeVisible();
    }
  });

  test('every token still resolves, including the newly registered one', async ({ page }) => {
    await page.goto('/style-guide');

    for (const token of [...COLOR_TOKENS, ...OTHER_TOKENS]) {
      expect(await tokenValue(page, token), `expected ${token}`).not.toBe('');
    }
  });
});

// --- D8-2: colour pickers ---
test.describe('D8-2 colour pickers', () => {
  test('a picker renders for every colour token, labelled by name', async ({ page }) => {
    await page.goto('/style-guide');

    for (const token of COLOR_TOKENS) {
      const row = picker(page, token);
      await expect(row, `expected a picker for ${token}`).toBeVisible();
      await expect(row).toContainText(token);
    }
  });

  test('each picker starts at the committed token value', async ({ page }) => {
    await page.goto('/style-guide');

    for (const token of COLOR_TOKENS) {
      const committed = await asRgb(page, await tokenValue(page, token));
      const shown = await asRgb(page, await colorInput(page, token).inputValue());
      expect(shown, `${token} picker value`).toBe(committed);
    }
  });

  test('changing a grid token repaints the matching cells', async ({ page }) => {
    await page.goto('/style-guide');

    const empties = cellIn(page, 'sg-grid-build', 'empty');
    expect(await empties.count()).toBeGreaterThan(1);

    await setToken(page, '--color-grid-empty', '#ff00ff');
    const expected = await asRgb(page, '#ff00ff');

    // every empty cell, not just one
    expect(await bgOf(empties.nth(0))).toBe(expected);
    expect(await bgOf(empties.nth(1))).toBe(expected);
  });

  test('changing the selected token repaints the cursor cell', async ({ page }) => {
    await page.goto('/style-guide');

    await setToken(page, '--color-selected', '#123456');

    expect(await bgOf(cellIn(page, 'sg-grid-build', 'selected').first())).toBe(
      await asRgb(page, '#123456')
    );
  });

  test('changing the grid-line token repaints the hairline', async ({ page }) => {
    await page.goto('/style-guide');

    await setToken(page, '--color-grid-line', '#00ff00');

    const container = page.getByTestId('sg-grid-build').getByTestId('puzzle-grid');
    expect(await bgOf(container)).toBe(await asRgb(page, '#00ff00'));
  });

  test('reloading restores committed values', async ({ page }) => {
    await page.goto('/style-guide');

    const committed = await asRgb(page, await tokenValue(page, '--color-grid-empty'));
    await setToken(page, '--color-grid-empty', '#ff00ff');
    expect(await bgOf(cellIn(page, 'sg-grid-build', 'empty').first())).not.toBe(committed);

    await page.reload();

    expect(await bgOf(cellIn(page, 'sg-grid-build', 'empty').first())).toBe(committed);
    expect(await asRgb(page, await colorInput(page, '--color-grid-empty').inputValue())).toBe(
      committed
    );
  });
});

// --- D9-2: the Fonts tab ---
test.describe('D9-2 fonts tab', () => {
  async function openFonts(page: Page) {
    await page.goto('/style-guide');
    await page.locator('[data-testid="token-tab"][data-tab-id="fonts"]').click();
    await expect(
      page.locator('[data-testid="token-tab-panel"][data-tab-id="fonts"]')
    ).toBeVisible();
  }

  test('a size control renders for each size token, at its committed value', async ({
    page,
  }) => {
    await openFonts(page);

    for (const token of SIZE_TOKENS) {
      const control = page.locator(
        `[data-testid="size-control"][data-token-name="${token}"]`
      );
      await expect(control, `expected a control for ${token}`).toBeVisible();
      await expect(control).toContainText(token);

      const shown = await control.locator('[data-testid="size-input"]').inputValue();
      const committed = await tokenValue(page, token);
      expect(parseFloat(shown), `${token} initial value`).toBeCloseTo(
        parseFloat(committed),
        2
      );
    }
  });

  test('a weight control renders for each weight token', async ({ page }) => {
    await openFonts(page);

    for (const token of WEIGHT_TOKENS) {
      const control = page.locator(
        `[data-testid="weight-control"][data-token-name="${token}"]`
      );
      await expect(control, `expected a control for ${token}`).toBeVisible();
      await expect(control).toContainText(token);
    }
  });

  test('changing the headline size resizes headings in the examples pane', async ({
    page,
  }) => {
    await openFonts(page);

    const heading = page.getByTestId('sg-text').locator('h1, h2').first();
    const before = await heading.evaluate((el) => getComputedStyle(el).fontSize);

    await page.evaluate(() =>
      document.documentElement.style.setProperty('--text-headline', '3rem')
    );

    const after = await heading.evaluate((el) => getComputedStyle(el).fontSize);
    expect(after).not.toBe(before);
  });

  test('changing the bold weight changes rendered weight', async ({ page }) => {
    await openFonts(page);

    const heading = page.getByTestId('sg-text').locator('h1, h2').first();
    const before = await heading.evaluate((el) => getComputedStyle(el).fontWeight);

    await page.evaluate(() =>
      document.documentElement.style.setProperty('--weight-bold', '300')
    );

    const after = await heading.evaluate((el) => getComputedStyle(el).fontWeight);
    expect(after).not.toBe(before);
  });

  test('reloading restores committed type values', async ({ page }) => {
    await openFonts(page);

    const heading = page.getByTestId('sg-text').locator('h1, h2').first();
    const committed = await heading.evaluate((el) => getComputedStyle(el).fontSize);

    await page.evaluate(() =>
      document.documentElement.style.setProperty('--text-headline', '3rem')
    );
    expect(await heading.evaluate((el) => getComputedStyle(el).fontSize)).not.toBe(committed);

    await page.reload();
    await page.locator('[data-testid="token-tab"][data-tab-id="fonts"]').click();

    expect(await heading.evaluate((el) => getComputedStyle(el).fontSize)).toBe(committed);
  });
});

// --- D8-3: real grids ---
test.describe('D8-3 real grid samples', () => {
  test('the build sample is a 10x10 showing every build state', async ({ page }) => {
    await page.goto('/style-guide');

    const sample = page.getByTestId('sg-grid-build');
    await expect(sample.getByTestId('grid-cell')).toHaveCount(100);

    for (const state of ['empty', 'letter', 'selected', 'slot', 'symmetric-hint']) {
      await expect(
        cellIn(page, 'sg-grid-build', state).first(),
        `expected a ${state} cell`
      ).toBeVisible();
    }
    await expect(sample.getByTestId('cell-number').first()).toBeVisible();
  });

  test('the active slot spans both lettered and empty cells', async ({ page }) => {
    await page.goto('/style-guide');

    // cells in the slot are styled 'slot' regardless of content, so read the
    // underlying kind/letter to confirm the slot really crosses both
    const slotCells = cellIn(page, 'sg-grid-build', 'slot');
    const texts = await slotCells.allTextContents();

    expect(texts.length).toBeGreaterThan(1);
    expect(texts.some((t) => /[A-Z]/.test(t))).toBe(true);
    expect(texts.some((t) => !/[A-Z]/.test(t))).toBe(true);
  });

  test('the preview sample shows black, lettered and required cells', async ({ page }) => {
    await page.goto('/style-guide');

    for (const state of ['black', 'letter', 'required']) {
      await expect(
        cellIn(page, 'sg-grid-preview', state).first(),
        `expected a ${state} cell`
      ).toBeVisible();
    }
  });

  for (const sample of GRID_SAMPLES) {
    test(`${sample}: geometry holds (measured)`, async ({ page }) => {
      await page.goto('/style-guide');

      const line = parseFloat(await tokenValue(page, '--grid-line-width'));
      const { container, cells } = await measureSample(page, sample);
      expect(cells.length).toBe(100);

      for (const cell of cells) {
        expect(cell.w).toBeCloseTo(cell.h, 0);
        expect(cell.w).toBeCloseTo(cells[0].w, 0);
      }

      let adjacencies = 0;
      for (const a of cells) {
        for (const b of cells) {
          if (Math.abs(a.top - b.top) < TOLERANCE && b.left > a.right - TOLERANCE) {
            const distance = b.left - a.right;
            if (distance < line * 4) {
              expect(distance).toBeCloseTo(line, 0);
              adjacencies++;
            }
          }
          if (Math.abs(a.left - b.left) < TOLERANCE && b.top > a.bottom - TOLERANCE) {
            const distance = b.top - a.bottom;
            if (distance < line * 4) {
              expect(distance).toBeCloseTo(line, 0);
              adjacencies++;
            }
          }
        }
      }
      expect(adjacencies).toBeGreaterThan(0);

      expect(Math.min(...cells.map((c) => c.left)) - container.left).toBeCloseTo(line, 0);
      expect(Math.min(...cells.map((c) => c.top)) - container.top).toBeCloseTo(line, 0);
      expect(container.right - Math.max(...cells.map((c) => c.right))).toBeCloseTo(line, 0);
      expect(container.bottom - Math.max(...cells.map((c) => c.bottom))).toBeCloseTo(line, 0);
    });
  }
});

// --- D10-2: the Utility tab ---
const UTILITY_TOKENS = [
  '--radius-btn',
  '--radius-md',
  '--radius-lg',
  '--radius-grid',
  '--grid-line-width',
];

test.describe('D10-2 utility tab', () => {
  async function openUtility(page: Page) {
    await page.goto('/style-guide');
    await page.locator('[data-testid="token-tab"][data-tab-id="utility"]').click();
    await expect(
      page.locator('[data-testid="token-tab-panel"][data-tab-id="utility"]')
    ).toBeVisible();
  }

  test('a control renders for each utility token, at its committed value', async ({ page }) => {
    await openUtility(page);

    for (const token of UTILITY_TOKENS) {
      const control = page.locator(
        `[data-testid="utility-control"][data-token-name="${token}"]`
      );
      await expect(control, `expected a control for ${token}`).toBeVisible();
      await expect(control).toContainText(token);

      const shown = await control.locator('[data-testid="utility-number"]').inputValue();
      const committed = await tokenValue(page, token);
      expect(parseFloat(shown), `${token} initial value`).toBeCloseTo(
        parseFloat(committed),
        2
      );
    }
  });

  test('changing a radius changes a rendered corner', async ({ page }) => {
    await openUtility(page);

    const button = page.getByTestId('sg-button-primary').first();
    const before = await button.evaluate((el) => getComputedStyle(el).borderTopLeftRadius);

    await page.evaluate(() =>
      document.documentElement.style.setProperty('--radius-btn', '2px')
    );

    const after = await button.evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
    expect(after).not.toBe(before);
  });

  test('changing the line width changes the measured gap between cells', async ({ page }) => {
    await openUtility(page);

    const gap = async () => {
      const { cells } = await measureSample(page, 'sg-grid-build');
      const sorted = [...cells].sort((a, b) => a.top - b.top || a.left - b.left);
      return sorted[1].left - sorted[0].right;
    };

    const before = await gap();

    await page.evaluate(() =>
      document.documentElement.style.setProperty('--grid-line-width', '5px')
    );

    const after = await gap();
    expect(after).toBeGreaterThan(before);
    expect(after).toBeCloseTo(5, 0);
  });

  test('reloading restores committed utility values', async ({ page }) => {
    await openUtility(page);

    const committed = await tokenValue(page, '--radius-md');
    await page.evaluate(() =>
      document.documentElement.style.setProperty('--radius-md', '1px')
    );
    expect(await tokenValue(page, '--radius-md')).not.toBe(committed);

    await page.reload();

    expect(await tokenValue(page, '--radius-md')).toBe(committed);
  });
});

// --- D10-3: font loading ---
test.describe('D10-3 font loading', () => {
  const VALID =
    'https://fonts.googleapis.com/css2?family=Lora:wght@400;700&display=swap';

  async function openFonts(page: Page) {
    await page.goto('/style-guide');
    await page.locator('[data-testid="token-tab"][data-tab-id="fonts"]').click();
    await expect(
      page.locator('[data-testid="token-tab-panel"][data-tab-id="fonts"]')
    ).toBeVisible();
  }

  function linkCount(page: Page, href: string) {
    return page.evaluate(
      (h) => document.querySelectorAll(`link[rel="stylesheet"][href="${h}"]`).length,
      href
    );
  }

  test('a family control renders for each font token', async ({ page }) => {
    await openFonts(page);

    for (const token of ['--font-display', '--font-body', '--font-data']) {
      const control = page.locator(
        `[data-testid="font-family-control"][data-token-name="${token}"]`
      );
      await expect(control, `expected a control for ${token}`).toBeVisible();
      await expect(control).toContainText(token);
    }
  });

  test('a valid URL loads the stylesheet and offers its family', async ({ page }) => {
    await openFonts(page);

    await page.getByTestId('font-url-input').fill(VALID);
    await page.getByTestId('font-url-apply').click();

    await expect(page.getByTestId('font-url-error')).toHaveCount(0);
    expect(await linkCount(page, VALID)).toBe(1);

    const options = await page
      .locator('[data-testid="font-family-control"][data-token-name="--font-body"]')
      .locator('[data-testid="font-family-select"] option')
      .allTextContents();
    expect(options.join('|')).toContain('Lora');
  });

  test('selecting a loaded family changes rendered text', async ({ page }) => {
    await openFonts(page);

    await page.getByTestId('font-url-input').fill(VALID);
    await page.getByTestId('font-url-apply').click();

    const body = page.getByTestId('sg-text').locator('p').first();
    const before = await body.evaluate((el) => getComputedStyle(el).fontFamily);

    await page
      .locator('[data-testid="font-family-control"][data-token-name="--font-body"]')
      .locator('[data-testid="font-family-select"]')
      .selectOption({ label: 'Lora' });

    const after = await body.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(after).not.toBe(before);
    expect(after).toContain('Lora');
  });

  test('a non-Google URL is rejected and loads nothing', async ({ page }) => {
    await openFonts(page);

    const bad = 'https://evil.example.com/css2?family=Inter';
    await page.getByTestId('font-url-input').fill(bad);
    await page.getByTestId('font-url-apply').click();

    const error = page.getByTestId('font-url-error');
    await expect(error).toBeVisible();
    expect((await error.textContent())?.trim().length ?? 0).toBeGreaterThan(0);
    expect(await linkCount(page, bad)).toBe(0);
  });

  test('nonsense input is rejected', async ({ page }) => {
    await openFonts(page);

    await page.getByTestId('font-url-input').fill('not a url');
    await page.getByTestId('font-url-apply').click();

    await expect(page.getByTestId('font-url-error')).toBeVisible();
  });

  test('reloading clears loaded fonts', async ({ page }) => {
    await openFonts(page);

    await page.getByTestId('font-url-input').fill(VALID);
    await page.getByTestId('font-url-apply').click();
    expect(await linkCount(page, VALID)).toBe(1);

    await page.reload();

    expect(await linkCount(page, VALID)).toBe(0);
  });
});

// --- D8-4: the pane stays put ---
test.describe('D8-4 pinned token pane', () => {
  test('the token pane is still visible after scrolling to the bottom', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/style-guide');

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Playwright's boundingBox() returns { x, y, width, height } -- not a
    // DOMRect, so there is no .top/.bottom here.
    const box = await page.getByTestId('token-pane').boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeLessThan(800);
    expect(box!.y + box!.height).toBeGreaterThan(0);
  });
});

// --- D8-5: responsive ---
test.describe('D8-5 responsive', () => {
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 375, height: 667 },
  ]) {
    test(`no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/style-guide');

      await expect(page.getByTestId('token-pane')).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflow).toBe(false);
    });
  }
});
