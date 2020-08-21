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

    it("Should not have any recievers on deployment", async () => {
        let splitter = await Splitter.deployed();
        return expect(splitter.receiverCount() == 0);
    });

    it("Should only be possible for the owner to add recievers", async () => {
        let splitter = await Splitter.deployed();
        expect(splitter.receiverCount() == 0);
        expect(splitter.addReciever(bobAccount, {from: aliceAccount})).to.be.fulfilled;
        expect(splitter.receiverCount() == 1);
        expect(splitter.addReciever(carolAccount, {from: bobAccount})).to.be.rejected;
        return expect(splitter.receiverCount() == 1);
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

    it("Should only be possible for the owner to split ETH to the recievers", async () =>{
        let splitter = await Splitter.deployed();
        await splitter.addReciever(bobAccount, {from: aliceAccount});
        expect(splitter.sendTransaction({
            from: aliceAccount, value: web3.utils.toWei("1", "ether")})).to.be.fulfilled;
        let balanceOfSplitter = await web3.eth.getBalance(splitter.address);
        let noOfRec = await splitter.recieverCount();
        let splitAmount = balanceOf / noOfRec
        let recOriginal = await splitter.getReceiverBalance(bobAccount);
        expect(splitter.performSplit({from: aliceAccount})).to.be.fulfilled;
        let recBalance = await splitter.getReceiverBalance(bobAccount) - recOriginal;
        return expect(splitAmount).to.be.a.bignumber.equal(new BN(recBalance));
    });

    it("All ether should be split equally between the recievers", async () => {
        let splitter = await Splitter.deployed();
        await splitter.addReciever(bobAccount, {from: aliceAccount});
        await splitter.addReciever(carolAccount, {from: aliceAccount});
        let noOfRec = await splitter.recieverCount();
        let splitAmount = balanceOf / noOfRec
        // expect(splitter.sendTransaction({from: aliceAccount, value: web3.utils.toWei("1", "ether")})).to.be.fulfilled;
        expect(splitter.performSplit({from: aliceAccount})).to.be.fulfilled;
        let balanceOfSplitter = await splitter.balanceOf(Splitter.address);
        let balanceOfBob = await splitter.getReceiverBalance(carolAccount);
        let balanceOfCarol = await splitter.getReceiverBalance(bobAccount);
        expect(carolAccount).to.be.a.bignumber.equal(new BN(splitAmount));
        expect(bobAccount).to.be.a.bignumber.equal(new BN(splitAmount));
        return expect(balanceOfSplitter).to.be.a.bignumber.equal(0);
    });

    it("Should be possible for a reciever to withdraw their assigned ammount", async () => {
        let splitter = await Splitter.deployed();
        await splitter.addReciever(bobAccount, {from: aliceAccount});
        await splitter.addReciever(carolAccount, {from: aliceAccount});
        // expect(splitter.sendTransaction({from: aliceAccount, value: web3.utils.toWei("1", "ether")})).to.be.fulfilled;
        expect(splitter.performSplit({from: aliceAccount})).to.be.fulfilled;
        expect(splitter.withdrawMoney('.5', {from: bobAccount})).to.be.fulfilled;
    });

    it("Shouldnt be possible for a reciever to withdraw more than their allotted amount", async () => {
        let splitter = await Splitter.deployed();
        await splitter.addReciever(bobAccount, {from: aliceAccount});
        expect(splitter.withdrawMoney('.5', {from: bobAccount})).to.be.rejected;
    });

    it("Should return all assigned/non assigned ether to its respecitve reciever/owner upon destruction", async () => {
        let splitter = await Splitter.deployed();
    });

});
