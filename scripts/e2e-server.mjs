#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { e2eEnvironment } from './e2e-env.mjs';

const env = e2eEnvironment();
const next = createRequire(import.meta.url).resolve('next/dist/bin/next');
let child;
let stopping = false;
let shutdownComplete;

function signalChild(signal) {
  if (!child?.pid) return;
  try {
    // npm adds a shell and build descendants. Signal their entire group so
    // stopping Playwright cannot leave generation or a build running behind.
    if (process.platform !== 'win32') process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch {
    // The child may already have exited.
  }
}

function childGroupExists() {
  if (!child?.pid) return false;
  if (process.platform === 'win32') return child.exitCode === null && child.signalCode === null;
  try {
    process.kill(-child.pid, 0);
    return true;
  } catch {
    return false;
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopping = true;
    signalChild(signal);
    // Keep the fallback alive even if npm exits before a build descendant.
    shutdownComplete ??= new Promise((resolve) => {
      const finish = () => {
        clearInterval(poll);
        clearTimeout(force);
        resolve();
      };
      const poll = setInterval(() => {
        if (!childGroupExists()) finish();
      }, 100);
      const force = setTimeout(() => {
        signalChild('SIGKILL');
        finish();
      }, 10_000);
    });
  });
}

function run(command, args) {
  return new Promise((resolve) => {
    child = spawn(command, args, {
      env,
      stdio: 'inherit',
      detached: process.platform !== 'win32',
    });
    child.on('error', (error) => {
      console.error(`E2E build/server process could not start: ${error.message}`);
      resolve(1);
    });
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

const buildCode = await run('npm', ['run', 'build']);
if (buildCode !== 0 || stopping) process.exitCode = buildCode || 1;
else process.exitCode = await run(process.execPath, [next, 'start', '-p', '3100']);
await shutdownComplete;
