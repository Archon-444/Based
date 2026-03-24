// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IOptimisticOracleV3} from "../../src/interfaces/IOptimisticOracleV3.sol";

interface IAssertionCallback {
    function assertionResolvedCallback(bytes32 assertionId, bool assertedTruthfully) external;
    function assertionDisputedCallback(bytes32 assertionId) external;
}

contract MockOptimisticOracleV3 is IOptimisticOracleV3 {
    struct AssertionData {
        address callbackRecipient;
        address asserter;
        IERC20 currency;
        uint256 bond;
        bool settled;
    }

    mapping(bytes32 => AssertionData) public assertions;
    uint256 public nextAssertionId = 1;

    function assertTruth(
        bytes calldata, /* claim */
        address asserter,
        address callbackRecipient,
        address, /* escalationManager */
        uint64, /* liveness */
        IERC20 currency,
        uint256 bond,
        bytes32, /* identifier */
        bytes32 /* domainId */
    ) external returns (bytes32 assertionId) {
        assertionId = bytes32(nextAssertionId++);
        assertions[assertionId] = AssertionData({
            callbackRecipient: callbackRecipient,
            asserter: asserter,
            currency: currency,
            bond: bond,
            settled: false
        });
        currency.transferFrom(msg.sender, address(this), bond);
    }

    function settleAssertion(bytes32 assertionId) external {
        AssertionData storage data = assertions[assertionId];
        data.settled = true;
        IAssertionCallback(data.callbackRecipient).assertionResolvedCallback(assertionId, true);
    }

    function disputeAssertion(bytes32 assertionId, address /* disputeAsserter */) external {
        AssertionData storage data = assertions[assertionId];
        IAssertionCallback(data.callbackRecipient).assertionDisputedCallback(assertionId);
    }

    function defaultIdentifier() external pure returns (bytes32) {
        return bytes32("ASSERT_TRUTH");
    }

    // ---- Test helpers ----

    function mockSettle(bytes32 assertionId, bool truthful) external {
        AssertionData storage data = assertions[assertionId];
        data.settled = true;
        IAssertionCallback(data.callbackRecipient).assertionResolvedCallback(assertionId, truthful);
    }

    function mockDispute(bytes32 assertionId) external {
        AssertionData storage data = assertions[assertionId];
        IAssertionCallback(data.callbackRecipient).assertionDisputedCallback(assertionId);
    }
}
