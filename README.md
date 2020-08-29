# Splitter
Ethereum Developer Course - Project 1 - Splitter

----------Task

You will create a smart contract named Splitter whereby:

there are 3 people: Alice, Bob and Carol.
we can see the balance of the Splitter contract on the Web page.
whenever Alice sends ether to the contract for it to be split, half of it goes to Bob and the other half to Carol.
we can see the balances of Alice, Bob and Carol on the Web page.
Alice can use the Web page to split her ether.
We purposely left a lot to be decided. Such description approximates how your human project sponsors would describe the rules. As the Ethereum Smart Contract specialist, you have to think things through.

----------Project

The Splitter contract allow for its creator (Owner) to split an amount of ether between two different accounts by providing two seperate valid account addresses and a positive amount of ether to be split. As solidity doesnt handle floating point arithmatic yet, any leftover ether that reamins after the split will be pooled into a seperate bucket, and atempted to be added to any subsequent splits.

The payees can in turn withdraw the ether allotted to them through the split.

----------Run

**Prerequisite**

```bash
ganache-cli -i 5777
```

**Test**

```bash
truffle test --network development
```

----------Dependencies

Truffle v5.1.14-nodeLTS.0 (core: 5.1.13)

Solidity - ^0.6.0 (solc-js)

Node v12.18.3

Web3.js v1.2.1

npm

├── @openzeppelin/contracts@3.0.0

├── chai@4.2.0

├── chai-as-promised@7.1.1

├── chai-bn@0.2.1

├── dotenv@8.2.0

├── ganache-cli@6.10.1

├── package_name@1.0.2

├── solc@0.7.0

├── truffle-assertions@0.9.2 

├── truffle@5.1.41

└── web3@1.2.11
