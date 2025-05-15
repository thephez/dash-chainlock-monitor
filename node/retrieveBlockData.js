const setupDashClient = require('./setupDashClient');
const client = setupDashClient();
const dotenv = require('dotenv');
dotenv.config();


const getDocuments = async function () {
  try {
    const queryOpts = {
      limit: 100,
      where: [[ 'receiveTime', '>', 0 ]],
      orderBy: [['receiveTime', 'asc']],
    };
    const documents = await client.platform.documents.get(
      'chainlockMonitor.blockInfo',
      queryOpts
    );
    for (var d of documents){
      // console.log(d.createdAt)
      // console.log(d.updatedAt)
      console.log(d.getData())
      console.log(Buffer.from(d.getData().hash, 'base64').toString('hex').padStart(64, '0'));
      console.log(d.getId().toString())
      console.log(d.getCreatedAt());
      console.log(d.getUpdatedAt());
    }
    return documents;

  } catch (e) {
    console.error('Something went wrong:', e);
  } finally {
    client.disconnect();
  }
};

getDocuments();
