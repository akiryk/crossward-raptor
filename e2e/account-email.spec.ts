import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForNewPuzzleReady } from './helpers/wait-for-ready';
import { createAccount, readAccount, setUsername, signInByLink, uniqueEmail } from './helpers/username-step';
import { emailChangeLink, readAccountById } from './helpers/email-change';
import { createBlankPuzzle } from '../src/lib/puzzle-storage';

// Story 23-S5 — changing the email from Account details.
//
// The Account details email field (23-S4) is editable. Update is enabled
// while either field differs, exactly as typed, from the value the modal
// opened with. An email change is confirmed by the new address: Update asks
// the server (one server action) to send a confirmation link to the new email,
// and the modal's body becomes "Check <new email> for a link to confirm your
// new email." (the address trimmed and lowercased, as it will be stored) with
// a Close button, which is focused; the account's email does not change. Close,
// ✕ and Escape close it, focus returns to Account, and the page stays.
// Following the link lands on /puzzles with the account's email changed; the
// account, its username and puzzles are the same, and the new email is the
// one it signs in with.
//
// With both fields changed, the username saves first, at once (23-S4), then
// the email is requested. An email the same as the account's own, once
// trimmed and lowercased, is no email change: nothing is sent for it. The
// client checks the email rules first (TextInput's error line, the field
// focused, nothing sent). An email another account uses shows "Oops! Another
// account already uses that email."; a failed request shows "Could not send
// the confirmation link. Please try again."; each on the email's error line,
// keeping the value, with focus on the email field.
//
// Each test signs in its own account by database token; no email is sent (the
// harness is keyless), so the confirmation link is built by the editable
// helper e2e/helpers/email-change.ts. Measured at 1280×800. Do not edit this
// file to match an implementation.

test.use({ storageState: { cookies: [], origins: [] } });

const BLANK_EMAIL = 'Oops! You need to add an email address.';
const SHAPE_EMAIL = "Oops! That doesn't look like an email address.";
const IN_USE = 'Oops! Another account already uses that email.';
const SEND_FAILED = 'Could not send the confirmation link. Please try again.';
const BLANK_USERNAME = 'Oops! You need to add a username.';

function sentMessage(email: string) {
  return `Check ${email} for a link to confirm your new email.`;
}

async function box(locator: Locator) {
  const b = await locator.boundingBox();
  if (!b) throw new Error('element has no box');
  return b;
}

/** The colour a color style resolves to on this page, as a computed `color`. */
async function token(page: Page, style: string) {
  return page.evaluate((s) => {
    const probe = document.createElement('div');
    probe.style.color = `var(--color-${s})`;
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved;
  }, style);
}

function details(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Account details' });
  return {
    dialog,
    header: dialog.getByTestId('modal-header'),
    close: dialog.getByTestId('modal-close'),
    username: dialog.getByTestId('account-username'),
    usernameError: dialog.getByTestId('account-username-error'),
    email: dialog.getByTestId('account-email'),
    emailCaption: dialog.getByTestId('account-email-caption'),
    emailError: dialog.getByTestId('account-email-error'),
    update: dialog.getByTestId('account-update'),
    cancel: dialog.getByTestId('account-cancel'),
    sent: dialog.getByTestId('account-email-sent'),
    done: dialog.getByTestId('account-close'),
  };
}

function account(page: Page) {
  return page.getByTestId('app-header').getByTestId('account');
}

/** A new account with `username`, signed in on `page`, at /puzzles. */
async function namedAccount(page: Page, label: string, username = 'Lil Orange Fox') {
  await page.setViewportSize({ width: 1280, height: 800 });
  const email = uniqueEmail(`s5-${label}`);
  const userId = await createAccount(email, { displayName: username });
  await signInByLink(page, email);
  await expect(page).toHaveURL((url) => url.pathname === '/puzzles');
  await waitForNewPuzzleReady(page);
  return { email, userId };
}

async function openDetails(page: Page) {
  await page.mouse.move(1, 400);
  await account(page).click();
  const d = details(page);
  await expect(d.dialog).toBeVisible();
  return d;
}

/** Every server-action request the page sends. */
function recordActionPosts(page: Page) {
  const posts: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.headers()['next-action']) posts.push(request.url());
  });
  return posts;
}

