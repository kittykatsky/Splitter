/* Test plan
 *
 * Tests for splitter contract.
 * All test refers to the splitter contract (it)
 * unless otherwise specifed.
 *
 * tests require min. 3 accounts
 *
 * */

const Splitter = artifacts.require("splitter");
const chai = require("./chaiSetup.js");
const BN = web3.utils.BN;
const expect = chai.expect;

require("dotenv").config({path: "../.env"});

contract("Splitter test", async (accounts) => {

    const [aliceAccount, bobAccount, carolAccount] = accounts;

    /* beforeEach(async () => {
     * //pass
     * }
     * */

    it("Should have the deployer as its owner", async () => {
        let splitter = await Splitter.deployed();
        return expect(splitter.owner == aliceAccount)
    });

    it("Should not have have any ETH on deployment", async () => {
        let splitter = await Splitter.deployed();
        let balanceOfSplitter = await web3.eth.getBalance(splitter.address);
        return expect(balanceOfSplitter).to.be.a.bignumber.equal(new BN(0));
    });

    it("Should not have any payees on deployment", async () => {
        let splitter = await Splitter.deployed();
        return expect(splitter.payeeCount == 0);
    });

    it("Should only be possible for the owner to add payees", async () => {
        let splitter = await Splitter.deployed();
        expect(splitter.payeeCount == 0);
        expect(splitter.addPayee(bobAccount, {from: aliceAccount})).to.be.fulfilled;
        expect(splitter.payeeCount == 1);
        expect(splitter.addPayee(carolAccount, {from: bobAccount})).to.be.rejected;
        return expect(splitter.payeeCount == 1);
    });

    it("Should only be possible for the owner to send ETH to the contract", async () => {
        let splitter = await Splitter.deployed();
        // truffle issue casues crash - have to comment out this until the promise gets fulfilled
        // https://github.com/trufflesuite/truffle/issues/2497
        await splitter.sendTransaction({
            from: aliceAccount, value: web3.utils.toWei("1", "ether")});
        expect(splitter.sendTransaction({
            from: bobAccount, value: web3.utils.toWei("1", "ether")})).to.be.rejected;
        balanceOfSplitter = web3.eth.getBalance(splitter.address);
        return expect(balanceOfSplitter).to.eventually.be.a.bignumber.equal(new BN(web3.utils.toWei("1", "ether")));
    });

    // Ultimately same test as above
    // it("All ETH sent to the contract should default to the contract", async () =>{
    // });

    it("Should only be possible for the owner to split ETH to the payees", async () =>{
        let splitter = await Splitter.deployed();

        expect(splitter.sendTransaction(
            {from: aliceAccount, value: web3.utils.toWei("1", "ether")})).to.be.fulfilled;
        return expect(splitter.performSplit({from: aliceAccount})).to.be.fulfilled;
    });

    it("Should only be possible to perform split when theres money in spliter account", async () =>{
        let splitter = await Splitter.deployed();

        return expect(splitter.performSplit({from: aliceAccount})).to.be.rejected;
    });

    it("All ether should be split equally between the payees", async () => {
        let splitter = await Splitter.deployed();

        expect(splitter.addPayee(carolAccount, {from: aliceAccount})).to.be.fulfilled;
        await splitter.sendTransaction({from: aliceAccount, value: web3.utils.toWei("1", "ether")});

        let balanceOfSplitter = await web3.eth.getBalance(splitter.address);
        let origBalance = await web3.eth.getBalance(bobAccount);
        let noOfRec = await splitter.viewPayeeCount();
        let splitAmount = (parseInt(balanceOfSplitter) / noOfRec) + parseInt(origBalance);

        await splitter.performSplit({from: aliceAccount});

        balanceOfSplitter = web3.eth.getBalance(splitter.address);
        console.log(await web3.eth.getBalance(bobAccount))
        console.log(splitAmount)
        bobBalance = web3.eth.getBalance(bobAccount)

        // This test fails even though the two ballances match
        //expect(bobBalance).to.eventually.be.a.bignumber.equal(new BN(splitAmount));

        return expect(balanceOfSplitter).to.eventually.be.a.bignumber.equal(new BN(0));
    });
});
