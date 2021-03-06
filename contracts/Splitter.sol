pragma solidity ^0.6.0;

import "./Pausable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/// @author Kat
/// @title A contract for splitting ethereum 
contract Splitter is Pausable{

    using SafeMath for uint;

    mapping(address => uint) public payeeBalance;

    event LogEtherWithdrawnEvent(address indexed sender, uint amount);
    event LogSplitDoneEvent(address indexed sender, address indexed payee1, address indexed payee2, uint amount);

    constructor(bool pauseState) Pausable(pauseState) public {}

    /// Split funds between payees
    /// @param payee1 - first payee
    /// @param payee2 - second payee
    /// @dev  
    function performSplit(address payable payee1, address payable payee2) public whenRunning payable {
        require(payee1 != address(0x0) && payee2 != address(0x0), "incorrect payee specified");
        require(payee1 != payee2, "only one payee specified");
        require(payee1 != msg.sender && payee2 != msg.sender, "sender can't be payee");
        require(msg.value > 1, "Cant split less than 2 wei");

        uint leftOver = msg.value.mod(2);
        uint payout = msg.value.div(2);

        payeeBalance[payee1] = payeeBalance[payee1].add(payout);
        payeeBalance[payee2] = payeeBalance[payee2].add(payout);
        if (leftOver > 0) {
            payeeBalance[msg.sender] = payeeBalance[msg.sender].add(leftOver);
        }
        
        emit LogSplitDoneEvent(msg.sender, payee1, payee2, payout);
    }

    /// Withdraw an amount of ether
    /// @param amount the amount of ehter to withdraw
    /// @dev allows payee to withdraw their alloted funds
	/// @return true if succesfull
    function withdrawEther(uint amount) public whenRunning returns (bool) {
        require(amount > 0, "No Ether requested");
        uint payeeAmount = payeeBalance[msg.sender];
        payeeBalance[msg.sender] = payeeAmount.sub(amount, 'bad amount requested');
        emit LogEtherWithdrawnEvent(msg.sender, amount);
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, 'Transfer failed!');
        return true;
    }
}
