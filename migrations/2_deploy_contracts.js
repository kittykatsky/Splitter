var splitter = artifacts.require("./Splitter.sol");
var owned = artifacts.require("./Owned.sol");

module.exports = async function(deployer) {
    let addr = await web3.eth.getAccounts();
    await deployer.deploy(splitter);
    await deployer.deploy(owned);
};
