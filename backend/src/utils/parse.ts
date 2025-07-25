export function parseLlmResponse(llmResponseString: any) {
  const cleanJsonString = llmResponseString
    .replace(/```json/g, "")
    .replace(/```/g, "");
  return JSON.parse(cleanJsonString);
}
