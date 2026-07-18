// The shared vitest config for benchmark integration-test packages:
// - globalSetup mints the run id all files stamp into their records.
// - Files can NEVER run in parallel: they share one chain, one deployer
//   wallet (nonces/funds) and one proof server whose queueing would poison
//   the timing measurements. fileParallelism false runs them one at a time.
// - An optional fileOrder pins a stable order for multi-file packages
//   (vitest's default orders by results cache, failed/slowest first,
//   which would shuffle runs); unknown files run last, name-ordered.

import { basename } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";
import { BaseSequencer, type TestSpecification } from "vitest/node";

function makeSequencer(fileOrder: readonly string[]) {
  const rank = (moduleId: string): number => {
    const index = fileOrder.indexOf(basename(moduleId));
    return index === -1 ? fileOrder.length : index;
  };
  return class BenchSequencer extends BaseSequencer {
    override async sort(files: TestSpecification[]): Promise<TestSpecification[]> {
      return [...files].sort(
        (a, b) => rank(a.moduleId) - rank(b.moduleId) || a.moduleId.localeCompare(b.moduleId),
      );
    }
  };
}

/**
 * Build a benchmark package's vitest config.
 *
 * @param fileOrder - Optional pinned test-file order (basenames) for
 *   packages with more than one test file.
 */
export function defineBenchConfig(fileOrder: readonly string[] = []) {
  return defineConfig({
    test: {
      globalSetup: fileURLToPath(new URL("./global-setup.ts", import.meta.url)),
      fileParallelism: false,
      sequence: { sequencer: makeSequencer(fileOrder) },
      testTimeout: 30 * 60_000,
      hookTimeout: 10 * 60_000,
    },
  });
}
