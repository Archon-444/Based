// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPyth} from "../../src/interfaces/IPyth.sol";

contract MockPyth is IPyth {
    mapping(bytes32 => IPyth.Price) internal prices;
    uint256 public updateFee;

    constructor() {
        updateFee = 1;
    }

    // ---- Test helpers ----

    function setPrice(bytes32 feedId, int64 price, int32 expo) external {
        prices[feedId] = IPyth.Price({
            price: price,
            conf: 0,
            expo: expo,
            publishTime: block.timestamp
        });
    }

    function setUpdateFee(uint256 fee) external {
        updateFee = fee;
    }

    // ---- IPyth implementation ----

    function getPriceNoOlderThan(bytes32 id, uint256 /* age */) external view returns (IPyth.Price memory) {
        return prices[id];
    }

    function getUpdateFee(bytes[] calldata /* updateData */) external view returns (uint256) {
        return updateFee;
    }

    function updatePriceFeeds(bytes[] calldata /* updateData */) external payable {}

    receive() external payable {}
}
