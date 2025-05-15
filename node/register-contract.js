const setupDashClient = require('./setupDashClient');
const contractJson = require('./contract-mainnet-v0.json')

const client = setupDashClient();

const registerContract = async function () {
  try {
    const { platform } = client;
    const identity = await platform.identities.get(process.env.IDENTITY_ID);
    console.log(identity.toJSON())
    const contract = await platform.contracts.create(contractJson, identity);
    console.dir({ contract: contract.toJSON() });
  
    // Sign and submit the data contract
    await platform.contracts.publish(contract, identity);
    return contract;
  } catch (e) {
    console.error('Something went wrong:', e);
    console.dir(e.message)
  } finally {
    client.disconnect();
  }
}

registerContract();

