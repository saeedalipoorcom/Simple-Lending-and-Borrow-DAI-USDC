const hre = require("hardhat");

async function main() {
  // deploy DAI
  const DAI = await hre.ethers.getContractFactory("DAI");
  const DAIContract = await DAI.deploy();
  await DAIContract.deployed();
  console.log("DAIContract deployed to:", DAIContract.address);
  // deploy USDC
  const USDC = await hre.ethers.getContractFactory("USDC");
  const USDCContract = await USDC.deploy();
  await USDCContract.deployed();
  console.log("USDCContract deployed to:", USDCContract.address);
  // deploy BDAI
  const BDAI = await hre.ethers.getContractFactory("BDAI");
  const BDAIContract = await BDAI.deploy();
  await BDAIContract.deployed();
  console.log("BDAIContract deployed to:", BDAIContract.address);
  // deploy SBANK
  const stableBank = await hre.ethers.getContractFactory("stableBank");
  const stableBankContract = await stableBank.deploy(
    BDAIContract.address,
    DAIContract.address,
    USDCContract.address
  );
  await stableBankContract.deployed();
  console.log("stableBankContract deployed to:", stableBankContract.address);

  // transfer BDAIContract ownership
  await BDAIContract.transferOwnership(stableBankContract.address);
  // mint usd for stableBankContract
  const MintTX = await USDCContract.mintUSDC(
    stableBankContract.address,
    hre.ethers.utils.parseEther("1000")
  );
  await MintTX.wait();

  // mint usd for deployer
  const MintTX2 = await USDCContract.mintUSDC(
    "0x56528709436157c93C136906c8c583A9Ec9A7bEe",
    hre.ethers.utils.parseEther("1000")
  );
  await MintTX2.wait();

  console.log(
    (await USDCContract.balanceOf(stableBankContract.address)).toString()
  );

  console.log(
    (
      await USDCContract.balanceOf("0x56528709436157c93C136906c8c583A9Ec9A7bEe")
    ).toString()
  );

  console.log(
    (
      await DAIContract.balanceOf("0x56528709436157c93C136906c8c583A9Ec9A7bEe")
    ).toString()
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
