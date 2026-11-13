import { execSync } from "node:child_process";
import type { NextConfig } from "next";

// Epic 24 (24-S3): every build has a deployment ID, which Next.js sends with
// each server action. The middleware reloads an editor tab whose actions
// carry another build's ID (src/lib/stale-editor.ts). It must be the same
// when the build runs and when the server starts: Vercel's own ID there
// (`NEXT_DEPLOYMENT_ID`, set with Skew Protection, must win, or the build
// fails), else the deployment's or the commit's; locally, the checkout's
// commit. Without one, nothing is reloaded.
function deploymentId(): string | undefined {
  const fromEnv =
    process.env.NEXT_DEPLOYMENT_ID || process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA;
  if (fromEnv) return fromEnv;
  try {
    return `git-${execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim()}`;
  } catch {
    return undefined;
  }
}

const nextConfig: NextConfig = {
  // Expose original Flight headers to the scoped play HTML-prefetch handler.
  skipProxyUrlNormalize: true,
  deploymentId: deploymentId(),
};

export default nextConfig;
