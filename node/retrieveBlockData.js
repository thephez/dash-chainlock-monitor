const Dash = require('dash');

const clientOpts = {
  network: 'evonet',
  apps: {
    chainLockMonitor: {
      contractId: 'mLZ2AcwHJ39QN7iA1nxnQB7QhqBfeSPnrbr7rkGSCcP'
    }
  }
};

const client = new Dash.Client(clientOpts);

const getDocuments = async function () {
  try {
    const queryOpts = {
      limit: 10,
    };
    const documents = await client.platform.documents.get(
      'chainLockMonitor.blockInfo',
      queryOpts
    );
    console.dir({documents}, {depth:10})
    return documents;

  } catch (e) {
    console.error('Something went wrong:', e);
  } finally {
    client.disconnect();
  }
};

getDocuments();
