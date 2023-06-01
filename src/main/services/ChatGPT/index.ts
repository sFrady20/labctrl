import { OPEN_AI_API_KEY } from "@main/config";
import axios from "axios";
import fs from "fs";
import path from "path";

export async function prompt(p: Prompt) {
  const response = (
    await axios.post("https://api.openai.com/v1/chat/completions", p, {
      headers: {
        Authorization: `Bearer ${OPEN_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
    })
  ).data.choices[0].message.content as string;

  fs.appendFileSync(
    path.join(__dirname, "./gpt.log"),
    `---------\n${JSON.stringify({ prompt: p, response })}\n`
  );

  return response;
}
