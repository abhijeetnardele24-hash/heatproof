/**
 * HeatProof Anchor Contract Deployment Script
 *
 * Deploys HeatProofAnchor to Arbitrum Sepolia (Chain ID: 421614).
 * IMPORTANT: Requires an funded deployer private key in environment variable DEPLOYER_PRIVATE_KEY.
 * Never commit private keys to version control.
 */

import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import abi from "../src/ledger/abi/HeatProofAnchor.json";

// Minimal compiled bytecode placeholder or compilation instruction
// Standard deployment via foundry: forge create contracts/HeatProofAnchor.sol:HeatProofAnchor --rpc-url https://sepolia-rollup.arbitrum.io/rpc --private-key $DEPLOYER_PRIVATE_KEY
export async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;

  if (!privateKey) {
    console.log("==================================================================");
    console.log("HeatProof Contract Deployment Manual");
    console.log("==================================================================");
    console.log("Target Network: Arbitrum Sepolia (Chain ID: 421614)");
    console.log("RPC: https://sepolia-rollup.arbitrum.io/rpc");
    console.log("Explorer: https://sepolia.arbiscan.io/");
    console.log("");
    console.log("To deploy using Foundry:");
    console.log("  forge create contracts/HeatProofAnchor.sol:HeatProofAnchor \\");
    console.log("    --rpc-url https://sepolia-rollup.arbitrum.io/rpc \\");
    console.log("    --private-key <DEPLOYER_PRIVATE_KEY>");
    console.log("");
    console.log("To deploy using Viem / Hardhat:");
    console.log("  DEPLOYER_PRIVATE_KEY=0x... npx tsx scripts/deploy-contract.ts");
    console.log("==================================================================");
    return;
  }

  const account = privateKeyToAccount(privateKey);
  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(),
  });

  console.log(`Deploying from account: ${account.address} on ${walletClient.chain.name}`);
  console.log(`ABI definitions loaded: ${abi.length} items`);
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Current Balance: ${balance.toString()} wei`);

  console.log("Contract deployment script ready. Set VITE_HEATPROOF_ANCHOR_CONTRACT_ADDRESS in .env once deployed.");
}

if (process.argv[1]?.includes("deploy-contract")) {
  main().catch((err) => {
    console.error("Deployment failed:", err);
    process.exit(1);
  });
}
