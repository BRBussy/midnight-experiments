# MPC signature compatibility with `secp256k1EcdsaVerify`

Verdict: **compatible**. Signatures produced by the sig-net MPC
(`sig-net/mpc`, the cait-sith threshold ECDSA node) verify with the Compact
standard library's `secp256k1EcdsaVerify` after a trivial off-chain
conversion (`r = big_r.x mod n`). Every convention was checked against the
MPC source; file references below are into `sig-net/mpc`.

## What the MPC produces

`chain-signatures/primitives/src/crypto.rs` defines the canonical output:

```rust
pub struct Signature {
    pub big_r: AffinePoint, // the full R point (k256 secp256k1)
    pub s: Scalar,
    pub recovery_id: u8,    // 0 or 1
}
```

- Curve: secp256k1 via the `k256` crate, the same curve as Compact's
  `Secp256k1Point`/`Secp256k1Scalar`.
- The signed message is `SignArgs.payload: Scalar`: a 32-byte value the
  requester supplies, parsed BIG-ENDIAN and REJECTED if `>= n`
  (`ScalarExt::from_bytes`). For Ethereum flows the payload is the keccak256
  transaction digest.
- `s` is normalised to LOW-s inside cait-sith
  (`s.conditional_assign(&(-s), s.is_high())` in `cait-sith/src/sign.rs`),
  and the protocol self-verifies the signature before returning it.
- `recovery_id` is recomputed by `reconstruct_signature`
  (`chain-signatures/crypto/src/kdf.rs`) by trying recovery ids 0 and 1
  against the expected DERIVED public key.
- The verifying key for a request is a derived key:
  `derive_key(root_pk, epsilon) = root_pk + epsilon * G`, where epsilon comes
  from the sig.network derivation path (`kdf.rs`). System/attestation keys use
  the same mechanism with a `Purpose` string path.

## Point-by-point compatibility

| Convention | MPC side | Compact `secp256k1EcdsaVerify` | Compatible? |
|---|---|---|---|
| Curve | secp256k1 (k256) | secp256k1 (native ZKIR v3 types) | yes |
| Message | 32-byte payload, BE integer, must be `< n` | `msgHash: Bytes<32>`, BE integer reduced mod n | yes: for `payload < n` (which the MPC enforces) both read the identical scalar |
| `r` | not stored; derivable as `x_coordinate(big_r)` = `big_r.x` reduced mod n (`kdf.rs`) | `sig.r: Secp256k1Scalar`, compared against `P.x` cast to scalar (i.e. `P.x mod n`) | yes: same reduction on both sides |
| `s` | low-s normalised scalar | any non-zero scalar; low-s NOT required (both twins accepted) | yes |
| Public key | k256 affine point (derived key) | `Secp256k1Point` `{ x, y, identity: false }` | yes: pass the derived pk's coordinates |
| `recovery_id` | 0 or 1, for off-chain recovery | not used (pk is an explicit input; in-circuit recovery does not exist) | yes: simply unused on-chain |

The one conversion required: the MPC ships the full `R` point while Compact's
`Secp256k1EcdsaSignature` wants the scalar `r`. Off-chain:
`r = BigInt(big_r.x) % n` (noble: `secp256k1.Signature.fromBytes` on the
compact encoding also works). The signet contract ALREADY stores the response
as `SignatureResponse { bigRx, bigRy, s, recoveryId }` (Signet.compact,
mirroring the MPC struct), so everything needed to build the Compact
signature is on the ledger today; alternatively, with `bigR` modelled as a
`Secp256k1Point` circuit input, the reduction can even be done in-circuit as
`(secp256k1PointX(bigR) as Bytes<32>) as Secp256k1Scalar`, which is exactly
how the stdlib's own verifier computes the comparison value.

## What this unlocks for signet

- **Signature responses become in-circuit verifiable.** `postSignatureResponse`
  is unauthenticated today because ECDSA could not be checked in-circuit. The
  MPC's response over the requested payload, with the requester's DERIVED
  public key (computed off-chain from the root key + derivation path) passed
  as the `pk` input, now can be: `verifyEcdsa(payload, { r, s }, derivedPk)`.
- **The attestation key can be the MPC's native ECDSA identity.** The
  `RespondBidirectional` JubJub Schnorr attestation exists only because
  in-circuit ECDSA was missing (its own comment says "migrate to ECDSA"). The
  MPC signs any 32-byte digest through the same pipeline, so an attestation
  digest (see the message-format section of
  [signet-upgrade.md](signet-upgrade.md)) signed by a stable system-derived
  MPC key drops in, and the second, Midnight-only Schnorr key disappears.
- **Caveat, not a blocker**: `sig-net/mpc` has no Midnight chain integration
  yet (`Chain` enum: NEAR, Ethereum, Solana, Bitcoin, Hydration, Canton; the
  local fakenet responder currently plays that role). Whoever builds the
  Midnight publisher only needs it to sign the attestation digest with the
  standard signing pipeline; no new cryptography is required on either side.
- Requesters should keep payloads `< n` (any honest 32-byte hash is, with
  probability ~1 - 2^-128); the MPC refuses out-of-range payloads outright,
  so no reduce-mod-n mismatch can arise in practice.
