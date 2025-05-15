const Dash = require('dash');
const dotenv = require('dotenv');
dotenv.config({ path: '/home/phez/code/dash-chainlock-monitor/node/.env'});
// const dotenvpath = `${process.cwd()}/node/.env`;
// console.log(dotenvpath)
// dotenv.config({ path: dotenvpath});

// console.log(`Network: ${process.env.NETWORK}`);
// console.log(process.cwd())

const clientOptions = {
  network: process.env.NETWORK,
  wallet: {
    mnemonic: process.env.MNEMONIC,
    network: process.env.NETWORK,

    // Unsafe wallet options (use with caution)
    unsafeOptions: {
      // Starting synchronization from a specific block height can speed up the initial wallet sync process.
      skipSynchronizationBeforeHeight: parseInt(
        process.env.SYNC_START_HEIGHT,
        10,
      ),
    },
  },
  // Configuration for Dash Platform applications
  apps: {
    chainlockMonitor: {
      contractId: process.env.CONTRACT_ID, // Your contract ID
    }
  },
};

/**
 * Creates and returns a Dash client instance
 * @returns {Dash.Client} The Dash client instance.
 */
const setupDashClient = () => {
  // Ensure that numeric values from environment variables are properly converted to numbers
  if (clientOptions.wallet?.unsafeOptions?.skipSynchronizationBeforeHeight) {
    clientOptions.wallet.unsafeOptions.skipSynchronizationBeforeHeight =
      parseInt(
        clientOptions.wallet.unsafeOptions.skipSynchronizationBeforeHeight,
        10,
      );
  }
  // console.dir(clientOptions);
  return new Dash.Client(clientOptions);
};

module.exports = setupDashClient;
