import React, { Component } from "react";
import splitterContract from "./contracts/Splitter.json";

import "./App.css";
import Web3 from "web3";
import truffleContract from "truffle-contract";


class App extends Component {
  state = { loaded:false, splitterAddress: "0x0", splitterAmout:0, splitAmount:0, ownerAmount:0, payeeOneAddress: "0x0", payeeTwoAddress: "0x0", payeeOneAmount:0, payeeTwoAmount:0 };

  componentDidMount = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
                  // Supports EIP-1102 injected Ethereum providers.
                   window.web3 = new Web3(window.ethereum);
      } else if (typeof window.web3 !== 'undefined') {
                  // Supports legacy injected Ethereum providers.
                  window.web3 = new Web3(window.web3.currentProvider);
      } else {
                  // Your preferred fallback.
                  window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
      }

      const SplitterC = truffleContract(splitterContract);
      SplitterC.setProvider(window.web3.currentProvider);
      this.Splitter = await SplitterC.deployed()

      this.listenToTransfer();
      this.listenToWithdraw();

      window.accounts = await window.web3.eth.getAccounts();
      console.log(window.accounts);
      if(window.accounts.length < 3) throw 'not enough accounts to perform Split';

      this.setState(
          {loaded:true, splitterAddress: this.Splitter.address},
          this.updateAmounts, this.updatePayeeAmounts
      );

    } catch (error) {

      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    this.setState({
        [name]: value
      });
  };

  handleSplit = async() => {

    const success = await this.Splitter.performSplit.call(
        this.state.payeeOneAddress, this.state.payeeTwoAddress,
        {
            from: window.accounts[0],
            value: window.web3.utils.toWei(this.state.splitAmount.toString(), "wei")
        }
    ).catch(error => alert(error.message));

    if (!success) {
        return success;
    };


    await this.Splitter.performSplit(
        this.state.payeeOneAddress, this.state.payeeTwoAddress,
        {
            from: window.accounts[0],
            value: window.web3.utils.toWei(this.state.splitAmount.toString(), "wei")
        }
    )
    .on('transactionHash', (hash) => {
        alert('Transaction submitted with the following hash: \n' + hash);
    })
    .on('receipt', (receipt) => {
        var success = receipt.status ? 'succeded' : 'failed';
        alert('Transaction ' + success);
    })
    .catch(e => {
     console.log("Call Failed", e);
    });

    this.updateAmounts();
    this.updatePayeeAmounts();
    this.setState({splitAmount:0});
  };

  listenToTransfer = () => {
    this.Splitter.LogSplitDoneEvent()
          .on("data", this.updateAmounts, this.updatePayeeAmounts);
  };

  listenToWithdraw = () => {
    this.Splitter.LogEtherWithdrawnEvent()
          .on("data", this.updateAmounts, this.updatePayeeAmounts);
  };

  updateAmounts = async () => {
    let ownerShare = '0';
    ownerShare = await this.Splitter.payeeBalance(window.accounts[0]);
    const splitterBalance = await window.web3.eth.getBalance(this.state.splitterAddress);

    this.setState({ownerAmount: ownerShare.toString()});
    this.setState({splitterAmout:splitterBalance.toString()})
  }

  updatePayeeAmounts = async () => {
    try{
        const payeeOneShare = await this.Splitter.payeeBalance(this.state.payeeOneAddress);
        const payeeTwoShare = await this.Splitter.payeeBalance(this.state.payeeTwoAddress);
        this.setState({payeeOneAmount: payeeOneShare.toString()});
        this.setState({payeeTwoAmount: payeeTwoShare.toString()});
    } catch (e){
        console.log(e)
        }
  }

  render() {
    if (!this.state.loaded) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1>Splitter App</h1>
        <p>Splitter Ballance: {this.state.splitterAmout} Wei</p>
        <h2>Split Wei</h2>
        <div>
            <p>Amount to split:
                <
                    input itype="text"
                    name="splitAmount"
                    value={this.state.splitAmount}
                    onChange={this.handleInputChange}
                />
            </p>
            <p>Payee 1 address:
                <
                    input type="text"
                    name="payeeOneAddress"
                    value={this.state.payeeOneAddress}
                    onChange={this.handleInputChange}
                />
            </p>
            <p>Payee 2 address:
                <
                    input type="text"
                    name="payeeTwoAddress"
                    value={this.state.payeeTwoAddress}
                    onChange={this.handleInputChange}
                />
            </p>
            <button type="button" onClick={this.handleSplit}>Split!</button>
        </div>
        <div> funds available</div>
            <p>Owner: {this.state.ownerAmount} Wei</p>
            <p>Payee 1: {this.state.payeeOneAmount} Wei</p>
            <p>Payee 2: {this.state.payeeTwoAmount} Wei</p>
      </div>
    );
  }
}

export default App;
