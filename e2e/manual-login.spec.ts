import { test, expect } from '@playwright/test';
import { getSession, readMagicLinkUrl } from './helpers/auth';
import { openSignedOutFrontDoor } from './helpers/sign-in-ui';
import { waitForNewPuzzleReady } from './helpers/wait-for-ready';

// A6 frozen UI acceptance specification. The ordinary production-build suite
// keeps email disabled. These cases verify submission/session/library behavior,
// not inbox delivery. A6 separately requires a real local-inbox walkthrough.
test.use({ storageState: { cookies: [], origins: [] } });

function uniqueEmail(label: string) {
  return `a6-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}

test.describe('A6 — usable sign-in submission', () => {
  for (const mode of ['email Enter', 'button click', 'Tab then Enter'] as const) {
    test(`${mode} submits once and the issued link opens a usable authenticated library`, async ({ page }) => {
      await openSignedOutFrontDoor(page);
      const email = uniqueEmail(mode.toLowerCase().replaceAll(' ', '-'));
      const requests: string[] = [];
      page.on('request', (request) => {
        if (new URL(request.url()).pathname === '/api/auth/sign-in/magic-link' && request.method() === 'POST') {
          requests.push(request.postData() ?? '');
        }
      });
      await page.getByTestId('sign-in-username').fill('Tester');
      await page.getByTestId('sign-in-email').fill(email);

      if (mode === 'email Enter') await page.getByTestId('sign-in-email').press('Enter');
      else if (mode === 'button click') await page.getByTestId('sign-in-submit').click();
      else {
        await page.getByTestId('sign-in-email').focus();
        await page.keyboard.press('Tab');
        await expect(page.getByTestId('sign-in-submit')).toBeFocused();
        await page.keyboard.press('Enter');
      }

      await expect(page.getByTestId('sign-in-sent')).toBeVisible();
      await page.waitForLoadState('networkidle');
      expect(requests).toHaveLength(1);
      expect(JSON.parse(requests[0])).toEqual(expect.objectContaining({ email }));
      await page.goto(await readMagicLinkUrl(email));
      await expect(page).toHaveURL(/\/puzzles$/);
      expect((await getSession(page))?.user?.email).toBe(email);
      await expect(page.getByTestId('sign-out')).toBeVisible();
      await waitForNewPuzzleReady(page);
      await page.getByTestId('new-puzzle-button').click();
      await expect(page.getByTestId('new-puzzle-dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('new-puzzle-dialog')).not.toBeVisible();
    });
  }

  test('a failed delivery shows a retryable error instead of claiming a link was sent', async ({ page }) => {
    await openSignedOutFrontDoor(page);
    let submissions = 0;
    await page.route('**/api/auth/sign-in/magic-link', async (route) => {
      submissions += 1;
      await route.fulfill({
        status: submissions === 1 ? 503 : 200,
        contentType: 'application/json',
        body: JSON.stringify(submissions === 1
          ? { code: 'DELIVERY_UNAVAILABLE', message: 'Could not send the sign-in link.' }
          : { status: true }),
      });
    });
    const email = uniqueEmail('retry');
    await page.getByTestId('sign-in-username').fill('Tester');
    await page.getByTestId('sign-in-email').fill(email);
    await page.getByTestId('sign-in-submit').click();

    await expect(page.getByTestId('sign-in-form').getByRole('alert')).toBeVisible();
    await expect(page.getByTestId('sign-in-form').getByRole('alert')).not.toHaveText('');
    await expect(page.getByTestId('sign-in-sent')).not.toBeVisible();
    await expect(page.getByTestId('sign-in-email')).toHaveValue(email);
    await expect(page.getByTestId('sign-in-submit')).toBeEnabled();
    expect(submissions).toBe(1);

    await page.getByTestId('sign-in-email').press('Enter');
    await expect(page.getByTestId('sign-in-sent')).toBeVisible();
    await expect(page.getByTestId('sign-in-form').getByRole('alert')).not.toBeVisible();
    expect(submissions).toBe(2);
  });
});
