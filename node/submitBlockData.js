const Dash = require('dash');

const clientOpts = {
  network: 'evonet',
  apps: {
    chainLockMonitor: {
      contractId: '8xqvgRrswwphWRgasWz8gzqspgM6rrT9VrDHkBHVgCVB'
    }
  }
};
const client = new Dash.Client(clientOpts);

const submitBlockInfoDocument = async function (hash, receiveTime, isChainLocked, chainLockTime, timeToLock) {
  const platform = client.platform;
  //console.log('Receive time:'+receiveTime)
  try {
    const identity = await platform.identities.get('8DpCxc6CY1vHQzQVv8EezN4fpKis5K2YuxGYRSiccsC8');
      
    docProperties = {
      hash: hash,
      receiveTime: receiveTime,
      isChainLocked: isChainLocked,
      chainLockTime: chainLockTime,
      timeToLock: timeToLock
    }
     
    // Create the document
    const blockInfoDocument = await platform.documents.create(
      'chainLockMonitor.blockInfo',
      identity,
      docProperties,
    );
    //console.dir({blockInfoDocument})
    const documentBatch = {
      create: [blockInfoDocument],
    };

    // Sign and submit the document(s)
    await platform.documents.broadcast(documentBatch, identity);
    //return blockInfoDocument.toJSON()
  } catch (e) {
    console.error('Something went wrong:', e);
  } finally {
    client.disconnect();
  }
};

*/
const hash = process.argv[2];
const isChainLocked = (process.argv[3] == 'True');
const receiveTime = parseInt(process.argv[4]);
const chainLockTime = parseInt(process.argv[5]);

let timeToLock = 0;
if (chainLockTime > 0) {
  timeToLock = chainLockTime - receiveTime;
} else {
  timeToLock = 0;
}


submitBlockInfoDocument(hash, receiveTime, isChainLocked, chainLockTime, timeToLock);
