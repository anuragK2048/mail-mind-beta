/**
 * TODO(developer): Uncomment these variables before running the sample.
 */
const subscriptionNameOrId = "my-sub";
const timeout = 10;

// Imports the Google Cloud client library
const { PubSub } = require("@google-cloud/pubsub");
const { publishMessage } = require("./pub_sub");

// Creates a client; cache this for further use
const pubSubClient = new PubSub();

function listenForMessages(subscriptionNameOrId, timeout) {
  // References an existing subscription; if you are unsure if the
  // subscription will exist, try the optimisticSubscribe sample.
  const subscription = pubSubClient.subscription(subscriptionNameOrId);

  // Create an event handler to handle messages
  let messageCount = 0;
  const messageHandler = (message) => {
    console.log(`Received message ${message.id}:`);
    console.log(`\tData: ${message.data}`);
    console.log(`\tAttributes: ${message.attributes}`);
    messageCount += 1;

    // "Ack" (acknowledge receipt of) the message
    message.ack();
  };

  // Listen for new messages until timeout is hit
  subscription.on("message", messageHandler);

  // Wait a while for the subscription to run. (Part of the sample only.)
  setTimeout(() => {
    subscription.removeListener("message", messageHandler);
    console.log(`${messageCount} message(s) received.`);
  }, timeout * 1000);
}

listenForMessages(subscriptionNameOrId, timeout);

const topicNameOrId = "my-topic";
const data = JSON.stringify({ foo: "bar" });

publishMessage(topicNameOrId, data);
