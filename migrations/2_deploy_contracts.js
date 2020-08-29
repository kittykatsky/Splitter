var splitter = artifacts.require("./Splitter.sol");
var owned = artifacts.require("./Owned.sol");
var pausable = artifacts.require("./Pausable.sol");

module.exports = async function(deployer, network, accounts) {
    await deployer.deploy(owned, {from: accounts[0]});
    await deployer.deploy(pausable, {from: accounts[0]});
    await deployer.deploy(splitter, {from: accounts[0]});
};
