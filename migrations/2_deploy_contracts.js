var splitter = artifacts.require("./Splitter.sol");
var owned = artifacts.require("./Owned.sol");

module.exports = async function(deployer) {
    await deployer.deploy(splitter);
    await deployer.deploy(owned);
};