/** Asks for `newEmail` from Account details and closes the message. */
async function askFor(page: Page, newEmail: string) {
  const d = await openDetails(page);
  await d.email.fill(newEmail);
  await d.update.click();
  await expect(d.sent).toHaveText(sentMessage(newEmail));
  await d.done.click();
  await expect(d.dialog).toHaveCount(0);
}

test.describe('23-S5-1 the email field is editable', () => {
  test('the email can be edited; Update follows it exactly; Enter sends nothing while Update is disabled', async ({ page }) => {
    const { email } = await namedAccount(page, 'editable');
    const d = await openDetails(page);
    await expect(d.dialog.getByRole('textbox', { name: 'Email', exact: true })).toHaveCount(1);
    await expect(d.email).toHaveValue(email);
    await expect(d.email).toBeEditable();
    await expect(d.email).not.toHaveAttribute('readonly');
    await expect(d.username, 'the username field is still focused on open').toBeFocused();

    await d.email.fill('someone.new@example.test');
    await expect(d.update).toBeEnabled();
    await expect.poll(async () => d.update.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
      await page.evaluate(() => {
        const probe = document.createElement('div');
        probe.style.backgroundColor = 'var(--color-button-fill)';
        document.body.appendChild(probe);
        const c = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return c;
      }),
    );
    await d.email.fill(email);
    await expect(d.update).toBeDisabled();
    await d.email.fill(`${email} `);
    await expect(d.update, 'a trailing space is a different value').toBeEnabled();
    await d.email.fill(email.toUpperCase());
    await expect(d.update, 'another case is a different value').toBeEnabled();
    await d.email.fill('');
    await expect(d.update, 'an emptied field differs too').toBeEnabled();
    await d.email.fill(email);
    await expect(d.update).toBeDisabled();

    const posts = recordActionPosts(page);
    await d.email.press('Enter');
    await page.waitForTimeout(500);
    expect(posts, 'Enter sends nothing while Update is disabled').toEqual([]);
    await expect(d.dialog).toBeVisible();
  });

  test('Cancel discards an edited email; reopening shows the saved one', async ({ page }) => {
    const { email, userId } = await namedAccount(page, 'cancel');
    const posts = recordActionPosts(page);
    let d = await openDetails(page);
    await d.email.fill('not.sent@example.test');
    await d.cancel.click();
    await expect(d.dialog).toHaveCount(0);
    expect(posts).toEqual([]);
    expect((await readAccountById(userId))?.email).toBe(email);
    d = await openDetails(page);
    await expect(d.email).toHaveValue(email);
    await expect(d.update).toBeDisabled();
  });
});

