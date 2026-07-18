# events (benchmark)

Measures the cost of firing MIP-0002 `Misc` events of different volumes: the
shared base workload plus 0/1/2/4 events per call (`base`, `emit1`, `emit2`,
`emit4`). The `Misc` payload is FIXED at `Bytes<256>` in compactc 0.33, so
"size" scales in 256-byte steps: 0/256/512/1024 B per call.

The integration suite also reads the events back off the indexer to confirm
every emitted event was actually published (event volume = what we think we
measured).

## Run it

```bash
# from the repo root, with the docker stack up (docker compose up -d):
yarn compile:zk:events      # proving keys for this contract
yarn bench:events           # deploy fresh + drive all four circuits
yarn bench:events-emit4     # a single circuit
yarn report                 # refresh reports/REPORT.md
```

## Layout

- [contract/](contract/): `src/events.compact`, its export surface (compiled
  binding, deploy function, bench plan, expected event counts) in
  `src/index.ts`.
- [integration-tests/](integration-tests/): the live bench suite, gated by
  `RUN_INTEGRATION_TESTS`. Generic driving and recording come from
  `@midnight-experiments/test-harness-benchmark`.
