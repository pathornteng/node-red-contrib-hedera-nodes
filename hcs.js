module.exports = function (RED) {
  var TopicMessageSubmitTransaction =
    require("@hashgraph/sdk").TopicMessageSubmitTransaction;
  var Client = require("@hashgraph/sdk").Client;

  function HederaHcsNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var accountId = node.credentials.accountId;
    var privateKey = node.credentials.privateKey;
    let client = Client.forTestnet();
    if (config.network == "mainnet") {
      client = Client.forMainnet();
    }

    client.setOperator(accountId, privateKey);
    node.on("input", async function (msg) {
      try {
        //Create and submit a message to Hedera Consensus Service
        const tx = await new TopicMessageSubmitTransaction({
          topicId: config.topicId,
          message: msg.payload.toString(),
        }).execute(client);

        //Query receipt to check transaction status
        const getReceipt = await tx.getReceipt(client);
        msg.payload = getReceipt.status;
        node.send(msg);
      } catch (err) {
        msg.payload = err.toString();
        node.send(msg);
      }
    });
  }

  RED.nodes.registerType("hedera-hcs-node", HederaHcsNode, {
    credentials: {
      accountId: { type: "text" },
      privateKey: { type: "password" },
    },
  });
};
