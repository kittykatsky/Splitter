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

    // testing pausability/killability
    it("should not be able to run a paused contract", async () => {
        const instance = this.splitter;

        expect(instance.performSplit(bobAccount, carolAccount, {from: aliceAccount, value: 500})).to.be.fulfilled;
        await instance.pause({from: aliceAccount})
        expect(instance.performSplit(bobAccount, carolAccount, {from: aliceAccount, value: 500})).to.be.rejected;
        expect(instance.withdrawEther(3, {from: bobAccount})).to.be.rejected;

        await instance.resume({from: aliceAccount})
        return expect(instance.performSplit(bobAccount, carolAccount, {from: aliceAccount, value: 500})).to.be.fulfilled;

    });

    it("should be possible to kill the contract and return all aloted eth to its payee", async () => {
        const instance = this.splitter;
        const originalBalanceBob = await web3.eth.getBalance(bobAccount);
        const originalBalanceAlice = await web3.eth.getBalance(aliceAccount);

        const trxSplit = await instance.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(501)}
        )

        assert(trxSplit.receipt.status, '0x01');

        let gasUsedAlice = trxSplit.receipt.gasUsed;

        const bobSplitterBalance = await instance.payeeBalance.call(aliceAccount, {from: aliceAccount});

        const trxKill = await instance.killSplitter(
            {from: aliceAccount}
        );

        gasUsedAlice = gasUsedAlice.add(trxSplit.receipt.gasUsed);

        const trxKillTx = await web3.eth.getTransaction(trxKill.tx);

        const gasPrice = new BN(trxKillTx.gasPrice);
        const gasCost = gasPrice.mul(new BN(gasUsediAlice));

        const checkBalance = new BN(originalBalanceAlice).sub(gasCost);

        const bobBalance = new BN(await web3.eth.getBalance(bobAccount));
        const aliceBalance = new BN(await web3.eth.getBalance(aliceAccount));

        assert.equal(originalBalanceBob.add(bobSplitterBalance), bobBalance);

        return assert.equal(aliceAccount.sub(checkBalance), 1);

    });

    // testing construction
    it("Should not have have any ETH on deployment", async () => {
        const instance = this.splitter;
        let balanceOfSplitter = web3.eth.getBalance(instance.address);
        return expect(balanceOfSplitter).to.eventually.be.a.bignumber.equal(new BN(0));
    });


    //Cant get this test to work now that the fallback function revert has been removed

    it("Should not be possible for anyone to send ETH to the contract directly", async () => {
        const instance = this.splitter;

        const trx = await web3.eth.sendTransaction({to: instance.address, from: aliceAccount, value:500})

        console.log('------------trx');
        console.log(trx);
        //assert(trx.receipt.status, '0x01');
        console.log('------------trx_tx');
        const trx_tx = await web3.eth.getTransaction(trx.tx);
        console.log(trx_tx);


    });

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

    it("Multiple splits so result in adding the split values to the payees allotted amount", async () => {
        const instance = this.splitter;
        await instance.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(5)}
        );

        await instance.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(6)}
        );

        await instance.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(10)}
        );

        assert.equal(await instance.payeeBalance.call(aliceAccount, {from: aliceAccount}), 1);
        return assert.equal(await instance.payeeBalance.call(bobAccount, {from: aliceAccount}), 10);
    })

    it("All ether should be split equally between the payees", async () => {
        const instance = this.splitter;

        let splitAmount = Math.floor(5 / 2);
        let leftOver = 5 % 2;

        await instance.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(5)}
        );

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

    it("Should not be possible for payee to withdraw no wei or more than their assigned amount", async () => {
        const instance = this.splitter;
        await instance.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(5)}
        )
        expect(instance.withdrawEther(0, {from: bobAccount})).to.be.rejected;
        return expect(instance.withdrawEther(3, {from: bobAccount})).to.be.rejected;
    });

    it("Should be possible for a payee to withdraw any positive amount up to and including their allored amount", async () => {
        const instance = this.splitter;
        const originalBalance = await web3.eth.getBalance(bobAccount);
        await instance.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(500)}
        )

        const trx = await instance.withdrawEther(200, {from: bobAccount});

        assert(trx.receipt.status, '0x01');

        const gasUsed = trx.receipt.gasUsed;

        const trx_tx = await web3.eth.getTransaction(trx.tx);

        const gasPrice = new BN(trx_tx.gasPrice);
        const gasCost = gasPrice.mul(new BN(gasUsed));

        const checkBalance = new BN(originalBalance).sub(gasCost);

        balanceOfSplitter = web3.eth.getBalance(instance.address);

        const bobBalance = new BN(await web3.eth.getBalance(bobAccount));
        console.log(await instance.payeeBalance.call(bobAccount, {from: aliceAccount}));

        assert.equal(await instance.payeeBalance.call(bobAccount, {from: aliceAccount}), 50);
        assert.equal(bobBalance.sub(checkBalance), 200);

        return expect(balanceOfSplitter).to.eventually.be.a.bignumber.equal(new BN(300));
    });

    // additional tests
    // Need to figure out how to test the events that have been emitted
});
