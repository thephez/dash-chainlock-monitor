const setupDashClient = require('./setupDashClient');
const client = setupDashClient();
const dotenv = require('dotenv');
dotenv.config();

const getBlockDocument = async function (hash) {
  // console.log('getBlockDocument')
    try {
        const queryOpts = {
          where: [['hash', '==', hash]]
        };
        const documents = await client.platform.documents.get(
          'chainlockMonitor.blockInfo',
          queryOpts
        );
        
        if (documents.length == 1) {
            // console.log(documents[0].getData());
            return documents[0];
        } else if (documents.length === 0) {
            throw new Error(`No document found for ID ${hash.toString('hex')}`);
        } else {
            // Uhoh
            // Should probably pass to submitBlockData if doc not found
            console.log(`Got unexpected amount of data (${documents.length} documents returned for ID ${hash.toString('hex')})`);
        }
      } catch (e) {
        console.error('Something went wrong:', e);
      }
}


const updateBlockInfo = async function (hash, isChainLocked, chainLockTime) {
  console.log('updateBlockInfo')
    const platform = client.platform;
    const blockDocument = await getBlockDocument(hash);
    const identity = await platform.identities.get('AVGaxbN1apFAM4aWtkjUJvPhT1Nr3AeKzgb22sqWvKNe');
    const timeToLock = chainLockTime - blockDocument.getData().receiveTime;
    console.log(`U\t${hash}\tReceived: ${blockDocument.getData().receiveTime}\tChainLock: ${isChainLocked}\tTime to lock: ${timeToLock}`)

    blockDocument.set('receiveTime', blockDocument.getData().receiveTime);
    blockDocument.set('isChainLocked', isChainLocked);
    // blockDocument.set('chainLockTime', chainLockTime);
    blockDocument.set('timeToLock', timeToLock);

    // console.log(blockDocument.getData())
    const documentBatch = {
      replace: [blockDocument],
    }

    try {
      // Sign and submit the document(s)
      await platform.documents.broadcast(documentBatch, identity);
    } catch (e) {
        //console.error('Something went wrong:', e);
        console.dir({e}, {depth:10})
    } finally {
      client.disconnect();
    }
};
const hash = Buffer.from(process.argv[2], 'hex');
const isChainLocked = (process.argv[3] == 'True');
const chainLockTime = parseInt(process.argv[4]);

updateBlockInfo(hash, isChainLocked, chainLockTime);
console.log("UpdateBlockData done");
