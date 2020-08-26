pragma solidity ^0.6.0;

contract Owned {

    address private owner;
    event LogOwnershipChange(address indexed newOwner);

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

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0x0));
        owner = newOwner;
        emit LogOwnershipChange(newOwner);
    }
}
