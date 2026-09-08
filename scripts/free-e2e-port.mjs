#!/usr/bin/env node
// Runs before every e2e run (see package.json's pretest:e2e) to clear
// anything that would block Playwright's dedicated dev server on
// E2E_PORT (playwright.config.ts). Two distinct things to clear:
//
// 1. Next.js's own dev-server lock (.next/dev/lock). This is scoped to
//    the *project directory*, not the port -- `next dev` refuses to
//    start a second instance in the same project even on a different
//    port, so giving Playwright its own port alone doesn't stop a
//    manually-running `npm run dev` from blocking it.
// 2. Anything actually bound to E2E_PORT itself (e.g. an orphaned
//    server left over from a previous killed run).
//
// This machine is a personal dev box, not shared infrastructure (see
// AGENTS.md) -- freeing either of these unconditionally is correct, not
// just convenient.

import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { execSync } from 'node:child_process';

const E2E_PORT = 3100;

function killPid(pid) {
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    // already dead
  }
}

const lockPath = '.next/dev/lock';
if (existsSync(lockPath)) {
  try {
    const { pid } = JSON.parse(readFileSync(lockPath, 'utf8'));
    if (pid) killPid(pid);
  } catch {
    // malformed lock; fall through to removing it anyway
  }
  try {
    unlinkSync(lockPath);
  } catch {
    // already gone
  }
}

try {
  const pids = execSync(`lsof -ti:${E2E_PORT}`, { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
  if (pids) {
    for (const pid of pids.split('\n')) killPid(Number(pid));
  }
} catch {
  // nothing listening on the port
}
