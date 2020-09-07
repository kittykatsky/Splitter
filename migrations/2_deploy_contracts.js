var splitter = artifacts.require("./Splitter.sol");
var owned = artifacts.require("./Owned.sol");
var pausable = artifacts.require("./Pausable.sol");

module.exports = async function(deployer, network, accounts) {
    await deployer.deploy(splitter, false, {from: accounts[0]});
};
