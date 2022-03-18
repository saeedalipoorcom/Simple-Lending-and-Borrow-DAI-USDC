const InterestModel = artifacts.require("InterestModel");
const CoinHandlerDataStorage = artifacts.require("CoinHandlerDataStorage");
const UsdtHandlerDataStorage = artifacts.require("UsdtHandlerDataStorage");
const DaiHandlerDataStorage = artifacts.require("DaiHandlerDataStorage");
const LinkHandlerDataStorage = artifacts.require("LinkHandlerDataStorage");
const Dai = artifacts.require("Dai");
const Link = artifacts.require("Link");
const Usdt = artifacts.require("Usdt");
const Bifi = artifacts.require("Bifi");
const ManagerDataStorage = artifacts.require("ManagerDataStorage");
const Manager = artifacts.require("etherManager");
const LiquidationManager = artifacts.require("LiquidationManager");
const CoinHandlerLogic = artifacts.require("CoinHandlerLogic");
const UsdtHandlerLogic = artifacts.require("UsdtHandlerLogic");
const DaiHandlerLogic = artifacts.require("DaiHandlerLogic");
const LinkHandlerLogic = artifacts.require("LinkHandlerLogic");
const OracleProxy = artifacts.require("OracleProxy");
const EtherOracle = artifacts.require("EtherOracle");
const UsdtOracle = artifacts.require("UsdtOracle");
const DaiOracle = artifacts.require("DaiOracle");
const LinkOracle = artifacts.require("LinkOracle");
const CoinHandlerProxy = artifacts.require("CoinHandlerProxy");
const UsdtHandlerProxy = artifacts.require("UsdtHandlerProxy");
const DaiHandlerProxy = artifacts.require("DaiHandlerProxy");
const LinkHandlerProxy = artifacts.require("LinkHandlerProxy");
const CoinSIHandlerDataStorage = artifacts.require(
    "marketSIHandlerDataStorage"
);
const UsdtSIDataStorage = artifacts.require("UsdtSIDataStorage");
const DaiSIDataStorage = artifacts.require("DaiSIDataStorage");
const LinkSIDataStorage = artifacts.require("LinkSIDataStorage");
const coinSI = artifacts.require("coinSI");
const usdtSI = artifacts.require("UsdtSI");
const daiSI = artifacts.require("DaiSI");
const linkSI = artifacts.require("LinkSI");
const callProxy = artifacts.require(
    "callProxyManagerCallProxyHandlerCallProxyMarketCallProxyUserCallProxySISafeMath"
);
const fs = require("fs");

