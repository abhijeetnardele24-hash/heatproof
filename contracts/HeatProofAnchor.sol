// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title HeatProofAnchor
 * @notice Minimal audited contract for anchoring verifiable extreme-heat adaptation proof digests on Arbitrum Sepolia.
 * @dev Records SHA-256 evidence digests and Merkle roots with block timestamps and attester addresses.
 */
contract HeatProofAnchor {
    /// @notice Emitted when a physical adaptation proof digest is anchored on-chain
    event AdaptationProofAnchored(
        bytes32 indexed evidenceDigest,
        string facilityId,
        uint8 operationalState,
        uint256 timestamp,
        address indexed attester
    );

    /// @notice Emitted when an Adaptation Service Receipt (ASR) Merkle root is anchored
    event AdaptationServiceReceiptAnchored(
        bytes32 indexed merkleRoot,
        string receiptId,
        string facilityId,
        uint256 protectedPopulation,
        uint256 litersDispensed,
        uint256 timestamp,
        address indexed submitter
    );

    /// @notice Registry of already anchored evidence digests to prevent replay
    mapping(bytes32 => bool) public anchoredDigests;

    /// @notice Total count of anchored proofs
    uint256 public totalAnchoredProofs;

    /**
     * @notice Anchor a canonical evidence digest for a facility observation or corroboration
     * @param evidenceDigest 32-byte SHA-256 digest of sanitized preimage payload
     * @param facilityId Canonical facility identifier (e.g., fac-pune-mandai-01)
     * @param operationalState Operational state enum (0: available, 1: uncertain, 2: unavailable)
     */
    function anchorProof(
        bytes32 evidenceDigest,
        string calldata facilityId,
        uint8 operationalState
    ) external {
        require(evidenceDigest != bytes32(0), "Invalid evidence digest: zero hash");
        require(!anchoredDigests[evidenceDigest], "Digest already anchored on-chain");

        anchoredDigests[evidenceDigest] = true;
        totalAnchoredProofs += 1;

        emit AdaptationProofAnchored(
            evidenceDigest,
            facilityId,
            operationalState,
            block.timestamp,
            msg.sender
        );
    }

    /**
     * @notice Anchor an aggregated Adaptation Service Receipt (ASR) Merkle root
     * @param merkleRoot 32-byte binary Merkle root
     * @param receiptId Unique receipt UUID
     * @param facilityId Target facility ID
     * @param protectedPopulation Beneficiary count
     * @param litersDispensed Potable water volume
     */
    function anchorReceipt(
        bytes32 merkleRoot,
        string calldata receiptId,
        string calldata facilityId,
        uint256 protectedPopulation,
        uint256 litersDispensed
    ) external {
        require(merkleRoot != bytes32(0), "Invalid Merkle root: zero hash");
        require(!anchoredDigests[merkleRoot], "Receipt root already anchored");

        anchoredDigests[merkleRoot] = true;
        totalAnchoredProofs += 1;

        emit AdaptationServiceReceiptAnchored(
            merkleRoot,
            receiptId,
            facilityId,
            protectedPopulation,
            litersDispensed,
            block.timestamp,
            msg.sender
        );
    }

    /**
     * @notice Check whether a given evidence digest or Merkle root is anchored
     * @param digest 32-byte hash to query
     */
    function isAnchored(bytes32 digest) external view returns (bool) {
        return anchoredDigests[digest];
    }
}