test.describe('23-S5-2 asking to change the email', () => {
  test('Update sends one request; the modal says where the link went, with Close; the email is unchanged', async ({ page }) => {
    const { email, userId } = await namedAccount(page, 'request');
    const newEmail = uniqueEmail('s5-new');
    const posts = recordActionPosts(page);
    await page.evaluate(() => { (window as unknown as { __s5?: number }).__s5 = 1; });
    const d = await openDetails(page);
    await d.email.fill(`  ${newEmail.toUpperCase()} `);
    await d.update.click();

    await expect(d.sent).toHaveText(sentMessage(newEmail));
    await expect(d.dialog, 'still the Account details dialog').toBeVisible();
    await expect(d.header).toBeVisible();
    await expect(d.done).toHaveText('Close');
    await expect(d.done).toBeFocused();
    await expect(d.username, 'the fields are gone').toHaveCount(0);
    await expect(d.email).toHaveCount(0);
    await expect(d.update).toHaveCount(0);
    await expect(d.cancel).toHaveCount(0);
    expect(posts, 'one request').toHaveLength(1);
    expect((await readAccountById(userId))?.email, 'the email changes only when the link is followed').toBe(email);
    expect(await readAccount(newEmail), 'no account for the new email').toBeNull();

    await d.done.click();
    await expect(d.dialog).toHaveCount(0);
    await expect(account(page), 'focus returns to Account').toBeFocused();
    await expect(page).toHaveURL((url) => url.pathname === '/puzzles');
    expect(await page.evaluate(() => (window as unknown as { __s5?: number }).__s5), 'no full reload').toBe(1);

    const again = await openDetails(page);
    await expect(again.email, 'reopening shows the current email').toHaveValue(email);
    await expect(again.update).toBeDisabled();
  });

  test('✕ and Escape close the message too', async ({ page }) => {
    await namedAccount(page, 'close-sent');
    for (const how of ['✕', 'Escape'] as const) {
      const d = await openDetails(page);
      await d.email.fill(uniqueEmail('s5-close'));
      await d.update.click();
      await expect(d.sent).toBeVisible();
      if (how === '✕') await d.close.click();
      else await page.keyboard.press('Escape');
      await expect(d.dialog, how).toHaveCount(0);
      await expect(account(page), `${how}: focus returns to Account`).toBeFocused();
    }
  });

  test('a long address wraps inside the panel at 375px', async ({ page }) => {
    await namedAccount(page, 'long');
    await page.setViewportSize({ width: 375, height: 800 });
    const newEmail = `${'a'.repeat(40)}.${uniqueEmail('s5-long')}`;
    const d = await openDetails(page);
    await d.email.fill(newEmail);
    await d.update.click();
    await expect(d.sent).toHaveText(sentMessage(newEmail));
    const panel = await box(d.dialog);
    const message = await box(d.sent);
    expect(message.x, 'message left').toBeGreaterThanOrEqual(panel.x);
    expect(message.x + message.width, 'message right').toBeLessThanOrEqual(panel.x + panel.width);
    expect(await d.sent.evaluate((el) => el.scrollWidth - el.clientWidth), 'message overflow').toBeLessThanOrEqual(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });

  test('Enter in the email field does what Update does', async ({ page }) => {
    await namedAccount(page, 'enter');
    const newEmail = uniqueEmail('s5-enter');
    const d = await openDetails(page);
    await d.email.fill(newEmail);
    await d.email.press('Enter');
    await expect(d.sent).toHaveText(sentMessage(newEmail));
  });

  test('the account’s own email in another case or spacing is no change: nothing is sent and the modal closes', async ({ page }) => {
    const { email, userId } = await namedAccount(page, 'same');
    const posts = recordActionPosts(page);
    const d = await openDetails(page);
    await d.email.fill(`  ${email.toUpperCase()}  `);
    await d.update.click();
    await expect(d.dialog).toHaveCount(0);
    await page.waitForTimeout(500);
    expect(posts).toEqual([]);
    expect((await readAccountById(userId))?.email).toBe(email);
  });

  test('while sending, both fields and both buttons are disabled and Escape does not close the modal', async ({ page }) => {
    await namedAccount(page, 'sending');
    let release!: () => void;
    const held = new Promise<void>((resolve) => { release = resolve; });
    await page.route('**/*', async (route) => {
      const request = route.request();
      if (request.method() === 'POST' && request.headers()['next-action']) await held;
      await route.fallback();
    });
    const newEmail = uniqueEmail('s5-slow');
    const d = await openDetails(page);
    await d.email.fill(newEmail);
    await d.update.click();
    await expect(d.username).toBeDisabled();
    await expect(d.email).toBeDisabled();
    await expect(d.update).toBeDisabled();
    await expect(d.cancel).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(d.dialog).toBeVisible();
    release();
    await expect(d.sent).toHaveText(sentMessage(newEmail));
  });
});

test.describe('23-S5-3 following the link', () => {
  test('in the same browser: lands on /puzzles, the email is changed, the account and its puzzles are the same', async ({ page }) => {
    const { email, userId } = await namedAccount(page, 'confirm', 'Lil Orange Fox');
    const title = `S5 confirm ${email}`;
    await seedPuzzle(createBlankPuzzle('mini'), title, userId);
    const newEmail = uniqueEmail('s5-confirmed');
    const d = await openDetails(page);
    await d.email.fill(newEmail);
    await d.update.click();
    await expect(d.sent).toBeVisible();
    await d.done.click();

    await page.goto(await emailChangeLink(email, newEmail));
    await expect(page).toHaveURL((url) => url.pathname === '/puzzles');
    await waitForNewPuzzleReady(page);
    expect(await readAccountById(userId)).toEqual({ email: newEmail, displayName: 'Lil Orange Fox' });
    await expect(page.getByTestId('puzzle-list-item').filter({ hasText: title })).toHaveCount(1);
    const again = await openDetails(page);
    await expect(again.email, 'Account details shows the new email').toHaveValue(newEmail);
    await expect(again.username).toHaveValue('Lil Orange Fox');
  });

  test('afterwards the new email signs in to the account; the old one starts a new account', async ({ page, browser }) => {
    const { email, userId } = await namedAccount(page, 'after', 'Grace Maker');
    const newEmail = uniqueEmail('s5-after');
    await askFor(page, newEmail);
    await page.goto(await emailChangeLink(email, newEmail));
    await expect.poll(async () => (await readAccountById(userId))?.email).toBe(newEmail);

    const viaNew = await browser.newPage({ storageState: { cookies: [], origins: [] }, viewport: { width: 1280, height: 800 } });
    await signInByLink(viaNew, newEmail);
    await expect(viaNew).toHaveURL((url) => url.pathname === '/puzzles');
    await waitForNewPuzzleReady(viaNew);
    expect((await readAccount(newEmail))?.id).toBe(userId);
    await viaNew.close();

    const viaOld = await browser.newPage({ storageState: { cookies: [], origins: [] }, viewport: { width: 1280, height: 800 } });
    await signInByLink(viaOld, email);
    await expect(viaOld.locator('[data-testid="username-step"][data-ready="true"]'), 'a new, nameless account').toBeVisible();
    const old = await readAccount(email);
    expect(old?.id).not.toBe(userId);
    await viaOld.close();
  });

  test('of two links, the one followed first wins; the other then changes nothing', async ({ page }) => {
    const { email, userId } = await namedAccount(page, 'stale');
    const first = uniqueEmail('s5-first');
    const second = uniqueEmail('s5-second');
    await askFor(page, first);
    await askFor(page, second);
    const firstLink = await emailChangeLink(email, first);
    const secondLink = await emailChangeLink(email, second);
    await page.goto(secondLink);
    await expect.poll(async () => (await readAccountById(userId))?.email).toBe(second);
    await page.goto(firstLink);
    await expect(page).toHaveURL((url) => url.pathname === '/puzzles');
    expect((await readAccountById(userId))?.email).toBe(second);
  });
});

test.describe('23-S5-4 both fields changed', () => {
  test('the username saves at once and the email is requested; the page shows the new name', async ({ page }) => {
    const { email, userId } = await namedAccount(page, 'both', 'Lil Orange Fox');
    const title = `S5 both ${email}`;
    await seedPuzzle(createBlankPuzzle('mini'), title, userId);
    await page.reload();
    await waitForNewPuzzleReady(page);
    const row = page.getByTestId('puzzle-list-item').filter({ hasText: title });
    const posts = recordActionPosts(page);
    const newEmail = uniqueEmail('s5-both');

    const d = await openDetails(page);
    await d.username.fill('Ada Lovelace');
    await d.email.fill(newEmail);
    await d.update.click();
    await expect(d.sent).toHaveText(sentMessage(newEmail));
    expect(posts, 'the username save, then the email request').toHaveLength(2);
    expect(await readAccountById(userId)).toEqual({ email, displayName: 'Ada Lovelace' });
    await expect(row.getByTestId('puzzle-builder-name')).toHaveText('Ada Lovelace');
    await d.done.click();
    await expect(account(page)).toBeFocused();

    const again = await openDetails(page);
    await expect(again.username).toHaveValue('Ada Lovelace');
    await expect(again.email).toHaveValue(email);
    await expect(again.update).toBeDisabled();
  });
});

test.describe('23-S5-5 errors', () => {
  test('blank and malformed emails show their message on the email’s error line and send nothing', async ({ page }) => {
    const { email, userId } = await namedAccount(page, 'rules');
    const posts = recordActionPosts(page);
    const d = await openDetails(page);
    for (const [value, message] of [['', BLANK_EMAIL], ['   ', BLANK_EMAIL], ['ada.example.test', SHAPE_EMAIL], ['ada@example', SHAPE_EMAIL]] as const) {
      await d.email.fill(value);
      await d.update.click();
      await expect(d.emailError, JSON.stringify(value)).toHaveText(message);
      await expect(d.email).toBeFocused();
      await expect(d.email).toHaveAttribute('aria-invalid', 'true');
      await expect(d.email).toHaveValue(value);
      const c = await box(d.emailCaption);
      const e = await box(d.emailError);
      expect(e.y, 'error under the caption').toBeGreaterThanOrEqual(c.y + c.height - 0.5);
      expect(await d.emailError.evaluate((el) => getComputedStyle(el).color), 'error color').toBe(await token(page, 'error'));
    }
    expect(posts).toEqual([]);
    expect((await readAccountById(userId))?.email).toBe(email);

    await d.email.fill('fixed@example.test');
    await expect(d.emailError, 'editing clears the error').toHaveCount(0);
    await expect(d.email).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('with both fields invalid, both errors show, the username field is focused, and nothing is sent', async ({ page }) => {
    await namedAccount(page, 'both-invalid');
    const posts = recordActionPosts(page);
    const d = await openDetails(page);
    await d.username.fill('');
    await d.email.fill('nope');
    await d.update.click();
    await expect(d.usernameError).toHaveText(BLANK_USERNAME);
    await expect(d.emailError).toHaveText(SHAPE_EMAIL);
    await expect(d.username).toBeFocused();
    await page.waitForTimeout(300);
    expect(posts).toEqual([]);
  });

  test('an email another account uses is refused on the email’s error line, in any case; nothing changes', async ({ page }) => {
    const { email, userId } = await namedAccount(page, 'taken');
    const other = uniqueEmail('s5-other');
    await createAccount(other, { displayName: 'Someone Else' });
    const d = await openDetails(page);
    await d.email.fill(other.toUpperCase());
    await d.update.click();
    await expect(d.emailError).toHaveText(IN_USE);
    await expect(d.email).toBeFocused();
    await expect(d.email).toHaveValue(other.toUpperCase());
    await expect(d.update).toBeEnabled();
    await expect(d.sent).toHaveCount(0);
    expect((await readAccountById(userId))?.email).toBe(email);
    expect((await readAccount(other))?.displayName).toBe('Someone Else');
  });

  test('with both changed and the email in use, the username is saved and the email error shows', async ({ page }) => {
    const { userId } = await namedAccount(page, 'taken-both', 'Lil Orange Fox');
    const other = uniqueEmail('s5-other-both');
    await createAccount(other, { displayName: 'Someone Else' });
    const d = await openDetails(page);
    await d.username.fill('Grace Hopper');
    await d.email.fill(other);
    await d.update.click();
    await expect(d.emailError).toHaveText(IN_USE);
    await expect.poll(async () => (await readAccountById(userId))?.displayName).toBe('Grace Hopper');
    await expect(d.username).toHaveValue('Grace Hopper');
    await expect(d.usernameError).toHaveCount(0);
  });

  test('a failed request shows its message on the email’s error line and keeps the value; a retry sends', async ({ page }) => {
    const { email, userId } = await namedAccount(page, 'failure');
    let attempts = 0;
    await page.route('**/*', async (route) => {
      const request = route.request();
      if (request.method() === 'POST' && request.headers()['next-action'] && attempts++ === 0) {
        await route.fulfill({ status: 500, contentType: 'text/plain', body: 'Internal Server Error' });
        return;
      }
      await route.fallback();
    });
    const newEmail = uniqueEmail('s5-retry');
    const d = await openDetails(page);
    await d.email.fill(newEmail);
    await d.update.click();
    await expect(d.emailError).toHaveText(SEND_FAILED);
    await expect(d.email).toHaveValue(newEmail);
    await expect(d.email).toBeEnabled();
    await expect(d.email).toBeFocused();
    await expect(d.update).toBeEnabled();
    await expect(d.cancel).toBeEnabled();
    expect((await readAccountById(userId))?.email).toBe(email);

    await d.update.click();
    await expect(d.sent).toHaveText(sentMessage(newEmail));
  });
});

test.describe('23-S5-6 only an account with a username', () => {
  test('an account whose username was removed mid-page is sent to the step by Update, and nothing changes', async ({ page }) => {
    const { email, userId } = await namedAccount(page, 'removed', 'Soon Nameless');
    const d = await openDetails(page);
    await d.email.fill(uniqueEmail('s5-sneaky'));
    await setUsername(email, null);
    await d.update.click();
    await expect(page).toHaveURL((url) => url.pathname === '/');
    await expect(page.locator('[data-testid="username-step"][data-ready="true"]')).toBeVisible();
    expect(await readAccountById(userId)).toEqual({ email, displayName: null });
  });
});
