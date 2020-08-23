pragma solidity ^0.6.0;

import "./Owned.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract Splitter is Owned{

    using SafeMath for uint;

    mapping(address => uint) public payeeBalance;
    uint public leftOver;

    event EtherWithdrawnEvent(address indexed sender, uint amount);
    event SplitDoneEvent(address indexed sender, address indexed payee1, address indexed payee2, uint amount);

    function performSplit(address payable payee1, address payable payee2) public payable onlyOwner {
        require(msg.value > 0, "No ether sent for split");
        require(payee1 != payee2, "only one payee specified");
        require(payee1 != msg.sender && payee2 != msg.sender, "sender can't be payee");
        require(payee1 != address(0x0) && payee2 != address(0x0), "incorrect payee specified");

        uint payout = msg.value.add(leftOver);
        leftOver = payout.mod(2);
        payout = payout.div(2);

        payeeBalance[payee1] = payeeBalance[payee1].add(payout);
        payeeBalance[payee2] = payeeBalance[payee2].add(payout);
        
        emit SplitDoneEvent(msg.sender, payee1, payee2, payout);
    }

    function withdrawEther(uint amount) public returns (bool) {
        require(payeeBalance[msg.sender] > 0, "No Ether in splitter");
        require(amount <= payeeBalance[msg.sender], "More Ether requested than available");
        payeeBalance[msg.sender] -= amount;
        msg.sender.transfer(amount);
        emit EtherWithdrawnEvent(msg.sender, amount);
        return true;

    }
}
