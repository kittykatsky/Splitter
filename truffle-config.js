const path = require("path");
require("dotenv").config({path: "./.env"});

module.exports = {
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
	// ganache
    development: {
      port: 8545,
      host: "127.0.0.1",
      network_id: 5777
    },
	// geth
    geth_test: {
      port: 8545,
      host: "127.0.0.1",
      network_id: "42"
    }
  },
  compilers: {
    solc: {
      version: "^0.6.0"
    }
  }
};
