import pg from 'pg';

const DEFAULT_DATABASE_URL =
  'postgresql://crossward:crossward@localhost:5433/crossward_test';
const AUTH_ORIGIN = 'http://localhost:3100';

/** Resolve once before any child can migrate, reset, build, or serve. */
export function e2eEnvironment(ambient = process.env) {
  const input = ambient.TEST_DATABASE_URL ?? DEFAULT_DATABASE_URL;
  let connection;
  try {
    const url = new URL(input);
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error();
    // These directives have differing meanings across Postgres clients.
    // Never pass an alternate database/address/socket to Prisma's migrator.
    for (const name of ['database', 'dbname', 'db']) {
      if (url.searchParams.has(name) && url.searchParams.get(name) !== 'crossward_test') {
        throw new Error();
      }
    }
    for (const name of ['hostaddr', 'socket', 'connectionString', 'sslcert', 'sslkey', 'sslrootcert']) {
      if (url.searchParams.has(name)) throw new Error();
    }
    // Constructing a Client does not connect. Its connectionParameters apply
    // the same query overrides and defaults the application's pg driver uses.
    connection = new pg.Client({ connectionString: input }).connectionParameters;
    if (
      !['localhost', '127.0.0.1'].includes(connection.host) ||
      connection.port !== 5433 ||
      connection.database !== 'crossward_test'
    ) {
      throw new Error();
    }
  } catch {
    // Do not include the supplied URL: it can contain credentials.
    throw new Error(
      'E2E TEST_DATABASE_URL must resolve to localhost or 127.0.0.1:5433/crossward_test.',
    );
  }

  // Normalize to the effective target and credentials. Extra query options
  // cannot be reinterpreted differently by migration and application clients.
  const database = new URL(DEFAULT_DATABASE_URL);
  database.hostname = connection.host;
  database.username = encodeURIComponent(connection.user || 'crossward');
  database.password = encodeURIComponent(connection.password || 'crossward');
  const databaseURL = database.href;

  return {
    ...ambient,
    NODE_ENV: 'production',
    TEST: '',
    TEST_DATABASE_URL: databaseURL,
    DATABASE_URL: databaseURL,
    DATABASE_URL_UNPOOLED: databaseURL,
    BETTER_AUTH_URL: AUTH_ORIGIN,
    NEXT_PUBLIC_BETTER_AUTH_URL: AUTH_ORIGIN,
    NEXT_PUBLIC_AUTH_URL: `${AUTH_ORIGIN}/api/auth`,
    BETTER_AUTH_SECRET: 'crossward-e2e-only-3f87a2d05b694c1e8f30a9bd652147ac',
    BETTER_AUTH_SECRETS: '',
    BETTER_AUTH_TRUSTED_ORIGINS: AUTH_ORIGIN,
    RESEND_API_KEY: '',
    VERCEL: '',
  };
}
