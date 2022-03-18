//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./BDAI.sol";
import "./DAI.sol";
import "./USDC.sol";

contract stableBank {
    using SafeMath for uint256;

    uint256 borrowLimit = 90000000000000000000;

    BDAI public BdaiToken;
    DAI public DAIToken;
    USDC public USDCToken;

    struct userInfo {
        uint256 collateralAmount;
        uint256 debtAmount;
        uint256 availableToBorrow;
    }

    struct Borrow {
        uint256 collateralAmount;
        uint256 USDCBorrowed;
    }

    mapping(address => userInfo) public UserInfo;
    mapping(address => Borrow) public BorrowInfo;

    constructor(
        address _BdaiToken,
        address _DAIToken,
        address _USDCToken
    ) {
        BdaiToken = BDAI(_BdaiToken);
        DAIToken = DAI(_DAIToken);
        USDCToken = USDC(_USDCToken);
    }

    function deposit(uint256 _amountToDeposit) external {
        require(
            _amountToDeposit <= IERC20(DAIToken).balanceOf(msg.sender),
            "Insufficient funds"
        );

        userInfo storage updateUserInfo = UserInfo[msg.sender];

        // update collateralAmount
        updateUserInfo.collateralAmount = updateUserInfo.collateralAmount.add(
            _amountToDeposit
        );
        // update debtAmount
        updateUserInfo.debtAmount = updateUserInfo.debtAmount.add(
            _amountToDeposit
        );
        // update availableToBorrow
        updateUserInfo.availableToBorrow = DAIToBorrow(msg.sender);
        // transfer from user to contract
        IERC20(DAIToken).transferFrom(
            msg.sender,
            address(this),
            _amountToDeposit
        );
        // mint BDAI to user
        BdaiToken.mintBDAI(msg.sender, _amountToDeposit);
    }

    function borrowUSDC(uint256 _amountToBorrow) external {
        uint256 guaranteedAmount = _amountToBorrow.add(_amountToBorrow.div(10));
        userInfo storage updateUserInfo = UserInfo[msg.sender];
        Borrow storage updateBorrow = BorrowInfo[msg.sender];

        require(
            guaranteedAmount <= updateUserInfo.collateralAmount,
            "not enough collateral amount"
        );

        //update collateralAmount
        updateUserInfo.collateralAmount = updateUserInfo.collateralAmount.sub(
            guaranteedAmount
        );
        // update availableToBorrow
        updateUserInfo.availableToBorrow = DAIToBorrow(msg.sender);
        // update total USDCBorrowed
        updateBorrow.USDCBorrowed = updateBorrow.USDCBorrowed.add(
            _amountToBorrow
        );
        //update total collateralAmount in borrow info
        updateBorrow.collateralAmount = updateBorrow.collateralAmount.add(
            guaranteedAmount
        );
        // transfer USDC from contract to user
        IERC20(USDCToken).transfer(msg.sender, _amountToBorrow);
    }

    function rePayBorrowed(uint256 _repaymentAmount) external {
        userInfo storage updateUserInfo = UserInfo[msg.sender];
        Borrow storage updateBorrow = BorrowInfo[msg.sender];

        require(
            _repaymentAmount <= updateBorrow.USDCBorrowed,
            "You are paying more !"
        );

        uint256 guaranteedAmount = _repaymentAmount.add(
            _repaymentAmount.div(10)
        );
        // update new collateralAmount
        updateUserInfo.collateralAmount = updateUserInfo.collateralAmount.add(
            guaranteedAmount
        );
        // update new availableToBorrow
        updateUserInfo.availableToBorrow = DAIToBorrow(msg.sender);
        // update new USDCBorrowed
        updateBorrow.USDCBorrowed = updateBorrow.USDCBorrowed.sub(
            _repaymentAmount
        );
        //update new collateralAmount
        updateBorrow.collateralAmount = updateBorrow.collateralAmount.sub(
            guaranteedAmount
        );
        // transfer USDC from user to contract
        IERC20(USDCToken).transferFrom(
            msg.sender,
            address(this),
            _repaymentAmount
        );
    }

    function withdraw(uint256 _amountToWithdraw) external {
        userInfo storage updateUserInfo = UserInfo[msg.sender];

        require(
            _amountToWithdraw <= updateUserInfo.collateralAmount,
            "withdraw limit exceeded"
        );
        require(
            IERC20(BdaiToken).balanceOf(msg.sender) >=
                updateUserInfo.debtAmount &&
                _amountToWithdraw <= updateUserInfo.debtAmount,
            "withdraw limit exceeded"
        );

        // update collateralAmount
        updateUserInfo.collateralAmount = updateUserInfo.collateralAmount.sub(
            _amountToWithdraw
        );
        // update debtAmount
        updateUserInfo.debtAmount = updateUserInfo.debtAmount.sub(
            _amountToWithdraw
        );
        // update availableToBorrow
        updateUserInfo.availableToBorrow = DAIToBorrow(msg.sender);

        IERC20(DAIToken).transfer(msg.sender, _amountToWithdraw);
        BdaiToken.burnDAI(msg.sender, _amountToWithdraw);
    }

    function DAIToBorrow(address _user) public view returns (uint256) {
        uint256 usercollateralAmount = UserInfo[_user].collateralAmount;
        uint256 allowedToBorrow = usercollateralAmount.sub(
            usercollateralAmount.div(10)
        );
        return allowedToBorrow;
    }
}
