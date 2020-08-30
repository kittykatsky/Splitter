pragma solidity ^0.6.0;

import "./Owned.sol";

/// @author Kat
/// @title A contract for controlling the flow of another contract 
contract Pausable is Owned {

    bool private _paused;
    bool private dead;

    event LogPaused(address indexed user, bool indexed state);
    event LogKilled(address indexed useri, address indexed beneficiary);


    constructor(bool initalState) public {
        _paused = initalState;
    }

    modifier running() {
        require(!_paused, "contract not running");
        _;
    }

    modifier paused() {
        require(_paused, "contract not paused");
        _;
    }

    modifier alive() {
        require(!dead, "contract terminated");
        _;
    }

    /// returns state of contract
	/// @dev possible states are Running/Paused
	/// @return returns paused state
	function isPaused() public view returns (bool) {
	    return _paused;
	}    

    /// set contract state to paused
    /// @dev emits event containing address of caller and new state
	/// @return true if succesfull
    function pause() public onlyOwner running returns(bool) {
        _paused = true;
        emit LogPaused(msg.sender, _paused);

        return true;
    }

    /// set contract state to running
    /// @dev emits event containing address of caller and new state
	/// @return true if succesfull
    function resume() public onlyOwner paused returns(bool) {
        _paused = false;
        emit LogPaused(msg.sender, _paused);

        return true;
    }

    /// permanently turning off the contract
	/// @param beneficiary the address recieving the reamining funds 
    /// @dev emits event containing address of account that triggered kill
	/// @return true if succesfull
    function kill(address payable beneficiary) public onlyOwner paused alive returns(bool) {
        dead = true;
        emit LogKilled(msg.sender, beneficiary);
		emptyAccunt(beneficiary);	
        return true;
    }

    /// empty contract of ether
	/// @param destination destination of contract funds
	function emptyAccunt(address payable destination) private {
        destination.call{value: address(this).balance}("");
	}
}
