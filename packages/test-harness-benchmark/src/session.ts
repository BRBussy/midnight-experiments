// One benchmark session per test file: the generic wallet session from
// @midnight-experiments/test-harness plus the JSONL recorder all
// measurements append to.

import { fileURLToPath } from "node:url";

import { Recorder } from "@midnight-experiments/lib";
import { openWalletSession, type WalletSession } from "@midnight-experiments/test-harness";

import "./provided-context.ts";

/** Where every benchmark observation lands (repo-root reports/raw/). */
export const RECORDS_FILE = fileURLToPath(new URL("../../../reports/raw/records.jsonl", import.meta.url));

/** Repetitions per measured circuit (BENCH_REPS env, default 2). */
export const BENCH_REPS = Math.max(1, Number(process.env.BENCH_REPS ?? 2));

export interface BenchSession extends WalletSession {
  recorder: Recorder;
}

/**
 * Preflight the stack, open the deployer wallet session, and attach the
 * benchmark recorder.
 *
 * @param runId - The run id (from vitest's global setup) stamped into every record.
 * @returns The live session; call `close()` in afterAll.
 */
export async function openBenchSession(runId: string): Promise<BenchSession> {
  const session = await openWalletSession(process.env);
  return { ...session, recorder: new Recorder(RECORDS_FILE, runId) };
}
