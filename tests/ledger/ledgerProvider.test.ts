import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  LocalDeterministicLedgerProvider,
  EvmBrowserWalletLedgerProvider,
  UnifiedLedgerManager,
} from "../../src/ledger/ledgerProvider";
import { sha256Hex } from "../../src/privacy/evidenceHasher";

describe("Blockchain Proof Ledger Providers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete (window as unknown as { ethereum?: unknown }).ethereum;
  });

  describe("LocalDeterministicLedgerProvider", () => {
    it("reports healthy network status with mode LOCAL_DEMO", async () => {
      const provider = new LocalDeterministicLedgerProvider();
      const status = await provider.getNetworkStatus();

      expect(status.isAvailable).toBe(true);
      expect(status.mode).toBe("LOCAL_DEMO");
      expect(status.blockHeight).toBeGreaterThanOrEqual(1000000);
      expect(status.networkName).toBe("Local Deterministic Proof Log (Demo)");
    });

    it("records observation digest without fake EVM transaction hash or explorer URL", async () => {
      const provider = new LocalDeterministicLedgerProvider();
      const testDigest = sha256Hex("sample observation text");

      const record = await provider.recordObservationDigest(
        "obs-test-01",
        "fac-01",
        testDigest,
        "0x1111111111111111111111111111111111111111"
      );

      expect(record.recordId).toBe("obs-test-01");
      expect(record.recordType).toBe("OBSERVATION");
      expect(record.recordDigest).toBe(testDigest);
      expect(record.status).toBe("LOCAL_RECORDED");
      expect(record.isEvmTransaction).toBe(false);
      expect(record.transactionHash).toBeNull();
      expect(record.explorerUrl).toBeNull();
      expect(record.localProofHash).toMatch(/^[0-9a-f]{64}$/);

      // Verify correct digest
      const verification = await provider.verifyDigest("obs-test-01", testDigest);
      expect(verification.verified).toBe(true);
      expect(verification.record?.recordId).toBe("obs-test-01");

      // Verify tampered digest fails
      const tamperedDigest = sha256Hex("tampered data");
      const badVerification = await provider.verifyDigest("obs-test-01", tamperedDigest);
      expect(badVerification.verified).toBe(false);
      expect(badVerification.discrepancy).toContain("Digest mismatch");
    });

    it("proves locally computed hash is NEVER shown as an EVM transaction", async () => {
      const provider = new LocalDeterministicLedgerProvider();
      const testDigest = sha256Hex("another test");

      const record = await provider.recordObservationDigest("obs-safe-01", "fac-safe", testDigest);
      expect(record.isEvmTransaction).toBe(false);
      expect(record.transactionHash).toBeNull();
      expect(record.explorerUrl).toBeNull();
      // localProofHash must not be prefixed with EVM 0x tx format
      expect(record.localProofHash).not.toMatch(/^0x/);
    });

    it("records corroborating attestations and increments local sequence height", async () => {
      const provider = new LocalDeterministicLedgerProvider();
      const statusBefore = await provider.getNetworkStatus();
      const testDigest = sha256Hex("sample attestation");

      const record = await provider.recordAttestationDigest(
        "att-test-01",
        "obs-test-01",
        testDigest,
        "0x2222222222222222222222222222222222222222"
      );

      expect(record.recordType).toBe("ATTESTATION");
      expect(record.blockNumber).toBe((statusBefore.blockHeight || 0) + 1);
    });

    it("anchors Adaptation Service Receipts with Merkle root without external explorer URL", async () => {
      const provider = new LocalDeterministicLedgerProvider();
      const root = sha256Hex("sample merkle root");

      const record = await provider.anchorServiceReceipt(
        "asr-test-01",
        root,
        "fac-01",
        "Zone 1"
      );

      expect(record.recordType).toBe("ADAPTATION_SERVICE_RECEIPT");
      expect(record.recordDigest).toBe(root);
      expect(record.notes).toContain("Zone 1");
      expect(record.explorerUrl).toBeNull();
    });
  });

  describe("EvmBrowserWalletLedgerProvider (Real EIP-1193)", () => {
    it("reports DEGRADED when window.ethereum is not installed", async () => {
      const provider = new EvmBrowserWalletLedgerProvider();
      const status = await provider.getNetworkStatus();

      expect(status.isAvailable).toBe(false);
      expect(status.mode).toBe("DEGRADED");
      expect(status.rateLimitWarning).toContain("No EIP-1193 browser wallet detected");
    });

    it("proves an RPC health check alone CANNOT create an onchain receipt", async () => {
      // Mock window.ethereum with RPC methods responding to block height
      const mockEthereum = {
        request: vi.fn().mockImplementation(async ({ method }) => {
          if (method === "eth_blockNumber") return "0x66eee";
          if (method === "eth_chainId") return "0x66eee";
          return null;
        }),
      };
      (window as unknown as { ethereum?: unknown }).ethereum = mockEthereum;

      const provider = new EvmBrowserWalletLedgerProvider();
      const status = await provider.getNetworkStatus();

      expect(status.isAvailable).toBe(true);
      // RPC check does not sign or anchor receipts
      expect(status.mode).toBe("TESTNET_PENDING_SIGNATURE");
      expect(status.blockHeight).toBe(421614);
    });

    it("handles chain mismatch by requesting wallet_switchEthereumChain to Arbitrum Sepolia (421614)", async () => {
      let currentChain = "0x1"; // Ethereum Mainnet
      const mockEthereum = {
        request: vi.fn().mockImplementation(async ({ method, params }) => {
          if (method === "eth_chainId") return currentChain;
          if (method === "eth_accounts") return ["0x1111111111111111111111111111111111111111"];
          if (method === "wallet_switchEthereumChain") {
            expect(params[0].chainId).toBe("0x66eee"); // 421614 in hex
            currentChain = "0x66eee";
            return null;
          }
          if (method === "eth_blockNumber") return "0x1000";
          return null;
        }),
      };
      (window as unknown as { ethereum?: unknown }).ethereum = mockEthereum;

      const provider = new EvmBrowserWalletLedgerProvider();
      const status = await provider.getNetworkStatus();
      expect(status.chainId).toBe(421614);
      expect(mockEthereum.request).toHaveBeenCalledWith(
        expect.objectContaining({ method: "wallet_switchEthereumChain" })
      );
    });

    it("proves rejected wallet signatures do NOT mutate confirmed state or claim receipt", async () => {
      const mockEthereum = {
        request: vi.fn().mockImplementation(async ({ method }) => {
          if (method === "eth_chainId") return "0x66eee";
          if (method === "eth_accounts") return ["0x1111111111111111111111111111111111111111"];
          if (method === "eth_requestAccounts") return ["0x1111111111111111111111111111111111111111"];
          if (method === "eth_sendTransaction") {
            const err = new Error("User rejected the transaction");
            (err as unknown as { code: number }).code = 4001;
            throw err;
          }
          return null;
        }),
      };
      (window as unknown as { ethereum?: unknown }).ethereum = mockEthereum;

      const provider = new EvmBrowserWalletLedgerProvider();
      const digest = sha256Hex("test rejection");

      await expect(
        provider.recordObservationDigest("obs-reject-01", "fac-01", digest)
      ).rejects.toThrow("User rejected the transaction");

      // Verify no confirmed record exists
      const verification = await provider.verifyDigest("obs-reject-01", digest);
      expect(verification.verified).toBe(false);
      expect(verification.discrepancy).toMatch(/No (proof log entry|record) found/);
    });

    it("proves explorer URL appears ONLY for a confirmed real receipt returned by target chain", async () => {
      const realTxHash = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
      const realBlockNumber = "0x589b20"; // 5806880

      const mockEthereum = {
        request: vi.fn().mockImplementation(async ({ method, params }) => {
          if (method === "eth_chainId") return "0x66eee";
          if (method === "eth_accounts") return ["0x1111111111111111111111111111111111111111"];
          if (method === "eth_requestAccounts") return ["0x1111111111111111111111111111111111111111"];
          if (method === "eth_sendTransaction") return realTxHash;
          if (method === "eth_getTransactionReceipt") {
            expect(params[0]).toBe(realTxHash);
            return {
              transactionHash: realTxHash,
              blockNumber: realBlockNumber,
              status: "0x1",
            };
          }
          return null;
        }),
      };
      (window as unknown as { ethereum?: unknown }).ethereum = mockEthereum;

      const provider = new EvmBrowserWalletLedgerProvider();
      const digest = sha256Hex("real confirmed test");

      const record = await provider.recordObservationDigest("obs-real-01", "fac-01", digest);

      expect(record.status).toBe("ONCHAIN_CONFIRMED");
      expect(record.isEvmTransaction).toBe(true);
      expect(record.transactionHash).toBe(realTxHash);
      expect(record.blockNumber).toBe(5806880);
      expect(record.explorerUrl).toBe(`https://sepolia.arbiscan.io/tx/${realTxHash}`);

      // Verification succeeds with real record
      const verification = await provider.verifyDigest("obs-real-01", digest);
      expect(verification.verified).toBe(true);
      expect(verification.record?.transactionHash).toBe(realTxHash);
    });

    it("leaves failed broadcasts in pending or degraded mode if receipt reverts", async () => {
      const failedTxHash = "0xdeadbeef1234567890deadbeef1234567890deadbeef1234567890deadbeef12";

      const mockEthereum = {
        request: vi.fn().mockImplementation(async ({ method }) => {
          if (method === "eth_chainId") return "0x66eee";
          if (method === "eth_accounts") return ["0x1111111111111111111111111111111111111111"];
          if (method === "eth_requestAccounts") return ["0x1111111111111111111111111111111111111111"];
          if (method === "eth_sendTransaction") return failedTxHash;
          if (method === "eth_getTransactionReceipt") {
            return {
              transactionHash: failedTxHash,
              blockNumber: "0x10",
              status: "0x0", // reverted
            };
          }
          return null;
        }),
      };
      (window as unknown as { ethereum?: unknown }).ethereum = mockEthereum;

      const provider = new EvmBrowserWalletLedgerProvider();
      const digest = sha256Hex("reverted tx");

      await expect(
        provider.recordObservationDigest("obs-revert-01", "fac-01", digest)
      ).rejects.toThrow("reverted on Arbitrum Sepolia");
    });

    it("adds Arbitrum Sepolia when switch returns 4902 (chain not added)", async () => {
      const mockEthereum = {
        request: vi.fn().mockImplementation(async ({ method }) => {
          if (method === "wallet_switchEthereumChain") {
            const err = new Error("Unrecognized chain");
            (err as unknown as { code: number }).code = 4902;
            throw err;
          }
          if (method === "wallet_addEthereumChain") {
            return null;
          }
          return null;
        }),
      };

      const provider = new EvmBrowserWalletLedgerProvider(mockEthereum);
      const res = await provider.ensureArbitrumSepolia();
      expect(res).toBe(true);
      expect(mockEthereum.request).toHaveBeenCalledWith(
        expect.objectContaining({ method: "wallet_addEthereumChain" })
      );
    });

    it("records attestation broadcast to Arbitrum Sepolia", async () => {
      const txHash = "0x7777777777777777777777777777777777777777777777777777777777777777";
      const mockEthereum = {
        request: vi.fn().mockImplementation(async ({ method }) => {
          if (method === "eth_chainId") return "0x66eee";
          if (method === "eth_accounts") return ["0x1111111111111111111111111111111111111111"];
          if (method === "eth_requestAccounts") return ["0x1111111111111111111111111111111111111111"];
          if (method === "eth_sendTransaction") return txHash;
          return null;
        }),
      };

      const provider = new EvmBrowserWalletLedgerProvider(mockEthereum);
      const digest = sha256Hex("attestation-evm");
      const record = await provider.recordAttestationDigest("att-01", "obs-01", "fac-01", digest);

      expect(record.status).toBe("SUBMITTED");
      expect(record.isEvmTransaction).toBe(true);
      expect(record.transactionHash).toBe(txHash);
    });

    it("anchors service receipt via local fallback and verifies properly", async () => {
      const provider = new EvmBrowserWalletLedgerProvider();
      const root = sha256Hex("root-digest");
      const record = await provider.anchorServiceReceipt("asr-01", root, "fac-01", "Zone 1");

      expect(record.recordType).toBe("ADAPTATION_SERVICE_RECEIPT");
      expect(record.recordDigest).toBe(root);

      const verify = await provider.verifyDigest("asr-01", root);
      expect(verify.verified).toBe(true);
    });
  });

  describe("UnifiedLedgerManager", () => {
    it("provides a singleton instance with default LocalDeterministicLedgerProvider", async () => {
      const manager1 = UnifiedLedgerManager.getInstance();
      const manager2 = UnifiedLedgerManager.getInstance();
      expect(manager1).toBe(manager2);

      expect(manager1.getMode()).toBe("LOCAL_DEMO");
      const localProvider = new LocalDeterministicLedgerProvider();
      manager1.setProvider(localProvider);
      expect(manager1.getProvider()).toBe(localProvider);

      const status = await manager1.getStatus();
      expect(status.mode).toBe("LOCAL_DEMO");

      const obsDigest = sha256Hex("unified-obs");
      const obsRecord = await manager1.recordObservation("obs-u1", "fac-01", obsDigest);
      expect(obsRecord.recordId).toBe("obs-u1");

      const attDigest = sha256Hex("unified-att");
      const attRecord = await manager1.recordAttestation("att-u1", "obs-u1", "fac-01", attDigest);
      expect(attRecord.recordId).toBe("att-u1");

      const asrRecord = await manager1.anchorReceipt("asr-u1", obsDigest, "fac-01", "Zone 1");
      expect(asrRecord.recordId).toBe("asr-u1");

      const verified = await manager1.verify("obs-u1", obsDigest);
      expect(verified.verified).toBe(true);

      manager1.setPreferTestnet(true);
      expect(manager1.getMode()).toBe("TESTNET_PENDING_SIGNATURE");
      manager1.setPreferTestnet(false);
    });
  });
});
