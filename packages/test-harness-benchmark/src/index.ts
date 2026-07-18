// Public surface of the benchmark harness: the bench session (wallet session
// + recorder) and the generic instrumented-prover bench driver. The vitest
// config factory lives behind the separate
// `@midnight-experiments/test-harness-benchmark/vitest` entry point: it
// imports vitest/node and must only load in vitest's main process.

export * from "./session.ts";
export * from "./run-bench.ts";
