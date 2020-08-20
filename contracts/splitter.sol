pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract splitter is Ownable{

    using SafeMath for uint;

    mapping(address => bool) public receiver;
    mapping(address => uint) public receiverFunds;

    uint8 public receiverCount;

    event addedReciever();
    event MoneySent();
    event MoneyRecieved();
    event split();

    function addReciever(address _who) public onlyOwner {
        receiver[_who] = true;
        receiverCount += 1;
        emit addedReciever();
    }

    receive() external payable {
        require(msg.sender == owner(), "Only owner is allowed to deposit");        
        emit MoneySent();
    }

    function renounceOwnership() public onlyOwner override {
         revert("not possible to renounce ownership");
          
    }

    function transferOwnership(address newOwner) public onlyOwner override {
         revert("not possible to change ownership");
          
    }

}
