// Stack preflight: fail fast, with a pointer at the fix, when the local
// docker stack (node + indexer + proof server) is not up.

import type { MidnightNodeConfig } from "@midnight-experiments/lib";

/** Assert one endpoint answers HTTP at all (any status counts as reachable). */
export async function assertHttpReachable(label: string, url: string): Promise<void> {
  try {
    await fetch(url, { method: "GET" });
  } catch (cause) {
    throw new Error(`${label} not reachable at ${url}: is the local stack up? (docker compose up -d)`, { cause });
  }
}

/** Check the node, indexer and proof server are all reachable before any test work. */
export async function preflightMidnightStack(config: MidnightNodeConfig): Promise<void> {
  await assertHttpReachable("midnight node", new URL("/health", config.nodeUrl).href);
  await assertHttpReachable("indexer", config.indexerUrl);
  await assertHttpReachable("proof server", config.proofServerUrl);
}
