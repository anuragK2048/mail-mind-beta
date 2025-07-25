import { askLLM } from "../services/openAiApi.js";

const prompt = `You are an expert assistant that summarizes emails. You will receive the raw email data, which may include HTML content, metadata (like subject, sender, date), and the email body.

Your task is to:

Extract and summarize the main content of the email in simple language.

Highlight any important action items, dates, or tasks.

Ignore or filter out unnecessary HTML/CSS/JavaScript content, formatting artifacts, or boilerplate (like unsubscribe links, copyright, etc.).


Output Format:

Summary: A concise summary (2-3 lines).

Action Items: Bullet points if there are any.

Date(s) Mentioned: If applicable.

Respond in this exact JSON format:
{
  summary: string,
  actionItems: string[],
  datesMentioned: string[]
}

Here is the emailDetails 

`;

async function getSummary(emailDetails) {
  const finalPrompt = prompt + JSON.stringify(emailDetails);
  const response = await askLLM(finalPrompt);
  const parsedResponse = JSON.parse(response);
  return parsedResponse;
}

export default getSummary;
