// Epic 24 (24-S3): tabs running an editor from an earlier deployment. Every
// build sets a deployment ID (`next.config.ts`), which Next.js sends with
// each server action as `x-deployment-id`. An action posted to the editor's
// page (`/puzzles/<id>`) without this deployment's ID comes from a tab
// loaded before it: one still running the snapshot-saving editor, whose
// actions no longer exist, or a later editor whose operations might not
// match this server. Rather than let it fail silently, the answer is a
// server-action redirect to the same page, which Next.js's client turns
// into a full page load: the tab reloads into the current editor. A
// short-lived cookie stops a reload loop should the IDs ever disagree
// within one deployment (the action then runs, or fails, as usual).

export const RELOAD_COOKIE = 'crossward-editor-reload';
export const RELOAD_COOKIE_MAX_AGE_S = 60;

const EDITOR_PATH = /^\/puzzles\/[^/]+\/?$/;

export interface ActionRequest {
  readonly method: string;
  readonly pathname: string;
  readonly search: string;
  readonly headers: Headers;
  /** Whether the loop-breaking cookie is present. */
  readonly hasReloadCookie: boolean;
}

/** The headers of the reloading response for a server action from an
 *  out-of-date editor tab, or null to let the request through. Without a
 *  deployment ID (local development), nothing is redirected. */
export function staleEditorReload(request: ActionRequest, deploymentId: string | undefined | false): Record<string, string> | null {
  if (!deploymentId) return null;
  if (request.method !== 'POST' || !request.headers.has('next-action')) return null;
  if (!EDITOR_PATH.test(request.pathname)) return null;
  if (request.headers.get('x-deployment-id') === deploymentId) return null;
  if (request.hasReloadCookie) return null;
  return {
    'x-action-redirect': `${request.pathname}${request.search};replace`,
    'set-cookie': `${RELOAD_COOKIE}=1; Path=/puzzles; Max-Age=${RELOAD_COOKIE_MAX_AGE_S}; HttpOnly; SameSite=Lax`,
  };
}
