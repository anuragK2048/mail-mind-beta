async function getListOfLabels(gmail) {
  const res = await gmail.users.labels.list({
    userId: "me",
  });
  const labels = res.data.labels;
  if (labels.length) {
    // console.log("Labels:");
    // labels.forEach((label) => {
    //   console.log(`- ${label.name}`);
    // });
  } else {
    console.log("No labels found.");
  }
  return labels;
}

async function sendEmail(gmail, email) {
  const encodedEmail = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedEmail,
    },
  });
  //   console.log(`Email sent: ${res.data}`);
  return res.data;
}

async function getEmailList(gmail, quantity = 10) {
  const res = await gmail.users.messages.list({
    userId: "me",
    maxResults: quantity,
  });
  const messages = res.data.messages;
  if (messages.length) {
    // console.log("Messages:");
    // messages.forEach((message) => {
    //   console.log(`- ${message.id}`);
    // });
  } else {
    console.log("No messages found.");
  }
  return messages;
}

async function getEmailDetails(gmail, messageId) {
  const res = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
  });
  const message = res.data;
  //   console.log("Message details:");
  //   console.log(`- ID: ${message.id}`);
  //   console.log(`- Snippet: ${message.snippet}`);
  return message;
}

export { getListOfLabels, sendEmail, getEmailList, getEmailDetails };
