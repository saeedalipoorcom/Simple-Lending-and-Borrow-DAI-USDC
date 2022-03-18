const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("", async () => {
  let DAIContract;
  let USDCContract;
  let BDAIContract;
  let stableBankContract;

  let owner;
  let userInfo;
  let BorrowInfo;
  let borrowTX;
  let rePayTX;
  let withdrawTX;

  describe("DEPOSIT ,BORROW , REPAY , WITH :D", function () {
    it("we can deposit", async function () {
      // get account address
      [owner] = await ethers.getSigners();

      // deploy DAIContract
      const DAI = await ethers.getContractFactory("DAI");
      DAIContract = await DAI.deploy();
      await DAIContract.deployed();
      expect(await DAIContract.balanceOf(owner.address)).to.equal(
        ethers.utils.parseEther("1000")
      );

      // deploy USDCContract
      const USDC = await ethers.getContractFactory("USDC");
      USDCContract = await USDC.deploy();
      await USDCContract.deployed();

      // deploy BDAIContract
      const BDAI = await ethers.getContractFactory("BDAI");
      BDAIContract = await BDAI.deploy();
      await BDAIContract.deployed();

      // deploy stableBankContract
      const stableBank = await ethers.getContractFactory("stableBank");
      stableBankContract = await stableBank.deploy(
        BDAIContract.address,
        DAIContract.address,
        USDCContract.address
      );
      await stableBankContract.deployed();
      await USDCContract.mintUSDC(
        stableBankContract.address,
        ethers.utils.parseEther("1000")
      );
      expect(await USDCContract.balanceOf(stableBankContract.address)).to.equal(
        ethers.utils.parseEther("1000")
      );

      // change BDAIContract owner
      const changeOwner = await BDAIContract.transferOwnership(
        stableBankContract.address
      );
      await changeOwner.wait();

      // DEPOSIT DAI
      await DAIContract.approve(
        stableBankContract.address,
        ethers.utils.parseEther("500")
      );

      const depositTX = await stableBankContract.deposit(
        ethers.utils.parseEther("500")
      );
      await depositTX.wait();

      expect(await DAIContract.balanceOf(owner.address)).to.equal(
        ethers.utils.parseEther("500")
      );
      expect(await DAIContract.balanceOf(stableBankContract.address)).to.equal(
        ethers.utils.parseEther("500")
      );
      expect(await BDAIContract.balanceOf(owner.address)).to.equal(
        ethers.utils.parseEther("500")
      );

      userInfo = await stableBankContract.UserInfo(owner.address);
      expect(userInfo[0]).to.equal(ethers.utils.parseEther("500"));
      expect(userInfo[1]).to.equal(ethers.utils.parseEther("500"));
      expect(userInfo[2]).to.equal(ethers.utils.parseEther("450"));

      expect(await stableBankContract.DAIToBorrow(owner.address)).to.equal(
        ethers.utils.parseEther("450")
      );
    });

    it("we can borrow", async function () {
      await expect(
        stableBankContract.withdraw(ethers.utils.parseEther("501"))
      ).to.be.revertedWith("withdraw limit exceeded");

      await expect(
        stableBankContract.rePayBorrowed(ethers.utils.parseEther("501"))
      ).to.be.revertedWith("You are paying more !");

      borrowTX = await stableBankContract.borrowUSDC(
        ethers.utils.parseEther("200")
      );
      await borrowTX.wait();

      BorrowInfo = await stableBankContract.BorrowInfo(owner.address);
      expect(BorrowInfo[0]).to.equal(ethers.utils.parseEther("220"));
      expect(BorrowInfo[1]).to.equal(ethers.utils.parseEther("200"));

      userInfo = await stableBankContract.UserInfo(owner.address);
      expect(userInfo[0]).to.equal(ethers.utils.parseEther("280"));
      expect(userInfo[1]).to.equal(ethers.utils.parseEther("500"));
      expect(userInfo[2]).to.equal(ethers.utils.parseEther("252"));

      borrowTX = await stableBankContract.borrowUSDC(
        ethers.utils.parseEther("252")
      );
      await borrowTX.wait();

      BorrowInfo = await stableBankContract.BorrowInfo(owner.address);
      expect(BorrowInfo[0]).to.above(ethers.utils.parseEther("495"));
      expect(BorrowInfo[1]).to.equal(ethers.utils.parseEther("452"));

      userInfo = await stableBankContract.UserInfo(owner.address);
      expect(userInfo[0]).to.be.below(ethers.utils.parseEther("5"));
      expect(userInfo[1]).to.equal(ethers.utils.parseEther("500"));
      expect(userInfo[2]).to.be.below(ethers.utils.parseEther("5"));
    });

    it("we can repay", async function () {
      await expect(
        stableBankContract.withdraw(ethers.utils.parseEther("200"))
      ).to.be.revertedWith("withdraw limit exceeded");

      await expect(
        stableBankContract.rePayBorrowed(ethers.utils.parseEther("501"))
      ).to.be.revertedWith("You are paying more !");

      await USDCContract.approve(
        stableBankContract.address,
        ethers.utils.parseEther("200")
      );
      rePayTX = await stableBankContract.rePayBorrowed(
        ethers.utils.parseEther("200")
      );
      await rePayTX.wait();

      BorrowInfo = await stableBankContract.BorrowInfo(owner.address);
      expect(BorrowInfo[0]).to.below(ethers.utils.parseEther("280"));
      expect(BorrowInfo[1]).to.below(ethers.utils.parseEther("255"));

      userInfo = await stableBankContract.UserInfo(owner.address);
      expect(userInfo[0]).to.above(ethers.utils.parseEther("220"));
      expect(userInfo[1]).to.equal(ethers.utils.parseEther("500"));
      expect(userInfo[2]).to.above(ethers.utils.parseEther("200"));

      await USDCContract.approve(stableBankContract.address, BorrowInfo[1]);
      rePayTX = await stableBankContract.rePayBorrowed(BorrowInfo[1]);
      await rePayTX.wait();

      BorrowInfo = await stableBankContract.BorrowInfo(owner.address);
      expect(BorrowInfo[0]).to.equal(ethers.utils.parseEther("0"));
      expect(BorrowInfo[1]).to.equal(ethers.utils.parseEther("0"));

      userInfo = await stableBankContract.UserInfo(owner.address);
      expect(userInfo[0]).to.equal(ethers.utils.parseEther("500"));
      expect(userInfo[1]).to.equal(ethers.utils.parseEther("500"));
      expect(userInfo[2]).to.equal(ethers.utils.parseEther("450"));
    });

    it("we can withdraw", async function () {
      await expect(
        stableBankContract.withdraw(ethers.utils.parseEther("501"))
      ).to.be.revertedWith("withdraw limit exceeded");

      await expect(
        stableBankContract.rePayBorrowed(ethers.utils.parseEther("501"))
      ).to.be.revertedWith("You are paying more !");

      withdrawTX = await stableBankContract.withdraw(
        ethers.utils.parseEther("250")
      );
      await withdrawTX.wait();

      userInfo = await stableBankContract.UserInfo(owner.address);
      expect(userInfo[0]).to.equal(ethers.utils.parseEther("250"));
      expect(userInfo[1]).to.equal(ethers.utils.parseEther("250"));
      expect(userInfo[2]).to.equal(ethers.utils.parseEther("225"));

      withdrawTX = await stableBankContract.withdraw(
        ethers.utils.parseEther("250")
      );
      await withdrawTX.wait();

      userInfo = await stableBankContract.UserInfo(owner.address);
      expect(userInfo[0]).to.equal(ethers.utils.parseEther("0"));
      expect(userInfo[1]).to.equal(ethers.utils.parseEther("0"));
      expect(userInfo[2]).to.equal(ethers.utils.parseEther("0"));
    });
  });
});
