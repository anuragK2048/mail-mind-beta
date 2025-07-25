require("dotenv").config();

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// async () => {
//   const messages = [
//     { role: "system", content: "You are a helpful assistant." },
//     { role: "user", content: "Who won the 2022 world cup?" },
//     { role: "assistant", content: "Argentina won the 2022 World Cup." },
//     { role: "user", content: "Where was it held?" },
//   ];

//   const response = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages,
//   });

//   console.log(response.choices[0].message.content);
// };

async function askLLM(prompt) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });
  return response.choices[0].message.content;
}

export { askLLM };
