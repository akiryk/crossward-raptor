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

// --- D1-1 / D1b-1: tokens ---
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
    const before = await input.evaluate((el) => {
      const s = getComputedStyle(el);
      return `${s.borderTopColor}|${s.boxShadow}|${s.outlineWidth}`;
    });

    await input.focus();

    const after = await input.evaluate((el) => {
      const s = getComputedStyle(el);
      return `${s.borderTopColor}|${s.boxShadow}|${s.outlineWidth}`;
    });

    expect(after).not.toBe(before);
  });

  test('complete and incomplete hint rows differ', async ({ page }) => {
    await page.goto('/style-guide');

    const section = page.getByTestId('sg-hint-rows');
    const complete = await section
      .locator('[data-complete="true"]')
      .first()
      .evaluate((el) => {
        const s = getComputedStyle(el);
        return `${s.color}|${s.backgroundColor}|${s.borderLeftColor}`;
      });
    const incomplete = await section
      .locator('[data-complete="false"]')
      .first()
      .evaluate((el) => {
        const s = getComputedStyle(el);
        return `${s.color}|${s.backgroundColor}|${s.borderLeftColor}`;
      });

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
    const before = await link.evaluate((el) => {
      const s = getComputedStyle(el);
      return `${s.color}|${s.textDecorationLine}|${s.backgroundColor}`;
    });

    await link.hover();

    const after = await link.evaluate((el) => {
      const s = getComputedStyle(el);
      return `${s.color}|${s.textDecorationLine}|${s.backgroundColor}`;
    });
    expect(after).not.toBe(before);
  });

  test('hovering the disabled button changes nothing', async ({ page }) => {
    await page.goto('/style-guide');

    const button = page.getByTestId('sg-hover').getByTestId('sg-button-disabled');
    const before = await button.evaluate((el) => {
      const s = getComputedStyle(el);
      return `${s.backgroundColor}|${s.opacity}|${s.color}`;
    });

    await button.hover({ force: true });

    const after = await button.evaluate((el) => {
      const s = getComputedStyle(el);
      return `${s.backgroundColor}|${s.opacity}|${s.color}`;
    });
    expect(after).toBe(before);
  });
});

// --- D1b-3: grid hairline ---
test.describe('D1b-3 grid hairline', () => {
  for (const sample of ['sg-grid-build', 'sg-grid-preview']) {
    test(`${sample}: divisions are a single hairline of one colour`, async ({ page }) => {
      await page.goto('/style-guide');

      const lineWidth = await tokenValue(page, '--grid-line-width');
      const container = page.getByTestId(sample).locator('[data-testid="sg-grid"]');

      const computed = await container.evaluate((el) => {
        const s = getComputedStyle(el);
        return { gap: s.gap, bg: s.backgroundColor };
      });

      // the gap IS the hairline; its width comes from the token
      expect(computed.gap.startsWith(lineWidth)).toBe(true);

      // painted in the grid-line colour, so every division looks identical
      const lineColor = await page.evaluate((raw) => {
        const probe = document.createElement('div');
        probe.style.color = raw;
        document.body.appendChild(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        return resolved;
      }, await tokenValue(page, '--color-grid-line'));

      expect(computed.bg).toBe(lineColor);
    });

    test(`${sample}: cells carry no borders of their own`, async ({ page }) => {
      await page.goto('/style-guide');

      const cells = page.getByTestId(sample).locator('[data-testid="sg-cell"]');
      const count = await cells.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const width = await cells.nth(i).evaluate((el) => getComputedStyle(el).borderTopWidth);
        expect(width).toBe('0px');
      }
    });

    test(`${sample}: cells are square and uniformly sized`, async ({ page }) => {
      await page.goto('/style-guide');

      const cells = page.getByTestId(sample).locator('[data-testid="sg-cell"]');
      const boxes = await cells.evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return { w: Math.round(r.width), h: Math.round(r.height) };
        })
      );

      expect(boxes.length).toBeGreaterThan(0);
      for (const box of boxes) {
        expect(box.w).toBe(box.h);
        expect(box.w).toBe(boxes[0].w);
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
