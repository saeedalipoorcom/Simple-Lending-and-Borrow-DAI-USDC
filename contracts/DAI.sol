//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DAI is ERC20, Ownable {
    constructor() ERC20("DAI", "DAI") {
        _mint(msg.sender, 1000000000000000000000);
    }
}
