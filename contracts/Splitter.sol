pragma solidity ^0.6.0;

import "./Owned.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract Splitter is Owned{

    using SafeMath for uint;

    address payable[] payee;
    mapping(address => bool) payeeMap;
    uint payeeCount;

    event addedPayee();
    event MoneySent();
    event MoneyRecieved();
    event split();

    function addPayee(address payable _who) public onlyOwner {
        require(!payeeMap[_who], "payee already exists");
        payee.push();
        payee[payeeCount] = _who;
        payeeMap[_who] = true;
        payeeCount += 1;
        emit addedPayee();
    }

    function performSplit() public onlyOwner {
        require(address(this).balance > 0, "Account empty");
        require(payeeCount > 0, "No Payees");
        
        uint payout = address(this).balance.div(payee.length);
        for (uint8 i = 0; i < payee.length; i++) {
            sendMoney(payee[i], payout);
        }
    }

    function sendMoney(address payable _who, uint amount) private onlyOwner {
        _who.transfer(amount);
    }

    function viewPayeeCount() public view returns (uint){
        return payeeCount;
    }

    receive() external payable {
        require(msg.sender == owner, "Only owner is allowed to deposit");        
        emit MoneySent();
    }

}
