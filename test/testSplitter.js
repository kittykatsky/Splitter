/* testSplitter
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
const chaiSetup = require("./chaiSetup.js");
const chai = chaiSetup.chai;
const BN = chaiSetup.BN;
const truffleAssert = require('truffle-assertions');
const expect = chai.expect;

require("dotenv").config({path: "../.env"});

contract("Splitter test", async (accounts) => {

    const [aliceAccount, bobAccount, carolAccount] = accounts;

    beforeEach("Setting up splitter", async () => {
        this.splitter = await Splitter.new({from: aliceAccount});
        assert.equal(await web3.eth.getBalance(this.splitter.address), 0)
     });

    // testing ownership
    it("Owned contract should be owned by its deployer", async () => {
        const ownerInstance = await Owned.deployed();
        return expect(await ownerInstance.getOwner()).to.equal(aliceAccount)
        });

    it("Should have the deployer as its owner", async () => {
        const instance = this.splitter;
        return expect(await instance.getOwner()).to.equal(aliceAccount)
    });

    // testing construction
    it("Should not have have any ETH on deployment", async () => {
        const instance = this.splitter;
        let balanceOfSplitter = web3.eth.getBalance(instance.address);
        return expect(balanceOfSplitter).to.eventually.be.a.bignumber.equal(new BN(0));
    });


    //Cant get this test to work now that the fallback function revert has been removed

    //it("Should not be possible for anyone to send ETH to the contract directly", async () => {
    //    const instance = this.splitter;
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
    it("Should not be possible to split if 1 wei or less sent with split", async () =>{
        const instance = this.splitter;

        expect(instance.performSplit(bobAccount, carolAccount, {from: aliceAccount, value: 1})).to.be.rejected;
        return expect(instance.performSplit(bobAccount, carolAccount, {from: aliceAccount, value: 0})).to.be.rejected;
    });


    it("Should not be possible to split if accounts not correctly specified", async () =>{
        const instance = this.splitter;

        expect(instance.performSplit('', carolAccount, {from: aliceAccount})).to.be.rejected;
        return expect(instance.performSplit(bobAccount, '', {from: aliceAccount})).to.be.rejected;
    });

    it("Should only be possible for anyone to split ETH to a pair of payees", async () =>{
        const instance = this.splitter;

        expect(instance.performSplit(
            bobAccount, carolAccount, {from: bobAccount, value: new BN(5)}
        )).to.be.rejected;
        expect(instance.performSplit(
            aliceAccount, carolAccount, {from: bobAccount, value: new BN(5)}
        )).to.be.fulfilled;
        expect(instance.performSplit(
            aliceAccount, carolAccount, {from: aliceAccount, value: new BN(5)}
        )).to.be.rejected;
        return expect(instance.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(5)}
        )).to.be.fulfilled;
    });

    it("All ether should be split equally between the payees", async () => {
        const instance = this.splitter;
        origBalance = await web3.eth.getBalance(bobAccount);

        let splitAmount = Math.floor(5 / 2)// + parseInt(origBalance);
        let leftOver = 5 % 2;

        await instance.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(5)}
        )

        balanceOfSplitter = web3.eth.getBalance(instance.address);

        assert.equal(await instance.payeeBalance.call(bobAccount, {from: aliceAccount}), splitAmount);
        assert.equal(await instance.payeeBalance.call(carolAccount, {from: aliceAccount}), splitAmount);
        assert.equal(await instance.payeeBalance.call(aliceAccount, {from: aliceAccount}), leftOver);

        return expect(balanceOfSplitter).to.eventually.be.a.bignumber.equal(new BN(5));
    });

    //testing withdraw function

    it("Should not be possible for payee to withdraw if there is no ether", async () => {
        const instance = this.splitter;
        return expect(instance.withdrawEther(3, {from: bobAccount})).to.be.rejected;
    });

    it("Should not be possible for payee to withdraw more than their assigned amount", async () => {
        const instance = this.splitter;
        await instance.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(5)}
        )
        return expect(instance.withdrawEther(3, {from: bobAccount})).to.be.rejected;
    });

    it("Should be possible for a payee to withdraw any positive amount up to and including their allored amount", async () => {
        const instance = this.splitter;
        await instance.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(5)}
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
