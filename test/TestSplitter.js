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
const chai = require("./chaiSetup.js");
const BN = web3.utils.BN;
const expect = chai.expect;

require("dotenv").config({path: "../.env"});


contract TestSplitter, async (accounts) => {

    const [aliceAccount, bobAccount, carolAccount] = accounts;

    /* beforeEach(async () => {
     * //pass
     * }
     * */

    it("Should have the deployer as its owner", async () => {

    });

    it("Should not have have any ETH on deployment", async () => {

    });

    it("Should not have any recievers on deployment", async () => {

    });

    it("Should only be possible for the owner to add recievers", async () => {

    });

    it("Should only be possible for the owner to send ETH to the contract", async () => {

    });

    it("All ETH sent to the contract should default to the contract", async () =>{

    });

    it("Should only be possible for the owner to split ETH to the recievers", async () =>{

    });

    it("All ether should be split equally between the recievers", async () => {

    });

    it("Should be possible for a reciever to withdraw their assigned ammount", async () => {

    });

    it("Shouldnt be possible for a reciever to withdraw more than their allotted amount", async () => {

    });

    it("Should return all assigned/non assigned ether to its respecitve reciever/owner upon destruction", async () => {

    });

}
