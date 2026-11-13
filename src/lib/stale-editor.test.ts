// 24-S3 acceptance: an editor tab from an earlier deployment reloads at its
// next server action (`stale-editor.ts`, used by the middleware). Do not
// edit this file to match an implementation.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RELOAD_COOKIE, staleEditorReload, type ActionRequest } from './stale-editor';

const ID = 'dpl_current';
const request = (over: Partial<ActionRequest> & { header?: Record<string, string> } = {}): ActionRequest => ({
  method: 'POST',
  pathname: '/puzzles/abc',
  search: '',
  hasReloadCookie: false,
  headers: new Headers({ 'next-action': '7f00aa', ...(over.header ?? { 'x-deployment-id': ID }) }),
  ...over,
});

describe('24-S3-10 old editor tabs reload', () => {
  it('lets this deployment’s actions through', () => {
    expect(staleEditorReload(request(), ID)).toBeNull();
  });

  it('answers another deployment’s action, or one without an ID, with a redirect to the same page', () => {
    for (const header of [{ 'x-deployment-id': 'dpl_old' }, {}] as Record<string, string>[]) {
      const reload = staleEditorReload(request({ header, search: '?x=1' }), ID);
      expect(reload?.['x-action-redirect']).toBe('/puzzles/abc?x=1;replace');
      expect(reload?.['set-cookie']).toContain(`${RELOAD_COOKIE}=1`);
      expect(reload?.['set-cookie']).toMatch(/Max-Age=\d+/);
    }
  });

  it('touches nothing but server actions posted to the editor page', () => {
    const old = { header: { 'x-deployment-id': 'dpl_old' } };
    expect(staleEditorReload(request({ ...old, method: 'GET' }), ID)).toBeNull();
    expect(staleEditorReload(request({ ...old, pathname: '/puzzles/abc/play' }), ID)).toBeNull();
    expect(staleEditorReload(request({ ...old, pathname: '/puzzles' }), ID)).toBeNull();
    expect(staleEditorReload({ ...request(old), headers: new Headers({ 'x-deployment-id': 'dpl_old' }) }, ID)).toBeNull();
  });

  it('never loops: with the reload cookie, or without a deployment ID, nothing is redirected', () => {
    expect(staleEditorReload(request({ header: {}, hasReloadCookie: true }), ID)).toBeNull();
    expect(staleEditorReload(request({ header: {} }), undefined)).toBeNull();
    expect(staleEditorReload(request({ header: {} }), false)).toBeNull();
  });

  it('the middleware applies it with Next.js’s deployment ID, and every build sets one', () => {
    const middleware = readFileSync(new URL('../middleware.ts', import.meta.url), 'utf8');
    expect(middleware).toMatch(/staleEditorReload\(/);
    expect(middleware).toMatch(/process\.env\.NEXT_DEPLOYMENT_ID/);
    const config = readFileSync(new URL('../../next.config.ts', import.meta.url), 'utf8');
    expect(config).toMatch(/deploymentId:/);
  });
});
