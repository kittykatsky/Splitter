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
const BN = web3.utils.BN;
const expect = chai.expect;

require("dotenv").config({path: "../.env"});

contract("Splitter test", async (accounts) => {

    const [aliceAccount, bobAccount, carolAccount] = accounts;

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

    // testing splitter
    it("Should not be possible for anyone to send ETH to the contract directly", async () => {
        let instance = this.splitter;
        expect(await instance.sendTransaction({
            from: aliceAccount, value: web3.utils.toWei("1", "ether")})).to.be.rejected;
        expect(instance.sendTransaction({
            from: bobAccount, value: web3.utils.toWei("1", "ether")})).to.be.rejected;
        balanceOfSplitter = web3.eth.getBalance(instance.address);
        return expect(balanceOfSplitter).to.eventually.be.a.bignumber.equal(new BN(web3.utils.toWei("0", "ether")));
    });


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
            bobAccount, carolAccount, {from: bobAccount, value: new BN(5)}
        )).to.be.rejected;
        return expect(instance.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(5)}
        )).to.be.fulfilled;
    });

    it("All ether should be split equally between the payees", async () => {
        let instance = this.splitter;
        origBalance = await web3.eth.getBalance(bobAccount);

        let splitAmount = Math.floor(5 / 2)// + parseInt(origBalance);
        let leftOver = 5 % 2;

        await instance.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(5)}
        )

        balanceOfSplitter = web3.eth.getBalance(instance.address);
        console.log(await web3.eth.getBalance(bobAccount))
        console.log(splitAmount)

        // This test fails even though the two ballances match
        //expect(bobBalance).to.eventually.be.a.bignumber.equal(new BN(splitAmount));
        assert.equal(await instance.payeeBalance.call(bobAccount, {from: aliceAccount}), splitAmount)
        assert.equal(await instance.payeeBalance.call(carolAccount, {from: aliceAccount}), splitAmount)
        assert.equal(await instance.leftOver.call({from: aliceAccount}), leftOver)

        return expect(balanceOfSplitter).to.eventually.be.a.bignumber.equal(new BN(5));
    });
});
