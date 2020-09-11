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

const getDocuments = async function () {
  try {
    const queryOpts = {
      limit: 2,
      orderBy: [['receiveTime', 'desc']],
    };
    const documents = await client.platform.documents.get(
      'chainLockMonitor.blockInfo',
      queryOpts
    );
    for (var d of documents){
      console.log(d.createdAt)
      console.log(d.updatedAt)
      console.log(d.getData())
    }
    return documents;

  } catch (e) {
    console.error('Something went wrong:', e);
  } finally {
    client.disconnect();
  }
};

getDocuments();
