import { test, type TestInfo } from '@playwright/test';

// Each attempt has its own TestInfo, including retries and other projects.
// Recording a fresh sign-in must never change another test's default owner.
const fixtureBuilders = new WeakMap<TestInfo, string>();

export function registerFixtureBuilder(builderId: string): void {
  fixtureBuilders.set(test.info(), builderId);
}

export function currentFixtureBuilderId(): string | undefined {
  return fixtureBuilders.get(test.info());
}
