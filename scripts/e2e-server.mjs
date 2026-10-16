#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { e2eEnvironment } from './e2e-env.mjs';

const env = e2eEnvironment();
const next = createRequire(import.meta.url).resolve('next/dist/bin/next');
let child;
let stopping = false;
let shutdownTimer;

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopping = true;
    child?.kill(signal);
    // Bound cleanup if a build/server ignores its graceful shutdown signal.
    shutdownTimer ??= setTimeout(() => child?.kill('SIGKILL'), 10_000);
    shutdownTimer.unref();
  });
}

function run(args) {
  return new Promise((resolve) => {
    child = spawn(process.execPath, [next, ...args], { env, stdio: 'inherit' });
    child.on('error', (error) => {
      console.error(`E2E Next.js process could not start: ${error.message}`);
      resolve(1);
    });
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

const buildCode = await run(['build']);
if (buildCode !== 0 || stopping) process.exitCode = buildCode || 1;
else process.exitCode = await run(['start', '-p', '3100']);
clearTimeout(shutdownTimer);
