import { defineBenchConfig } from "@midnight-experiments/test-harness-benchmark/vitest";

// The rejection-pinning bench runs before the atomic composition test.
export default defineBenchConfig(["xcall-with-payment.test.ts", "xcall-with-payment-atomic.test.ts"]);
