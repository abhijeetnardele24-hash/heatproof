import { describe, it, expect } from "vitest";
import { encodeFunctionData, decodeFunctionData } from "viem";
import HeatProofAnchorAbi from "../../src/ledger/abi/HeatProofAnchor.json";
import { sha256Hex } from "../../src/privacy/evidenceHasher";

describe("HeatProofAnchor Smart Contract Interface & ABI", () => {
  const dummyDigest = sha256Hex("test evidence string");
  const dummyFacilityId = "fac-central-library-cooling";

  it("exports valid ABI with AdaptationProofAnchored and AdaptationServiceReceiptAnchored events", () => {
    expect(HeatProofAnchorAbi).toBeDefined();
    expect(Array.isArray(HeatProofAnchorAbi)).toBe(true);

    const anchorEvent = HeatProofAnchorAbi.find(
      (item: any) => item.type === "event" && item.name === "AdaptationProofAnchored"
    );
    expect(anchorEvent).toBeDefined();

    const receiptEvent = HeatProofAnchorAbi.find(
      (item: any) => item.type === "event" && item.name === "AdaptationServiceReceiptAnchored"
    );
    expect(receiptEvent).toBeDefined();
  });

  it("correctly encodes anchorProof calldata", () => {
    // RecordType: available = 0
    const calldata = encodeFunctionData({
      abi: HeatProofAnchorAbi,
      functionName: "anchorProof",
      args: [dummyDigest, dummyFacilityId, 0],
    });

    expect(calldata).toMatch(/^0x[0-9a-fA-F]+$/);

    const decoded = decodeFunctionData({
      abi: HeatProofAnchorAbi,
      data: calldata,
    });

    expect(decoded.functionName).toBe("anchorProof");
    expect(decoded.args?.[0]).toBe(dummyDigest);
    expect(decoded.args?.[1]).toBe(dummyFacilityId);
    expect(decoded.args?.[2]).toBe(0);
  });

  it("correctly encodes anchorReceipt calldata", () => {
    const merkleRoot = sha256Hex("root merkle proof");
    const calldata = encodeFunctionData({
      abi: HeatProofAnchorAbi,
      functionName: "anchorReceipt",
      args: [merkleRoot, "asr-001", dummyFacilityId, 100n, 120n],
    });

    expect(calldata).toMatch(/^0x[0-9a-fA-F]+$/);

    const decoded = decodeFunctionData({
      abi: HeatProofAnchorAbi,
      data: calldata,
    });

    expect(decoded.functionName).toBe("anchorReceipt");
    expect(decoded.args?.[0]).toBe(merkleRoot);
    expect(decoded.args?.[1]).toBe("asr-001");
    expect(decoded.args?.[2]).toBe(dummyFacilityId);
    expect(decoded.args?.[3]).toBe(100n);
    expect(decoded.args?.[4]).toBe(120n);
  });
});
