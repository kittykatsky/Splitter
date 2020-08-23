pragma solidity ^0.6.0;

contract Owned {

    address internal owner;

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner is allowd to do this");
        _;
    }

    function getOwner() public view returns (address) {
        return owner;    
    }
}
