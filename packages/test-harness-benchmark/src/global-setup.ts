// Runs ONCE in the main process before any test file: mints the benchmark
// run id every file stamps into its JSONL records. The root `yarn bench`
// sets BENCH_RUN_ID so ALL experiment suites of one invocation group as one
// run in the report; a single-experiment run mints its own id (the report
// composes per circuit, always showing each circuit's most recent run).
import type { TestProject } from "vitest/node";

import "./provided-context.ts";

export default function setup(project: TestProject): void {
  project.provide("benchRunId", process.env.BENCH_RUN_ID ?? new Date().toISOString());
}
