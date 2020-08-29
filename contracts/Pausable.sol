pragma solidity ^0.6.0;

import "./Owned.sol";

/// @author Kat
/// @title A contract for controlling the flow of another contract 
contract Pausable is Owned {

    enum pauseState {Running, Paused}
    event LogPausedStateChage(address indexed user, pauseState indexed state);

    pauseState private state;

    constructor() public {
        state = pauseState.Running;
    }

    modifier running() {
        require(state == pauseState.Running, "contract not running");
        _;
    }

    modifier paused() {
        require(state == pauseState.Paused, "contract not paused");
        _;
    }

    /// returns state of contract
    /// @dev possible states are Running/Paused 
	/// @return returns paused state 
    function getState() public view returns (pauseState) {
        return state;    
    }

    /// set contract state to paused
    /// @dev emits event containing address of caller and new state
	/// @return true if succesfull
    function setPause() public onlyOwner returns(bool) {
        require(state == pauseState.Running, "contract already paused");
        state = pauseState.Paused;
        emit LogPausedStateChage(msg.sender, state)

        return true;
    }

    /// set contract state to running
    /// @dev emits event containing address of caller and new state
	/// @return true if succesfull
    function setRunning() public onlyOwner returns(bool) {
        require(state == pauseState.Paused, "contract already running");
        state = pauseState.Running;
        emit LogPausedStateChage(msg.sender, state)

        return true;
    }
}
