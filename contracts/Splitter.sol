pragma solidity ^0.6.0;

import "./Owned.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/// @author Kat
/// @title A contract for splitting ethereum 
contract Splitter is Owned{

    using SafeMath for uint;

    mapping(address => uint) public payeeBalance;
    uint public leftOver;

    event LogEtherWithdrawnEvent(address indexed sender, uint amount);
    event LogSplitDoneEvent(address indexed sender, address indexed payee1, address indexed payee2, uint amount);

    /// Split funds between payees
    /// @param payee1 - first payee
    /// @param payee2 - second payee
    /// @dev currently no way of ensuring that the same payees are specified when called multiple times 
    function performSplit(address payable payee1, address payable payee2) public payable onlyOwner {
        require(msg.value > 0, "No ether sent for split");
        require(payee1 != payee2, "only one payee specified");
        require(payee1 != msg.sender && payee2 != msg.sender, "sender can't be payee");
        require(payee1 != address(0x0) && payee2 != address(0x0), "incorrect payee specified");

        uint payout = msg.value.add(leftOver);
       
        /* should the leftOver be returned to the owner?
        /  currently theres nothing stopping the owner from
        /  calling the splitter function with different accounts
        /  possibly giving extra ether to some other account.
        */

        leftOver = payout.mod(2);
        payout = payout.div(2);

        payeeBalance[payee1] = payeeBalance[payee1].add(payout);
        payeeBalance[payee2] = payeeBalance[payee2].add(payout);
        
        emit LogSplitDoneEvent(msg.sender, payee1, payee2, payout);
    }

    /// Withdraw an amount of ether
    /// @param amount the amount of ehter to withdraw
    /// @dev allows payee to withdraw their alloted funds
	/// @return true if succesfull
    function withdrawEther(uint amount) public returns (bool) {
        /* 
        /
        /
        */

        require(payeeBalance[msg.sender] > 0, "No Ether in splitter");
        require(amount <= payeeBalance[msg.sender], "More Ether requested than available");
        payeeBalance[msg.sender] -= amount;
        msg.sender.transfer(amount);
        emit LogEtherWithdrawnEvent(msg.sender, amount);
        return true;
    }


    /// Fallback function 
    /// @dev ensures that no ether can be sent directly to contract
    receive() external payable {
        revert("cant send ether directly");
    }
}
