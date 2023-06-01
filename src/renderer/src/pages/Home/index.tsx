import clsx from "clsx";
import { useState } from "react";
import { useAsync } from "react-async-hook";

export default function HomePage() {
  const [topic, setTopic] = useState("");

  const generate = useAsync(
    async (topic) => await window.main.invoke("textToLights", topic),
    [topic],
    { executeOnMount: false, executeOnUpdate: false }
  );

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-row space-x-2">
        <button
          className="flex-1"
          onClick={() => window.main.invoke("turnLightsOn")}
        >
          Lights on
        </button>
        <button
          className="flex-1"
          onClick={() => window.main.invoke("turnLightsOff")}
        >
          Lights off
        </button>
      </div>

      <div className="flex flex-col space-y-2">
        <textarea
          disabled={generate.loading}
          className="p-4 rounded-lg"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button
          disabled={generate.loading}
          onClick={async () => {
            generate.execute(topic);
          }}
        >
          Generate
        </button>
      </div>
    </div>
  );
}
