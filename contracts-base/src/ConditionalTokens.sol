// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ConditionalTokens is ERC1155 {
    using SafeERC20 for IERC20;

    // --- State ---
    mapping(bytes32 => uint256) public payoutNumerators;
    mapping(bytes32 => uint256[]) internal payoutNumeratorsArr;
    mapping(bytes32 => uint256) public payoutDenominator;

    // --- Events ---
    event ConditionPreparation(
        bytes32 indexed conditionId,
        address indexed oracle,
        bytes32 indexed questionId,
        uint256 outcomeSlotCount
    );

    event ConditionResolution(
        bytes32 indexed conditionId,
        address indexed oracle,
        bytes32 indexed questionId,
        uint256 outcomeSlotCount,
        uint256[] payoutNumerators
    );

    event PositionSplit(
        address indexed stakeholder,
        IERC20 collateralToken,
        bytes32 indexed parentCollectionId,
        bytes32 indexed conditionId,
        uint256[] partition,
        uint256 amount
    );

    event PositionsMerge(
        address indexed stakeholder,
        IERC20 collateralToken,
        bytes32 indexed parentCollectionId,
        bytes32 indexed conditionId,
        uint256[] partition,
        uint256 amount
    );

    event PayoutRedemption(
        address indexed redeemer,
        IERC20 collateralToken,
        bytes32 indexed parentCollectionId,
        bytes32 indexed conditionId,
        uint256[] indexSets,
        uint256 payout
    );

    // --- Constructor ---
    constructor() ERC1155("") {}

    // --- Core Functions ---

    function prepareCondition(
        address oracle,
        bytes32 questionId,
        uint256 outcomeSlotCount
    ) external {
        require(outcomeSlotCount >= 2, "too few outcome slots");

        bytes32 conditionId = getConditionId(oracle, questionId, outcomeSlotCount);
        require(payoutNumeratorsArr[conditionId].length == 0, "condition already prepared");

        payoutNumeratorsArr[conditionId] = new uint256[](outcomeSlotCount);

        emit ConditionPreparation(conditionId, oracle, questionId, outcomeSlotCount);
    }

    function reportPayouts(bytes32 questionId, uint256[] calldata payouts) external {
        uint256 outcomeSlotCount = payouts.length;
        bytes32 conditionId = getConditionId(msg.sender, questionId, outcomeSlotCount);

        require(payoutNumeratorsArr[conditionId].length > 0, "condition not prepared");
        require(payoutDenominator[conditionId] == 0, "payout already reported");

        uint256 den = 0;
        for (uint256 i = 0; i < outcomeSlotCount; i++) {
            den += payouts[i];
            payoutNumeratorsArr[conditionId][i] = payouts[i];
        }
        require(den > 0, "payout is all zeros");

        payoutDenominator[conditionId] = den;

        emit ConditionResolution(
            conditionId,
            msg.sender,
            questionId,
            outcomeSlotCount,
            payoutNumeratorsArr[conditionId]
        );
    }

    function splitPosition(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata partition,
        uint256 amount
    ) external {
        uint256 outcomeSlotCount = payoutNumeratorsArr[conditionId].length;
        require(outcomeSlotCount > 0, "condition not prepared yet");

        uint256 fullIndexSet = (1 << outcomeSlotCount) - 1;
        uint256 freeIndexSet = fullIndexSet;

        uint256 partitionLength = partition.length;
        for (uint256 i = 0; i < partitionLength; i++) {
            uint256 indexSet = partition[i];
            require(indexSet > 0 && indexSet <= fullIndexSet, "got invalid index set");
            require((indexSet & freeIndexSet) == indexSet, "partition not disjoint");
            freeIndexSet ^= indexSet;
        }
        require(freeIndexSet == 0, "partition not exhaustive");

        if (parentCollectionId == bytes32(0)) {
            collateralToken.safeTransferFrom(msg.sender, address(this), amount);
        } else {
            uint256 parentPositionId = getPositionId(collateralToken, parentCollectionId);
            _burn(msg.sender, parentPositionId, amount);
        }

        for (uint256 i = 0; i < partitionLength; i++) {
            bytes32 collectionId = getCollectionId(parentCollectionId, conditionId, partition[i]);
            uint256 positionId = getPositionId(collateralToken, collectionId);
            _mint(msg.sender, positionId, amount, "");
        }

        emit PositionSplit(msg.sender, collateralToken, parentCollectionId, conditionId, partition, amount);
    }

    function mergePositions(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata partition,
        uint256 amount
    ) external {
        uint256 outcomeSlotCount = payoutNumeratorsArr[conditionId].length;
        require(outcomeSlotCount > 0, "condition not prepared yet");

        uint256 fullIndexSet = (1 << outcomeSlotCount) - 1;
        uint256 freeIndexSet = fullIndexSet;

        uint256 partitionLength = partition.length;
        for (uint256 i = 0; i < partitionLength; i++) {
            uint256 indexSet = partition[i];
            require(indexSet > 0 && indexSet <= fullIndexSet, "got invalid index set");
            require((indexSet & freeIndexSet) == indexSet, "partition not disjoint");
            freeIndexSet ^= indexSet;
        }
        require(freeIndexSet == 0, "partition not exhaustive");

        for (uint256 i = 0; i < partitionLength; i++) {
            bytes32 collectionId = getCollectionId(parentCollectionId, conditionId, partition[i]);
            uint256 positionId = getPositionId(collateralToken, collectionId);
            _burn(msg.sender, positionId, amount);
        }

        if (parentCollectionId == bytes32(0)) {
            collateralToken.safeTransfer(msg.sender, amount);
        } else {
            uint256 parentPositionId = getPositionId(collateralToken, parentCollectionId);
            _mint(msg.sender, parentPositionId, amount, "");
        }

        emit PositionsMerge(msg.sender, collateralToken, parentCollectionId, conditionId, partition, amount);
    }

    function redeemPositions(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata indexSets
    ) external {
        uint256 den = payoutDenominator[conditionId];
        require(den > 0, "result for condition not received yet");

        uint256 outcomeSlotCount = payoutNumeratorsArr[conditionId].length;
        uint256 totalPayout = 0;

        uint256 fullIndexSet = (1 << outcomeSlotCount) - 1;

        for (uint256 i = 0; i < indexSets.length; i++) {
            uint256 indexSet = indexSets[i];
            require(indexSet > 0 && indexSet <= fullIndexSet, "got invalid index set");

            bytes32 collectionId = getCollectionId(parentCollectionId, conditionId, indexSet);
            uint256 positionId = getPositionId(collateralToken, collectionId);

            uint256 payoutTokenBalance = balanceOf(msg.sender, positionId);

            if (payoutTokenBalance > 0) {
                uint256 payoutNum = 0;
                for (uint256 j = 0; j < outcomeSlotCount; j++) {
                    if (indexSet & (1 << j) != 0) {
                        payoutNum += payoutNumeratorsArr[conditionId][j];
                    }
                }

                uint256 payoutAmount = (payoutTokenBalance * payoutNum) / den;
                if (payoutAmount > 0) {
                    totalPayout += payoutAmount;
                }

                _burn(msg.sender, positionId, payoutTokenBalance);
            }
        }

        if (totalPayout > 0) {
            if (parentCollectionId == bytes32(0)) {
                collateralToken.safeTransfer(msg.sender, totalPayout);
            } else {
                uint256 parentPositionId = getPositionId(collateralToken, parentCollectionId);
                _mint(msg.sender, parentPositionId, totalPayout, "");
            }
        }

        emit PayoutRedemption(
            msg.sender,
            collateralToken,
            parentCollectionId,
            conditionId,
            indexSets,
            totalPayout
        );
    }

    // --- View / Pure Helpers ---

    function getOutcomeSlotCount(bytes32 conditionId) external view returns (uint256) {
        return payoutNumeratorsArr[conditionId].length;
    }

    function getConditionId(
        address oracle,
        bytes32 questionId,
        uint256 outcomeSlotCount
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(oracle, questionId, outcomeSlotCount));
    }

    function getCollectionId(
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256 indexSet
    ) public view returns (bytes32) {
        bytes32 hashVal = keccak256(abi.encodePacked(conditionId, indexSet));
        return bytes32(uint256(hashVal) + uint256(parentCollectionId));
    }

    function getPositionId(
        IERC20 collateralToken,
        bytes32 collectionId
    ) public pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(collateralToken, collectionId)));
    }
}
