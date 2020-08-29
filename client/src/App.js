import React, { Component } from "react";
import splitterContract from "./contracts/Splitter.json";
import getWeb3 from "./getWeb3";

import "./App.css";

class App extends Component {
  state = { loaded:false, splitterAmout:0, splitAmount:0, ownerAmount:0, payeeOneAddress: "0x0", payeeTwoAddress: "0x0", payeeOneAmount:0, payeeTwoAmount:0 };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      this.web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      this.accounts = await this.web3.eth.getAccounts();

      // Get the contract instance.
      this.networkId = await this.web3.eth.net.getId();

      this.Splitter = new this.web3.eth.Contract(
        splitterContract.abi,
        splitterContract.networks[this.networkId] && splitterContract.networks[this.networkId].address,
      );

      //this.listenToTransfer();
      //this.listenToWithdraw();
      //this.web3.accounts.on('update', (selectedAddress) => console.log(selectedAddress));
      this.setState({loaded:true}, this.updateAmounts);
    } catch (error) {
      // Catch any errors for any of the above operations.
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

  handleBuyTokens = async() => {
    await this.tokenSaleInstance.methods.performSplit(
        this.state.payeeOneAddress, this.state.payeeTwoAddress
    ).send(
        {from: this.accounts[0], value: this.web3.utils.toWei(this.state.splitAmount, "wei")}
    );
  };

  listenToTransfer = () => {
    //this.Splitter.events.LogSplitDoneEvent().on("data", this.updateAmounts);
  };

  listenToWithdraw = () => {
    //this.Splitter.events.LogEtherWithdrawnEvent().on("data", this.updateAmounts);
  };

  updateAmounts = async () => {
    const ownerShare = this.Splitter.methods.payeeBalance(this.accounts[0]).call();
    const payeeOneShare = this.Splitter.methods.payeeBalance(this.state.payeeOneAddress).call();
    const payeeTwoShare = this.Splitter.methods.payeeBalance(this.state.payeeTwoAddress).call();
    this.setState({ownerAmount: ownerShare});
    this.setState({payeeOneAmount: payeeOneShare});
    this.setState({payeeTwoAmount: payeeTwoShare});
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
            <p>Amount to split: <input type="text" name="splitAmount" value={this.state.splitAmount} onChange={this.handleInputChange} /></p>
            <p>Payee 1 address: <input type="text" name="payeeOneAddress" value={this.state.payeeOneAddress} onChange={this.handleInputChange} /></p>
            <p>Payee 2 address: <input type="text" name="payeeTwoAddress" value={this.state.payeeTwoAddress} onChange={this.handleInputChange} /></p>
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
