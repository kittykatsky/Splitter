/* Test plan
 *
 * Tests for splitter contract.
 * All test refers to the splitter contract (it)
 * unless otherwise specifed.
 *
 * tests require min. 3 accounts
 *
 * */

const Splitter = artifacts.require("Splitter");
const Owned = artifacts.require("Owned");
const chai = require("./chaiSetup.js");
const truffleAssert = require('truffle-assertions');
const BN = web3.utils.BN;
const expect = chai.expect;

require("dotenv").config({path: "../.env"});

contract("Splitter test", async (accounts) => {

    const [aliceAccount, bobAccount, carolAccount] = accounts;
    const value = 5;

    beforeEach(async () => {
        this.splitter = await Splitter.new();
        assert.equal(await web3.eth.getBalance(this.splitter.address), 0)
     });

    // testing ownership
    it("Owned contract should be owned by its deployer", async () => {
        let ownerInstance = await Owned.deployed();
        return expect(await ownerInstance.getOwner()).to.equal(aliceAccount)
        });

    it("Should have the deployer as its owner", async () => {
        let instance = this.splitter;
        return expect(await instance.getOwner()).to.equal(aliceAccount)
    });

    // testing construction
    it("Should not have have any ETH on deployment", async () => {
        let instance = this.splitter;
        let balanceOfSplitter = web3.eth.getBalance(instance.address);
        return expect(balanceOfSplitter).to.eventually.be.a.bignumber.equal(new BN(0));
    });


    //Cant get this test to work now that the fallback function revert has been removed

    //it("Should not be possible for anyone to send ETH to the contract directly", async () => {
    //    let instance = this.splitter;
    //    await truffleAssert.reverts(
    //        instance.sendTransaction(
    //            {from: aliceAccount, value: web3.utils.toWei("1", "ether")}), "cant send ether directly");
    //    await truffleAssert.reverts(
    //        instance.sendTransaction(
    //            {from: bobAccount, value: web3.utils.toWei("1", "ether")}), "cant send ether directly");

    //    expect(instance.sendTransaction({
    //        from: bobAccount, value: web3.utils.toWei("1", "ether")})).to.be.rejected;

    //    balanceOfSplitter = web3.eth.getBalance(instance.address);
    //    return expect(balanceOfSplitter).to.eventually.be.a.bignumber.equal(new BN(web3.utils.toWei("0", "ether")));
    //});

    // testing splitter function
    it("Should not be possible to split if no ETH sent with split", async () =>{
        let instance = this.splitter;

        return expect(instance.performSplit(bobAccount, carolAccount, {from: aliceAccount, value: 0})).to.be.rejected;
    });


    it("Should not be possible to split if accounts not correctly specified", async () =>{
        let instance = this.splitter;

        expect(instance.performSplit('', carolAccount, {from: aliceAccount})).to.be.rejected;
        return expect(instance.performSplit(bobAccount, '', {from: aliceAccount})).to.be.rejected;
    });

    it("Should only be possible for the owner to split ETH to the payees", async () =>{
        let instance = this.splitter;

        expect(instance.performSplit(
            bobAccount, carolAccount, {from: bobAccount, value: new BN(value)}
        )).to.be.rejected;
        return expect(instance.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(value)}
        )).to.be.fulfilled;
    });

    it("All ether should be split equally between the payees", async () => {
        let instance = this.splitter;
        origBalance = await web3.eth.getBalance(bobAccount);

        let splitAmount = Math.floor(value / 2)// + parseInt(origBalance);
        let leftOver = value % 2;

        await instance.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(value)}
        )

        balanceOfSplitter = web3.eth.getBalance(instance.address);

        assert.equal(await instance.payeeBalance.call(bobAccount, {from: aliceAccount}), splitAmount);
        assert.equal(await instance.payeeBalance.call(carolAccount, {from: aliceAccount}), splitAmount);
        assert.equal(await instance.payeeBalance.call(aliceAccount, {from: aliceAccount}), leftOver);

        return expect(balanceOfSplitter).to.eventually.be.a.bignumber.equal(new BN(value));
    });

    //testing withdraw function

    it("Should not be possible for payee to withdraw if there is no ether", async () => {
        let instance = this.splitter;
        return expect(instance.withdrawEther(3, {from: bobAccount})).to.be.rejected;
    });

    it("Should not be possible for payee to withdraw more than their assigned amount", async () => {
        let instance = this.splitter;
        await instance.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(value)}
        )
        return expect(instance.withdrawEther(3, {from: bobAccount})).to.be.rejected;
    });

    it("Should be possible for a payee to withdraw any positive amount up to and including their allored amount", async () => {
        let instance = this.splitter;
        await instance.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(value)}
        )
        expect(instance.withdrawEther(0, {from: bobAccount})).to.be.rejected;
        expect(instance.withdrawEther(1, {from: bobAccount})).to.be.fulfilled;

        await instance.withdrawEther(1, {from: bobAccount});
        balanceOfSplitter = web3.eth.getBalance(instance.address);

        return expect(balanceOfSplitter).to.eventually.be.a.bignumber.equal(new BN(3));
    });

    // additional tests
    // Need to figure out how to test the events that have been emitted
});
