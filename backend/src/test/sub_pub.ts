/**
 * TODO(developer): Uncomment these variables before running the sample.
 */
const topicNameOrId = "my-topic";
const data = JSON.stringify({ foo: "bar" });

// Imports the Google Cloud client library
import { PubSub } from "@google-cloud/pubsub";

// Creates a client; cache this for further use
const pubSubClient = new PubSub();

async function publishMessage(topicNameOrId: string, data: string) {
  // Publishes the message as a string, e.g. "Hello, world!" or JSON.stringify(someObject)
  const dataBuffer = Buffer.from(data);

  // Cache topic objects (publishers) and reuse them.
  const topic = pubSubClient.topic(topicNameOrId);

  try {
    const messageId = await topic.publishMessage({ data: dataBuffer });
    console.log(`Message ${messageId} published.`);
  } catch (error) {
    console.error(
      `Received error while publishing: ${(error as Error).message}`
    );
    process.exitCode = 1;
  }
}

publishMessage(topicNameOrId, data);
