import { prompt } from "@main/services/ChatGPT";
import lifx from "../client";
import coreContext from "./context-1.txt?raw";
import roomContext from "./context-2.txt?raw";
import request from "./request.txt?raw";
import lights from "../lights";

export async function textToLights(topic) {
  try {
    const response = await prompt({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: coreContext,
        },
        {
          role: "system",
          content: roomContext.replace(
            "{{LIGHTS}}",
            lights.map((x) => `${x.lifxId},${x.id},${x.description}`).join("\n")
          ),
        },
        { role: "user", content: request.replace("{{TOPIC}}", topic) },
      ],
    });

    const instructions = response.split("\n").map((x) => x.split(","));
    for (let i = 0; i < instructions.length; ++i) {
      const [lifxId, ...args] = instructions[i];
      const light = lifx.light(lifxId);
      console.log(`Commanding light ${lifxId}`, args);
      light.color(...args.map((x) => parseInt(x)));
    }
  } catch (err: any) {
    console.error(err);
    return err.message;
  }
}
