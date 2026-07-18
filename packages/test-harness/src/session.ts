// One wallet session per test file: preflight the stack, then open + sync
// the deployer wallet facade once (reused for every deploy and call in the
// file), alongside an indexer public-data provider for ledger reads.

import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { setNetworkId } from "@midnight-ntwrk/midnight-js/network-id";
import type { PublicDataProvider } from "@midnight-ntwrk/midnight-js-types";

import {
  deriveAccountKeys,
  getDeployConfig,
  initialiseWalletFacade,
  type AccountKeys,
  type MidnightNodeConfig,
  type WalletFacade,
} from "@midnight-experiments/lib";

import { preflightMidnightStack } from "./preflight.ts";

export interface WalletSession {
  config: MidnightNodeConfig;
  facade: WalletFacade;
  keys: AccountKeys;
  publicDataProvider: PublicDataProvider;
  close(): Promise<void>;
}

/**
 * Preflight the stack, then open a started-and-synced wallet facade for the
 * deployer (genesis mint wallet unless DEPLOYER_SEED is set).
 *
 * @param env - The environment the node config and deployer seed are read from.
 * @returns The live session; call `close()` in afterAll.
 */
export async function openWalletSession(env: NodeJS.ProcessEnv = process.env): Promise<WalletSession> {
  const deployConfig = getDeployConfig(env);
  const config = deployConfig.midnightNodeConfig;

  await preflightMidnightStack(config);

  // midnight-js reads the network id from a process-global.
  setNetworkId(config.networkId);

  const keys = deriveAccountKeys(deployConfig.deployerSeed, config.networkId);
  const facade = await initialiseWalletFacade(keys, config);
  await facade.start(keys.shieldedSecretKeys, keys.dustSecretKey);
  await facade.waitForSyncedState();

  return {
    config,
    facade,
    keys,
    publicDataProvider: indexerPublicDataProvider({
      queryURL: config.indexerUrl,
      subscriptionURL: config.indexerWsUrl,
    }),
    close: async () => {
      await facade.stop().catch(() => {});
    },
  };
}
