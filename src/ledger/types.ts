/**
 * Blockchain Proof Ledger Types & Interfaces
 */

import { z } from "zod";

export const LedgerStatusSchema = z.enum([
  "CONFIRMED",
  "SUBMITTED",
  "SIMULATED",
  "OFFLINE_QUEUED",
]);
export type LedgerStatus = z.infer<typeof LedgerStatusSchema>;

export const LedgerReceiptSchema = z.object({
  recordId: z.string().min(1),
  recordType: z.enum(["OBSERVATION", "ATTESTATION", "ADAPTATION_SERVICE_RECEIPT"]),
  digest: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  network: z.string().min(1),
  chainId: z.number().int().optional(),
  transactionHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  blockNumber: z.number().int().nonnegative().optional(),
  timestamp: z.string().datetime(),
  status: LedgerStatusSchema,
  explorerUrl: z.string().url().nullable(),
  gasUsed: z.string().optional(),
  notes: z.string(),
});
export type LedgerReceipt = z.infer<typeof LedgerReceiptSchema>;

export interface NetworkStatus {
  providerName: string;
  networkName: string;
  chainId?: number;
  isAvailable: boolean;
  blockHeight?: number;
  latencyMs?: number;
  mode: "LIVE_ONCHAIN" | "TESTNET_EVM" | "DETERMINISTIC_LOCAL" | "OFFLINE";
  rateLimitWarning?: string;
}

export interface ProofLedgerProvider {
  getNetworkStatus(): Promise<NetworkStatus>;
  recordObservationDigest(
    observationId: string,
    facilityId: string,
    digest: `0x${string}`,
    reporter: string
  ): Promise<LedgerReceipt>;
  recordAttestationDigest(
    attestationId: string,
    observationId: string,
    digest: `0x${string}`,
    attester: string
  ): Promise<LedgerReceipt>;
  anchorServiceReceipt(
    receiptId: string,
    merkleRoot: `0x${string}`,
    facilityId: string,
    zone: string
  ): Promise<LedgerReceipt>;
  verifyDigest(recordId: string, digest: `0x${string}`): Promise<{
    verified: boolean;
    receipt?: LedgerReceipt;
    discrepancy?: string;
  }>;
}