module.exports = async function (deployer) {
    let receipt;
    const instances = {};

    // Oracle
    instances.EtherOracle = await deployer.deploy(
        EtherOracle,
        (100000000).toString()
    );
    instances.EtherOracle = EtherOracle;
    instances.DaiOracle = await deployer.deploy(
        DaiOracle,
        (100000000).toString()
    );

    instances.OracleProxy = await deployer.deploy(
        OracleProxy,
        EtherOracle.address,
        DaiOracle.address,
    );

    // deploy DAI SI
    instances.coinSI = await deployer.deploy(coinSI);
    instances.daiSI = await deployer.deploy(daiSI);

    // deploy ERC20 coin version
    instances.Dai = await deployer.deploy(Dai, "dai", "DAI", 18);
    instances.Bifi = await deployer.deploy(Bifi, "bifi", "BIFI", 18);

    // Manager
    // deploy manage data storage
    instances.ManagerDataStorage = await deployer.deploy(ManagerDataStorage);
    // deploy manager
    instances.Manager = await deployer.deploy(
        Manager,
        "ether",
        ManagerDataStorage.address,
        OracleProxy.address,
        "0x6d3A0d57Aa65fe133802c48F659521F7693fa477",
        Bifi.address
    );
    // set manager address in ManagerDataStorage to manager address
    receipt = await instances.ManagerDataStorage.setManagerAddr(Manager.address);
    // transfer 1000000000 BIFI to manager address
    const transferAmount = web3.utils.toWei("1000000000", "ether");
    receipt = await instances.Bifi.transfer(Manager.address, transferAmount);

    // deploy LiquidationManager contract
    instances.LiquidationManager = await deployer.deploy(
        LiquidationManager,
        Manager.address
    );
    // set LiquidationManager in Manager contract to LiquidationManager address
    receipt = await instances.Manager.setLiquidationManager(
        LiquidationManager.address
    );

    // MarketHandlerDataStorage
    const betaRate = await web3.utils.toWei("0.5", "ether");
    let borrowLimit = await web3.utils.toWei("0.8", "ether");
    const martinCallLimit = await web3.utils.toWei("0.93", "ether");
    let minimumInterestRate = await web3.utils.toWei("0.02", "ether");
    let liquiditySensitive = await web3.utils.toWei("0.1", "ether");
    instances.CoinHandlerDataStorage = await deployer.deploy(
        CoinHandlerDataStorage,
        borrowLimit,
        martinCallLimit,
        minimumInterestRate,
        liquiditySensitive
    );

    // deploy market handlr for DAI
    borrowLimit = await web3.utils.toWei("0.75", "ether");
    minimumInterestRate = 0;
    liquiditySensitive = await web3.utils.toWei("0.05", "ether");
    instances.DaiHandlerDataStorage = await deployer.deploy(
        DaiHandlerDataStorage,
        borrowLimit,
        martinCallLimit,
        minimumInterestRate,
        liquiditySensitive
    );

    // interestModel
    instances.InterestModel = await deployer.deploy(InterestModel);

    // handlerProxy
    instances.CoinHandlerProxy = await deployer.deploy(CoinHandlerProxy);
    instances.DaiHandlerProxy = await deployer.deploy(DaiHandlerProxy);

    // SI DataStorage
    instances.CoinSIHandlerDataStorage = await deployer.deploy(
        CoinSIHandlerDataStorage,
        CoinHandlerProxy.address
    );
    instances.DaiSIDataStorage = await deployer.deploy(
        DaiSIDataStorage,
        DaiHandlerProxy.address
    );

    const marginCallLimit = (930000000000000000).toString();
    const limitOfActionAmount = web3.utils.toWei("100000", "ether");
    const liquidityLimitAmount = web3.utils.toWei("1", "ether");

    // COIN Handler
    instances.CoinHandlerLogic = await deployer.deploy(CoinHandlerLogic);
    const coinBorrowLimit = web3.utils.toWei("0.8", "ether");
    receipt = await instances.Manager.handlerRegister(
        0,
        CoinHandlerProxy.address
    );
    receipt = await instances.CoinHandlerDataStorage.setCoinHandler(
        CoinHandlerProxy.address,
        InterestModel.address
    );
    receipt = await instances.CoinHandlerProxy.initialize(
        0,
        CoinHandlerLogic.address,
        Manager.address,
        InterestModel.address,
        CoinHandlerDataStorage.address,
        coinSI.address,
        CoinSIHandlerDataStorage.address
    );
    receipt = await instances.CoinHandlerDataStorage.setLimitOfAction(
        limitOfActionAmount
    );
    receipt = await instances.CoinHandlerDataStorage.setLiquidityLimit(
        liquidityLimitAmount
    );

    // DAI Handler
    instances.DaiHandlerLogic = await deployer.deploy(DaiHandlerLogic);
    const daiBorrowLimit = web3.utils.toWei("0.75", "ether");
    receipt = await instances.Manager.handlerRegister(2, DaiHandlerProxy.address);
    receipt = await instances.DaiHandlerDataStorage.setTokenHandler(
        DaiHandlerProxy.address,
        InterestModel.address
    );
    receipt = await instances.DaiHandlerProxy.initialize(
        2,
        DaiHandlerLogic.address,
        Manager.address,
        InterestModel.address,
        DaiHandlerDataStorage.address,
        Dai.address,
        "dai",
        daiSI.address,
        DaiSIDataStorage.address
    );
    receipt = await instances.DaiHandlerDataStorage.setLimitOfAction(
        limitOfActionAmount
    );
    receipt = await instances.DaiHandlerDataStorage.setLiquidityLimit(
        liquidityLimitAmount
    );

    callBytes = await web3.eth.abi.encodeFunctionCall(
        {
            name: "setUnderlyingTokenDecimal",
            type: "function",
            inputs: [
                {
                    type: "uint256",
                    name: "_underlyingTokenDecimal",
                },
            ],
        },
        [(10 ** 18).toString()]
    );

    receipt = await instances.DaiHandlerProxy.handlerViewProxy(callBytes);

    // CallProxy
    instances.callProxy = await deployer.deploy(callProxy, Manager.address);

    const output = {};

    for (const key in instances) {
        if (instances[key] == undefined) console.log(key);
        else output[key] = instances[key].address;
    }

    const json = JSON.stringify(output);
    fs.writeFileSync("accounts.json", json);
};
