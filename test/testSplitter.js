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

    let splitter;

    const [aliceAccount, bobAccount, carolAccount] = accounts;

    beforeEach("Setting up splitter", async () => {
        splitter = await Splitter.new(false, {from: aliceAccount});
        assert.strictEqual(await web3.eth.getBalance(splitter.address), '0')
     });

    // testing ownership
    it("Owned contract should be owned by its deployer", async () => {
        const ownerInstance= await Owned.new({from: aliceAccount});
        return expect(await ownerInstance.getOwner()).to.equal(aliceAccount)
        });

    it("Should have the deployer as its owner", async () => {
        return expect(await splitter.getOwner()).to.equal(aliceAccount)
    });

    // testing pausability/killability
    it("should not be able to run a paused contract", async () => {
        expect(splitter.performSplit(bobAccount, carolAccount, {from: aliceAccount, value: 500})).to.be.fulfilled;
        await splitter.pause({from: aliceAccount})
        expect(splitter.performSplit(bobAccount, carolAccount, {from: aliceAccount, value: 500})).to.be.rejected;
        expect(splitter.withdrawEther(3, {from: bobAccount})).to.be.rejected;

        await splitter.resume({from: aliceAccount})
        return expect(splitter.performSplit(bobAccount, carolAccount, {from: aliceAccount, value: 500})).to.be.fulfilled;

    });

    it("should be possible to kill the contract and return all aloted eth to the owner", async () => {
        const originalBalanceAlice = await web3.eth.getBalance(aliceAccount);

        const trxSplit = await splitter.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(501)}
        );

        assert(trxSplit.receipt.status, '0x01');
        let gasUsedAlice = new BN(trxSplit.receipt.gasUsed);

        const trxPause = await splitter.pause({from: aliceAccount});
        gasUsedAlice = gasUsedAlice.add(new BN(trxPause.receipt.gasUsed));

        const trxKill = await splitter.kill({from: aliceAccount});
        gasUsedAlice = gasUsedAlice.add(new BN(trxKill.receipt.gasUsed));

        const trxRet = await splitter.emptyAccount(aliceAccount,{from: aliceAccount});

        gasUsedAlice = gasUsedAlice.add(new BN(trxRet.receipt.gasUsed));
        const trxRetTx = await web3.eth.getTransaction(trxRet.tx);

        const gasPrice = new BN(trxRetTx.gasPrice);
        const gasCost = gasPrice.mul(gasUsedAlice);

        const checkBalance = new BN(originalBalanceAlice).sub(gasCost);
        const aliceBalance = new BN(await web3.eth.getBalance(aliceAccount));


        return assert.strictEqual(aliceBalance.sub(checkBalance).toString(), '0');

    });

    it("Should not be possible to split after the contract is killed", async () => {
        const trxPause = await splitter.pause({from: aliceAccount});
        const trxKill = await splitter.kill({from: aliceAccount});

        return expect(splitter.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: 1}
        )).to.be.rejected;
    });

    //test events
    it("Should emit events after splitting and withdrawal", async () => {
        await splitter.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(501)}
        ).then(
            tx => splitEvent = tx.logs[0]
        );

        assert(splitEvent.event, 'LogSplitDoneEvent');
        assert(splitEvent.args.sender, aliceAccount);
        assert(splitEvent.args.payee1, bobAccount);
        assert(splitEvent.args.payee2, carolAccount);
        assert(splitEvent.args.amount.toString(), '501');

        await splitter.withdrawEther(
            200, {from: bobAccount}
        ).then(
            tx => withDrawEvent = tx.logs[0]
        );

        assert(withDrawEvent.event, 'LogEtherWithdrawnEvent');
        assert(splitEvent.args.sender, bobAccount);
        assert(splitEvent.args.amount.toString(), '200');

    });

    // testing construction
    it("Should not have have any ETH on deployment", async () => {
        let balanceOfSplitter = web3.eth.getBalance(splitter.address);
        return expect(balanceOfSplitter).to.eventually.be.a.bignumber.equal(new BN(0));
    });

    it("Should not be possible for anyone to send ETH to the contract directly", async () => {
        return await truffleAssert.reverts(
            web3.eth.sendTransaction(
                {to: splitter.address, from: aliceAccount, value:500},
                "cant send eth to contract"
            )
        );
    });

    // testing splitter function
    it("Should not be possible to split if 1 wei or less sent with split", async () =>{
        expect(splitter.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: 1}
        )).to.be.rejected;
        return expect(splitter.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: 0}
        )).to.be.rejected;
    });

    it("Should not be possible to split if accounts not correctly specified", async () =>{
        expect(splitter.performSplit('', carolAccount, {from: aliceAccount})).to.be.rejected;
        return expect(splitter.performSplit(bobAccount, '', {from: aliceAccount})).to.be.rejected;
    });

    it("Should only be possible for anyone to split ETH to a pair of payees", async () =>{
        expect(splitter.performSplit(
            bobAccount, carolAccount, {from: bobAccount, value: new BN(5)}
        )).to.be.rejected;
        expect(splitter.performSplit(
            aliceAccount, carolAccount, {from: bobAccount, value: new BN(5)}
        )).to.be.fulfilled;
        expect(splitter.performSplit(
            aliceAccount, carolAccount, {from: aliceAccount, value: new BN(5)}
        )).to.be.rejected;
        return expect(splitter.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(5)}
        )).to.be.fulfilled;
    });

    it("Multiple splits so result in adding the split values to the payees allotted amount", async () => {
        await splitter.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(5)}
        );

        await splitter.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(6)}
        );

        await splitter.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(10)}
        );

        const aliceBalance = await splitter.payeeBalance.call(aliceAccount, {from: aliceAccount});
        const bobBalance = await splitter.payeeBalance.call(bobAccount, {from: aliceAccount});
        assert.strictEqual(aliceBalance.toString(), '1');
        return assert.strictEqual(bobBalance.toString(), '10');
    })

    it("All ether should be split equally between the payees", async () => {
        let splitAmount = Math.floor(5 / 2);
        let leftOver = 5 % 2;

        await splitter.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(5)}
        );

        const balanceOfSplitter = web3.eth.getBalance(splitter.address);


        const bobBalance = await splitter.payeeBalance.call(bobAccount, {from: aliceAccount});
        const carolBalance = await splitter.payeeBalance.call(carolAccount, {from: aliceAccount});
        const aliceBalance = await splitter.payeeBalance.call(aliceAccount, {from: aliceAccount});

        assert.strictEqual(bobBalance.toString(), splitAmount.toString());
        assert.strictEqual(carolBalance.toString(), splitAmount.toString());
        assert.strictEqual(aliceBalance.toString(), leftOver.toString());

        return expect(balanceOfSplitter).to.eventually.be.a.bignumber.equal(new BN(5));
    });

    //testing withdraw function

    it("Should not be possible for payee to withdraw if there is no ether", async () => {
        return expect(splitter.withdrawEther(3, {from: bobAccount})).to.be.rejected;
    });

    it("Should not be possible for payee to withdraw no wei or more than their assigned amount", async () => {
        await splitter.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(5)}
        )
        expect(splitter.withdrawEther(0, {from: bobAccount})).to.be.rejected;
        return expect(splitter.withdrawEther(3, {from: bobAccount})).to.be.rejected;
    });

    it("Should be possible for a payee to withdraw any positive amount up to and including their allored amount", async () => {
        const originalBalance = await web3.eth.getBalance(bobAccount);
        await splitter.performSplit(
            bobAccount, carolAccount, {from: aliceAccount, value: new BN(500)}
        )

        const trx = await splitter.withdrawEther(200, {from: bobAccount});

        assert(trx.receipt.status, '0x01');

        const gasUsed = trx.receipt.gasUsed;

        const trx_tx = await web3.eth.getTransaction(trx.tx);

        const gasPrice = new BN(trx_tx.gasPrice);
        const gasCost = gasPrice.mul(new BN(gasUsed));

        const checkBalance = new BN(originalBalance).sub(gasCost);

        const balanceOfSplitter = web3.eth.getBalance(splitter.address);

        const bobBalance = new BN(await web3.eth.getBalance(bobAccount));

        const bobRemSplit = await splitter.payeeBalance.call(bobAccount, {from: aliceAccount});

        assert.strictEqual(bobRemSplit.toString(), '50');
        assert.strictEqual(bobBalance.sub(checkBalance).toString(), '200');

        return expect(balanceOfSplitter).to.eventually.be.a.bignumber.equal(new BN(300));
    });

    // additional tests
    // Need to figure out how to test the events that have been emitted
});
