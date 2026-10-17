import { createAuthClient } from 'better-auth/react';
import { magicLinkClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  plugins: [magicLinkClient()],
  fetchOptions: {
    onRequest(context) {
      // The installed client sends deferred refresh as an empty POST, while
      // its server requires JSON. Supply an empty object for that call only.
      if (
        context.method === 'POST' &&
        new URL(context.url).pathname === '/api/auth/get-session' &&
        context.body == null
      ) {
        context.headers.set('content-type', 'application/json');
        context.body = '{}';
      }
    },
  },
});
