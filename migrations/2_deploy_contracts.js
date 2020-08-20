var splitter = artifacts.require("./splitter.sol");

module.exports = async function(deployer) {
    let addr = await web3.eth.getAccounts();
    await deployer.deploy(splitter);
};
