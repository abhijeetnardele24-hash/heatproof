import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  LocalDeterministicLedgerProvider,
  EvmLedgerProvider,
  UnifiedLedgerManager,
} from "../../src/ledger/ledgerProvider";
import { sha256Hex } from "../../src/privacy/evidenceHasher";

describe("Blockchain Proof Ledger Providers", () => {
  describe("LocalDeterministicLedgerProvider", () => {
    it("reports healthy network status with mode DETERMINISTIC_LOCAL", async () => {
      const provider = new LocalDeterministicLedgerProvider();
      const status = await provider.getNetworkStatus();

      expect(status.isAvailable).toBe(true);
      expect(status.mode).toBe("DETERMINISTIC_LOCAL");
      expect(status.blockHeight).toBeGreaterThan(1000000);
    });

    it("records observation digests and verifies cryptographic integrity", async () => {
      const provider = new LocalDeterministicLedgerProvider();
      const testDigest = sha256Hex("sample observation text");

      const receipt = await provider.recordObservationDigest(
        "obs-test-01",
        "fac-01",
        testDigest,
        "0x1111111111111111111111111111111111111111"
      );

      expect(receipt.recordId).toBe("obs-test-01");
      expect(receipt.recordType).toBe("OBSERVATION");
      expect(receipt.digest).toBe(testDigest);
      expect(receipt.status).toBe("CONFIRMED");
      expect(receipt.transactionHash).toMatch(/^0x[0-9a-f]{64}$/);

      // Verify correct digest
      const verification = await provider.verifyDigest("obs-test-01", testDigest);
      expect(verification.verified).toBe(true);
      expect(verification.receipt?.recordId).toBe("obs-test-01");

      // Verify tampered digest fails
      const tamperedDigest = sha256Hex("tampered data");
      const badVerification = await provider.verifyDigest("obs-test-01", tamperedDigest);
      expect(badVerification.verified).toBe(false);
      expect(badVerification.discrepancy).toContain("Digest mismatch");
    });

    it("records corroborating attestations and increments block height", async () => {
      const provider = new LocalDeterministicLedgerProvider();
      const statusBefore = await provider.getNetworkStatus();
      const testDigest = sha256Hex("sample attestation");

      const receipt = await provider.recordAttestationDigest(
        "att-test-01",
        "obs-test-01",
        testDigest,
        "0x2222222222222222222222222222222222222222"
      );

      expect(receipt.recordType).toBe("ATTESTATION");
      expect(receipt.blockNumber).toBe((statusBefore.blockHeight || 0) + 1);
    });

    it("anchors Adaptation Service Receipts with Merkle root", async () => {
      const provider = new LocalDeterministicLedgerProvider();
      const root = sha256Hex("sample merkle root");

      const receipt = await provider.anchorServiceReceipt(
        "asr-test-01",
        root,
        "fac-01",
        "Zone 1"
      );

      expect(receipt.recordType).toBe("ADAPTATION_SERVICE_RECEIPT");
      expect(receipt.digest).toBe(root);
      expect(receipt.notes).toContain("Zone 1");
    });
  });

  describe("EvmLedgerProvider", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("detects live EVM RPC when endpoint responds", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ result: "0x589b20" }), // 5806880 in decimal
      });

      const provider = new EvmLedgerProvider({
        rpcUrl: "https://sepolia.example.com",
        networkName: "Sepolia Mock",
      });

      const status = await provider.getNetworkStatus();
      expect(status.isAvailable).toBe(true);
      expect(status.mode).toBe("TESTNET_EVM");
      expect(status.blockHeight).toBe(5806880);

      const receipt = await provider.recordObservationDigest(
        "obs-evm-01",
        "fac-01",
        sha256Hex("test"),
        "0x1111"
      );
      expect(receipt.status).toBe("SUBMITTED");
      expect(receipt.explorerUrl).toContain("sepolia.etherscan.io");

      const attReceipt = await provider.recordAttestationDigest(
        "att-evm-01",
        "obs-evm-01",
        sha256Hex("att-test"),
        "0x2222"
      );
      expect(attReceipt.status).toBe("SUBMITTED");

      const asrReceipt = await provider.anchorServiceReceipt(
        "asr-evm-01",
        sha256Hex("merkle-root"),
        "fac-01",
        "Zone 1"
      );
      expect(asrReceipt.status).toBe("CONFIRMED");

      const verifyRes = await provider.verifyDigest("non-existent", sha256Hex("test"));
      expect(verifyRes.verified).toBe(false);
    });

    it("falls back to deterministic local provider when RPC fails", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("RPC Timeout"));

      const provider = new EvmLedgerProvider();
      const status = await provider.getNetworkStatus();

      expect(status.isAvailable).toBe(false);
      expect(status.mode).toBe("DETERMINISTIC_LOCAL");
      expect(status.rateLimitWarning).toBeDefined();

      const receipt = await provider.recordObservationDigest(
        "obs-fallback-01",
        "fac-01",
        sha256Hex("fallback test"),
        "0x1111"
      );
      expect(receipt.network).toBe("Local Secure Proof Log");
      expect(receipt.status).toBe("CONFIRMED");

      const attReceipt = await provider.recordAttestationDigest(
        "att-fallback-01",
        "obs-fallback-01",
        sha256Hex("fallback att"),
        "0x2222"
      );
      expect(attReceipt.network).toBe("Local Secure Proof Log");

      const asrReceipt = await provider.anchorServiceReceipt(
        "asr-fallback-01",
        sha256Hex("fallback root"),
        "fac-01",
        "Zone 1"
      );
      expect(asrReceipt.network).toBe("Local Secure Proof Log");
    });
  });

  describe("UnifiedLedgerManager", () => {
    it("provides a singleton instance with configurable provider", () => {
      const manager1 = UnifiedLedgerManager.getInstance();
      const manager2 = UnifiedLedgerManager.getInstance();
      expect(manager1).toBe(manager2);

      const localProvider = new LocalDeterministicLedgerProvider();
      manager1.setProvider(localProvider);
      expect(manager1.getProvider()).toBe(localProvider);
    });
  });
});
