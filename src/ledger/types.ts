/**
 * Truthful Blockchain Proof Ledger Types & Interfaces
 *
 * Enforces explicit separation between local cryptographic proof-log entries
 * and confirmed on-chain EVM transactions.
 */

import { z } from "zod";

/**
 * Formal operating modes for the HeatProof proof ledger:
 * - LOCAL_DEMO: Operating on client-side deterministic SHA-256 append-only proof log.
 * - TESTNET_PENDING_SIGNATURE: Web3 wallet interaction requested; awaiting human signature approval.
 * - TESTNET_CONFIRMED: Real EVM transaction broadcast and confirmed by RPC receipt.
 * - DEGRADED: RPC unreachable, chain mismatch, or wallet rejected.
 */
export const LedgerOperatingModeSchema = z.enum([
  "LOCAL_DEMO",
  "TESTNET_PENDING_SIGNATURE",
  "TESTNET_CONFIRMED",
  "DEGRADED",
]);
export type LedgerOperatingMode = z.infer<typeof LedgerOperatingModeSchema>;

export const RecordTypeSchema = z.enum([
  "OBSERVATION",
  "ATTESTATION",
  "ADAPTATION_SERVICE_RECEIPT",
]);
export type RecordType = z.infer<typeof RecordTypeSchema>;

export const ProofRecordStatusSchema = z.enum([
  "LOCAL_RECORDED",
  "SUBMITTED",
  "CONFIRMED",
  "ONCHAIN_CONFIRMED",
  "FAILED",
]);
export type ProofRecordStatus = z.infer<typeof ProofRecordStatusSchema>;

/**
 * Universal Proof Record Schema
 * Truthfully distinguishes local proof log entries from real EVM transactions.
 */
export const ProofRecordSchema = z.object({
  recordId: z.string().min(1),
  recordType: RecordTypeSchema,
  facilityId: z.string().min(1),
  /** Canonical 32-byte SHA-256 digest of sanitized preimage payload */
  recordDigest: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  
  /** Operating mode under which this record was created */
  mode: LedgerOperatingModeSchema,

  /** Record status */
  status: ProofRecordStatusSchema.default("CONFIRMED"),

  /** Whether this record represents a real confirmed on-chain EVM transaction */
  isEvmTransaction: z.boolean(),

  /**
   * For EVM transactions: real transaction hash returned by the chain.
   * For LOCAL_DEMO: null (never spoof an EVM hash).
   */
  transactionHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/).nullable(),

  /**
   * For LOCAL_DEMO: SHA-256 hash of this entry in the local hash-chain sequence.
   */
  localProofHash: z.string().regex(/^(0x)?[0-9a-fA-F]{64}$/).nullable(),

  /** Local sequence index or on-chain block number */
  sequenceNumber: z.number().int().nonnegative(),
  blockNumber: z.number().int().nonnegative().optional(),

  /** ISO-8601 timestamp */
  timestamp: z.string().datetime(),

  /** Submitter wallet address or local witness identifier */
  attesterOrReporter: z.string().min(1),

  /** Target network name (e.g. "Local Secure Proof Log (SHA-256 Chain)" or "Arbitrum Sepolia") */
  network: z.string().min(1),

  /** EVM Chain ID if applicable (e.g. 421614 for Arbitrum Sepolia) */
  chainId: z.number().int().optional(),

  /** Block explorer URL. MUST BE NULL unless isEvmTransaction === true and transactionHash is confirmed */
  explorerUrl: z.string().url().nullable(),

  /** Human-readable audit explanation of what was proved */
  explanation: z.string().min(1),

  /** Optional context notes */
  notes: z.string().optional(),
});
export type ProofRecord = z.infer<typeof ProofRecordSchema>;

/** Legacy alias for backwards compatibility during migration */
export type LedgerReceipt = ProofRecord;

export interface LedgerNetworkStatus {
  providerName: string;
  networkName: string;
  chainId?: number;
  isAvailable: boolean;
  blockHeight?: number;
  latencyMs?: number;
  mode: LedgerOperatingMode;
  rateLimitWarning?: string;
  walletConnected?: boolean;
  walletAddress?: string;
}

/** Legacy alias */
export type NetworkStatus = LedgerNetworkStatus;

export interface ProofLedgerProvider {
  getNetworkStatus(): Promise<LedgerNetworkStatus>;
  recordObservationDigest(
    observationId: string,
    facilityId: string,
    digest: `0x${string}`,
    reporter?: string
  ): Promise<ProofRecord>;
  recordAttestationDigest(
    attestationId: string,
    observationId: string,
    facilityIdOrDigest: string,
    digestOrAttester?: `0x${string}` | string,
    maybeAttester?: string
  ): Promise<ProofRecord>;
  anchorServiceReceipt(
    receiptId: string,
    merkleRoot: `0x${string}`,
    facilityId: string,
    zone?: string
  ): Promise<ProofRecord>;
  verifyDigest(recordId: string, digest: `0x${string}`): Promise<{
    verified: boolean;
    record?: ProofRecord;
    discrepancy?: string;
  }>;
}
