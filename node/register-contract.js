const Dash = require('dash');

const clientOpts = {
  network: 'evonet',
};
const client = new Dash.Client(clientOpts);

const registerContract = async function () {
  try {
    const platform = client.platform;
    
    const contractDocuments = {
      blockInfo: {
        properties: {
          hash: {
            type: "string",
            maxLength: 64,
            description: "Block hash"
          },
          receiveTime: {
            type: "integer",
            description: "Timestamp indicating when block was seen by node"
          },
          chainLockTime: {
            type: "integer",
            description: "Timestamp indicating when ChainLock was seen by node"
          },
          isChainLocked: {
            type: "boolean",
            description: "True if ChainLock received"
          },
          timeToLock: {
            type: "integer",
            description: "(receiveTime - chainLockTime)"
          }
        },
        indices: [
          {
            properties: [ { "hash": "desc" } ],
            //"unique": true
          },
          {
            properties: [ { "isChainLocked": "desc" } ]
          },
          {
            properties: [ { "receiveTime": "desc" } ]
          },
          {
            properties: [ { "chainLockTime": "desc" } ]
          },          
        ],
        required: ["$createdAt", "$updatedAt", "hash", "receiveTime", "chainLockTime", "isChainLocked", "timeToLock"],
        additionalProperties: false
      }};
    
    const contract = await platform.contracts.create(contractDocuments, identity);
    console.dir({contract}, {depth:10});

    // Make sure contract passes validation checks
    const validationResult = await platform.dpp.dataContract.validate(contract);

    if (validationResult.isValid()) {
      console.log("validation passed, broadcasting contract..");
      // Sign and submit the data contract
      await platform.contracts.broadcast(contract, identity);
    } else {
      console.error(validationResult) // An array of detailed validation errors
      throw validationResult.errors[0];
    }
    
  } catch (e) {
    console.error('Something went wrong:', e);
  } finally {
    client.disconnect();
  }
}

registerContract();

