// The vitest ProvidedContext augmentation shared by the two halves of the
// run-id hand-off: global-setup.ts provides `benchRunId` from vitest's main
// process, test files inject it in the workers. Side-effect-imported by
// session.ts (and global-setup.ts), so any program that typechecks either
// half sees the augmentation.

// Pull the vitest module into the program so the augmentation below attaches
// to it (nothing else in this package imports "vitest" proper, only
// "vitest/node").
import type {} from "vitest";

declare module "vitest" {
  interface ProvidedContext {
    /** The benchmark run id stamped into every JSONL record. */
    benchRunId: string;
  }
}

export {};
