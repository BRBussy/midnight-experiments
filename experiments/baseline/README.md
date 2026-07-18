# baseline (benchmark)

The control every other benchmark experiment is measured against. Two
circuits:

- `noop`: an empty circuit, the proof-system floor.
- `base`: the shared workload every other experiment embeds (counter
  increment + scalar ledger write + map insert, "does some logic, mints
  something, some storage").

Any delta another experiment shows against `base` is attributable to the
construct that experiment adds.

## Run it

```bash
# from the repo root, with the docker stack up (docker compose up -d):
yarn compile:zk:baseline    # proving keys for this contract
yarn bench:baseline         # deploy fresh + drive noop and base
yarn bench:baseline-noop    # a single circuit
yarn report                 # refresh reports/REPORT.md
```

## Layout

- [contract/](contract/): `src/baseline.compact`, its export surface
  (compiled binding, deploy function, bench plan) in `src/index.ts`.
- [integration-tests/](integration-tests/): the live bench suite, gated by
  `RUN_INTEGRATION_TESTS` (offline `yarn test` skips it). Generic driving and
  recording come from `@midnight-experiments/test-harness-benchmark`.
