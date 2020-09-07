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
        this.splitter = await Splitter.new(false, {from: aliceAccount});
        assert.equal(await web3.eth.getBalance(this.splitter.address), 0)
     });

    // testing ownership
    it("Owned contract should be owned by its deployer", async () => {
        const ownerInstance= await Owned.new({from: aliceAccount});
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

    it("should be possible to kill the contract and return all aloted eth to the owner", async () => {
        const instance = this.splitter;
        const originalBalanceAlice = await web3.eth.getBalance(aliceAccount);

        const trxSplit = await instance.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(501)}
        )

        assert(trxSplit.receipt.status, '0x01');

        let gasUsedAlice = new BN(trxSplit.receipt.gasUsed);

        const trxSplitTx = await web3.eth.getTransaction(trxSplit.tx);
        const trxPause = await instance.pause({from: aliceAccount});

        gasUsedAlice = gasUsedAlice.add(new BN(trxPause.receipt.gasUsed));


        const trxPauseTx = await web3.eth.getTransaction(trxPause.tx);

        let balanceOfSplitter = await web3.eth.getBalance(instance.address);

        const trxKill = await instance.kill(
            {from: aliceAccount}
        );

        gasUsedAlice = gasUsedAlice.add(new BN(trxKill.receipt.gasUsed));

        const trxRet = await instance.emptyAccount(
			aliceAccount,
            {from: aliceAccount}
        );

        gasUsedAlice = gasUsedAlice.add(new BN(trxRet.receipt.gasUsed));
        const trxRetTx = await web3.eth.getTransaction(trxRet.tx);

        const gasPrice = new BN(trxRetTx.gasPrice);
        const gasCost = gasPrice.mul(gasUsedAlice);

        let postKill = await web3.eth.getBalance(instance.address);

        const checkBalance = new BN(originalBalanceAlice).sub(gasCost);

        const aliceBalance = new BN(await web3.eth.getBalance(aliceAccount));

        console.log('splitter ', balanceOfSplitter)
        console.log('splitter ', postKill)
        console.log('check ', checkBalance.toString())
        console.log('alice ', aliceBalance.toString())
        console.log('alice - gas', aliceBalance.sub(gasCost).toString())
        console.log('alice - check ', aliceBalance.sub(checkBalance).toString())

        expect(instance.performSplit(bobAccount, carolAccount, {from: aliceAccount, value: 1})).to.be.rejected;
        assert.equal(aliceBalance.sub(checkBalance), 0);


    });

    // testing construction
    it("Should not have have any ETH on deployment", async () => {
        const instance = this.splitter;
        let balanceOfSplitter = web3.eth.getBalance(instance.address);
        return expect(balanceOfSplitter).to.eventually.be.a.bignumber.equal(new BN(0));
    });

    it("Should not be possible for anyone to send ETH to the contract directly", async () => {
        const instance = this.splitter;

        return await truffleAssert.reverts(
            web3.eth.sendTransaction(
                {to: instance.address, from: aliceAccount, value:500},
                "cant send eth to contract"
            )
        );
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

        const balanceOfSplitter = web3.eth.getBalance(instance.address);

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

        const balanceOfSplitter = web3.eth.getBalance(instance.address);

        const bobBalance = new BN(await web3.eth.getBalance(bobAccount));

        assert.equal(await instance.payeeBalance.call(bobAccount, {from: aliceAccount}), 50);
        assert.equal(bobBalance.sub(checkBalance), 200);

        return expect(balanceOfSplitter).to.eventually.be.a.bignumber.equal(new BN(300));
    });

    // additional tests
    // Need to figure out how to test the events that have been emitted
});
