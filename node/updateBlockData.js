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

const getBlockDocument = async function (hash) {

    try {
        const queryOpts = {
          where: [['hash', '==', hash]]
        };
        const documents = await client.platform.documents.get(
          'chainLockMonitor.blockInfo',
          queryOpts
        );
        
        if (documents.length == 1) {
            console.log(documents[0].getData());
            return documents[0];
        } else {
            // Uhoh
        }
      } catch (e) {
        console.error('Something went wrong:', e);
      } finally {
        client.disconnect();
      }
}


const updateBlockInfo = async function (hash, isChainLocked, chainLockTime) {
    const platform = client.platform;
    const blockDocument = await getBlockDocument(hash);

    const identity = await platform.identities.get('8DpCxc6CY1vHQzQVv8EezN4fpKis5K2YuxGYRSiccsC8');
    const timeToLock = chainLockTime - blockDocument.data.receiveTime
    docProperties = {
      '$id': blockDocument.id, // Designates which document to replace
      hash: hash,
      receiveTime: blockDocument.data.receiveTime,
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

    const documentBatch = {
      replace: [blockInfoDocument],
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
const hash = process.argv[2];
const isChainLocked = (process.argv[3] == 'True');
const chainLockTime = parseInt(process.argv[4]);

updateBlockInfo(hash, isChainLocked, chainLockTime);
