const setupDashClient = require('./setupDashClient');
const client = setupDashClient();
const dotenv = require('dotenv');
dotenv.config();

const submitBlockInfoDocument = async function (hash, receiveTime, isChainLocked, chainLockTime, timeToLock) {
  const platform = client.platform;
  //console.log('Receive time:'+receiveTime)
  try {
    const identity = await platform.identities.get('AVGaxbN1apFAM4aWtkjUJvPhT1Nr3AeKzgb22sqWvKNe'); //process.env.IDENTITY_ID);
    // console.log(`hash: ${hash.toString('hex')} ${hash.length}`)
    docProperties = {
      hash: hash,
      receiveTime: receiveTime,
      isChainLocked: isChainLocked,
      // chainLockTime: chainLockTime,
      timeToLock: timeToLock
    }
    console.log(`S\t${docProperties.hash.toString('hex')}\tReceived: ${docProperties.receiveTime}\tChainLock: ${docProperties.isChainLocked}\tTime to lock: ${docProperties.timeToLock}`)
    // Create the document
    const blockInfoDocument = await platform.documents.create(
      'chainlockMonitor.blockInfo',
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
    console.error('Something went wrong:', e.message);
    console.error('Something went wrong:', e.stack);
  } finally {
    client.disconnect();
  }
};

const hash = Buffer.from(process.argv[2], 'hex');
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
console.log("submitBlockData done");