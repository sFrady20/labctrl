import { useLocation, useNavigate } from "react-router";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TimerBasedCronScheduler as scheduler } from "cron-schedule/schedulers/timer-based.js";
import { parseCronExpression } from "cron-schedule";
import contextPrompt from "./prompt-context.txt?raw";
import requestPrompt from "./prompt-request.txt?raw";
import clsx from "clsx";
import { DateTime } from "luxon";

type Workout = {
  id: string;
  status: "prompting" | "active" | "completed";
  content?: string;
};

const useWorkout = create(
  persist<{
    queue: Workout[];
    interval: any;
    createWorkout: () => Promise<void>;
    completeWorkout: (id: string) => void;
    giveUp: (id: string) => void;
    deactivate: () => void;
  }>(
    (set, get) => ({
      queue: [],
      createWorkout: async () => {
        console.log("Prompting workout");
        try {
          const id = Math.random().toString(32).substring(7);
          set((x) => ({
            ...x,
            queue: [
              {
                id,
                status: "prompting",
              },
              ...x.queue,
            ],
          }));
          const result = await window.main.invoke("prompt", {
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: contextPrompt },
              {
                role: "user",
                content: requestPrompt
                  .replace(
                    "{{PREVIOUS_WORKOUTS}}",
                    get()
                      .queue.slice(1, 3)
                      .map((x) => `\`\`\`${x.content}\`\`\``)
                      .join("\n")
                  )
                  .replace("{{CURRENT_TIME}}", DateTime.now().toLocaleString()),
              },
            ],
          });
          set((x) => ({
            ...x,
            queue: x.queue.map((x) =>
              x.id === id ? { ...x, status: "active", content: result } : x
            ),
          }));
        } catch (err) {
          console.error(err);
        }
      },
      completeWorkout: (id: string) => {
        set((x) => ({
          ...x,
          queue: x.queue.map((x) =>
            x.id === id ? { ...x, status: "completed" } : x
          ),
        }));
      },
      giveUp: (id: string) => {
        set((x) => ({
          ...x,
          queue: x.queue.filter((x) => x.id !== id),
        }));
      },
      interval: scheduler.setInterval(
        parseCronExpression("0 0 10,14,18,22 * * *"),
        () => {
          get().createWorkout();
        }
      ),
      deactivate: () => {
        const activeInterval = get().interval;
        if (activeInterval) scheduler.clearTimeoutOrInterval(get().interval);
      },
    }),
    {
      name: "workout-store",
    }
  )
);
import.meta.hot?.on("vite:beforeUpdate", () => {
  useWorkout.getState().deactivate();
});

export function WorkoutWidget() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const workout = useWorkout();

  if (pathname === "/workout") return null;

  if (workout.queue.some((x) => x.status === "prompting"))
    return (
      <div className="fixed left-3 bottom-3 right-3 bg-gray-900 p-2 items-center rounded-lg flex flex-row space-x-3">
        <div className="flex-1 px-2">Generating workout...</div>
        <div className="i-svg-spinners-3-dots-fade px-4 text-xl" />
      </div>
    );

  if (workout.queue.some((x) => x.status === "active"))
    return (
      <div className="fixed left-3 bottom-3 right-3 bg-red-900 p-2 items-center rounded-lg flex flex-row space-x-3">
        <div className="flex-1 px-2">Workout time!</div>
        <button
          className="hover:bg-red-800 rounded-md h-11 px-2 flex flex-row space-x-1 items-center"
          onClick={() => navigate("/workout")}
        >
          <div className="text-sm font-medium">Let's get it </div>
          <div className="i-bx-right-arrow-alt" />
        </button>
      </div>
    );

  return null;
}

export default function WorkoutPage() {
  const workouts = useWorkout();

  return (
    <div className="p-4 space-y-4 whitespace-pre-wrap">
      <div className="flex flex-row space-x-2">
        <div
          className="h-8 rounded-md flex flex-row items-center px-4 bg-gray-900 hover:bg-gray-800 cursor-pointer"
          onClick={() => workouts.createWorkout()}
        >
          Generate
        </div>
      </div>
      {workouts.queue.slice(0, 15).map((workout) =>
        workout.status === "prompting" ? (
          <div className="bg-gray-800 p-2 items-center rounded-lg flex flex-row space-x-3">
            <div className="flex-1 px-2">Generating workout...</div>
            <div className="i-svg-spinners-3-dots-fade px-4 text-xl" />
          </div>
        ) : (
          <div
            key={workout.id}
            className={clsx(" space-y-2", {
              "opacity-60": workout.status === "completed",
            })}
          >
            <div
              className={clsx(
                " px-2 py-4 bg-gray-900 rounded-lg",
                workout.status === "completed" && "line-clamp-4"
              )}
            >
              {workout.content}
            </div>
            {workout.status == "active" && (
              <div className="flex flex-row items-center justify-end space-x-2">
                <div
                  className="h-8 rounded-md flex flex-row items-center px-4 bg-green-950 hover:bg-green-900 cursor-pointer"
                  onClick={() => workouts.completeWorkout(workout.id)}
                >
                  Complete
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
