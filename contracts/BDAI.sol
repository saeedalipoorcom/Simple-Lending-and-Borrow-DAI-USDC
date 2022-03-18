//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BDAI is ERC20, Ownable {
    constructor() ERC20("BDAI", "BDAI") {}

    function mintBDAI(address account, uint256 amount)
        external
        onlyOwner
        returns (bool)
    {
        _mint(account, amount);
        return true;
    }

    function burnDAI(address account, uint256 amount)
        external
        onlyOwner
        returns (bool)
    {
        _burn(account, amount);
        return true;
    }
}
