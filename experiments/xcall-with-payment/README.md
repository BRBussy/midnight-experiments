# xcall-with-payment (feature)

Answers: **can ownership of a shielded coin be passed across a cross-contract
call, with the callee taking custody?**

Finding (compact-runtime 0.18.x / midnight-js 5.0.0-beta): **no**. Zswap coin
operations are unsupported in cross-contract CALLEES; the runtime sets the
callee's Zswap local state to `undefined`, so a callee `receiveShielded`
throws before anything is proven or submitted. Coin custody must live in a
ROOT call.

Two live suites pin this down:

- `tests/xcall-with-payment.test.ts`: the rejection test. Deploys succeed,
  the forwarding call fails with exactly the expected runtime error, and the
  target's treasury stays untouched. If a runtime upgrade ever adds callee
  Zswap support, this test fails, which is the signal to flip the experiment
  over to asserting the deposit lands.
- `tests/xcall-with-payment-atomic.test.ts`: the workaround that DOES work.
  The cross-contract call and the payment run as TWO ROOT CALLS of ONE
  transaction, composed with the ledger's atomic `Transaction.merge`. The
  test file's header documents the two hard-won mechanics (gas budgets
  against threaded post-execution state, and segment-id apply order).

## Run it

```bash
# from the repo root, with the docker stack up (docker compose up -d):
yarn compile:zk:xcall-with-payment   # proving keys for BOTH contracts
yarn test:xcall-payment-atomic       # the atomic composition test
yarn bench:xcall-payment             # the rejection-pinning test (records to the report)
```

## Layout

- [contract/](contract/): `src/caller.compact` + `src/target.compact` and
  their export surface in `src/index.ts` (including the payment-coin helper).
- [integration-tests/](integration-tests/): both live suites, gated by
  `RUN_INTEGRATION_TESTS`.
