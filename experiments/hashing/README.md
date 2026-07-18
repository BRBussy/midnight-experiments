# hashing (benchmark)

Measures the cost of hashing byte arrays and data structures of different
sizes: `persistentHash` vs `transientHash` over 32/256/1024 bytes plus a
`Vector<8, Bytes<32>>` (`persistentVec8`). The no-hash `control*` circuits
take the same large inputs without hashing, isolating the cost of large
circuit *inputs* from the cost of the hash itself.

Note when reading results: hash builtins expand inside *constraints*, not
zkir instructions, so prover key size is the honest circuit-size proxy.

## Run it

```bash
# from the repo root, with the docker stack up (docker compose up -d):
yarn compile:zk:hashing            # proving keys for this contract
yarn bench:hashing                 # deploy fresh + drive all ten circuits
yarn bench:hashing-persistent1024  # a single circuit
BENCH_CIRCUITS=control32,persistent32 yarn bench:hashing   # any subset
yarn report                        # refresh reports/REPORT.md
```

## Layout

- [contract/](contract/): `src/hashing.compact`, its export surface (compiled
  binding, deploy function, bench plan) in `src/index.ts`.
- [integration-tests/](integration-tests/): the live bench suite, gated by
  `RUN_INTEGRATION_TESTS`. Generic driving and recording come from
  `@midnight-experiments/test-harness-benchmark`.
