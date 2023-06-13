import { useLocation, useNavigate } from "react-router";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TimerBasedCronScheduler as scheduler } from "cron-schedule/schedulers/timer-based.js";
import { parseCronExpression } from "cron-schedule";
import contextPrompt from "./prompt-context.txt?raw";
import requestPrompt from "./prompt-request.txt?raw";
import clsx from "clsx";
import { DateTime } from "luxon";
import { useState } from "react";
import { produce } from "immer";
import useCronSchedule from "@renderer/util/useSchedule";

type Exercise = {
  name: string;
  reps: number;
  sets: number;
  restBetween: number;
  restAfter: number;
  completedSets: number;
};

type Workout = {
  exercises: Exercise[];
};

type TrainingProgram = { id: string } & (
  | {
      status: "active" | "completed";
      raw?: string;
      meditation?: string;
      workout?: Workout;
      nutrition?: string;
      learning?: string;
    }
  | { status: "prompting" }
  | { status: "error"; error: string }
);

const useTraining = create(
  persist<{
    queue: TrainingProgram[];
    interval: any;
    createProgram: () => Promise<void>;
    completeProgram: (id: string) => void;
    removeProgram: (id: string) => void;
    completeSet: (
      programId: string,
      exerciseIndex: number,
      callback?: (rest: number) => void
    ) => void;
    deactivate: () => void;
    clearPending: () => void;
    clearAll: () => void;
  }>(
    (set, get) => ({
      queue: [],
      createProgram: async () => {
        const id = Math.random().toString(32).substring(7);
        try {
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
                    "{{PREVIOUS_PROGRAMS}}",
                    get()
                      .queue.filter((x) => x.status === "completed")
                      .slice(0, 3)
                      .map((x: any) => `\`\`\`${x.raw}\`\`\``)
                      .join("\n")
                  )
                  .replace("{{CURRENT_TIME}}", DateTime.now().toISO()!),
              },
            ],
          });

          //parse response
          const sectionRegex = /==\s*(.*?)\s*==([\s\S]*?)(?=\n==\s*|\n$|$)/g;
          const sections: { [label: string]: string } = {};

          let match: RegExpExecArray | null;
          while ((match = sectionRegex.exec(result)) !== null) {
            const label = match[1].trim().toLowerCase();
            const content = match[2].trim();
            sections[label] = content;
          }

          const workout: Workout = {
            exercises: sections["workout"]
              .split("\n")
              .map((x) => x.split(" - "))
              .map(([name, amt, restBetween, restAfter]) => ({
                name,
                reps: parseInt(amt.split("/")[0]),
                sets: parseInt(amt.split("/")[1]),
                restBetween:
                  parseInt(restBetween.trim().split(":")[0]) * 60 +
                  parseInt(restBetween.trim().split(":")[1]),
                restAfter:
                  parseInt(restAfter.trim().split(":")[0]) * 60 +
                  parseInt(restAfter.trim().split(":")[1]),
                completedSets: 0,
              })),
          };

          set((x) => ({
            ...x,
            queue: x.queue.map((x) =>
              x.id === id
                ? {
                    ...x,
                    status: "active",
                    raw: result,
                    meditation: sections["meditation"],
                    workout,
                    nutrition: sections["nutrition"],
                    learning: sections["learning"],
                  }
                : x
            ),
          }));
        } catch (err: any) {
          console.error(err);
          set((x) => ({
            ...x,
            queue: x.queue.map((x) =>
              x.id === id ? { ...x, status: "error", error: err.message } : x
            ),
          }));
        }
      },
      completeProgram: (id: string) => {
        set((x) => ({
          ...x,
          queue: x.queue.map((x) =>
            x.id === id ? { ...x, status: "completed" } : x
          ),
        }));
      },
      removeProgram: (id: string) => {
        set((x) => ({
          ...x,
          queue: x.queue.filter((x) => x.id !== id),
        }));
      },
      interval: scheduler.setInterval(
        parseCronExpression("0 0 10,17,22 * * *"),
        () => {
          get().createProgram();
        }
      ),
      deactivate: () => {
        const activeInterval = get().interval;
        if (activeInterval) scheduler.clearTimeoutOrInterval(get().interval);
      },
      clearPending: () => {
        set((x) => ({
          ...x,
          queue: x.queue.filter((x) => x.status !== "prompting"),
        }));
      },
      clearAll: () => {
        set((x) => ({
          ...x,
          queue: [],
        }));
      },
      completeSet: (programId, exerciseIndex, callback) => {
        set((x) =>
          produce(x, (draft) => {
            const program = draft.queue.find((x) => x.id === programId);
            if (program?.status !== "active") return;
            const exercise = program.workout?.exercises[exerciseIndex];
            if (!exercise) return;
            exercise.completedSets = Math.min(
              exercise.sets,
              exercise.completedSets + 1
            );
            callback?.(
              exercise.completedSets >= exercise.sets
                ? exercise.restAfter
                : exercise.restBetween
            );
          })
        );
      },
    }),
    {
      name: "training-store",
    }
  )
);
useTraining.getState().clearPending();
import.meta.hot?.on("vite:beforeUpdate", () => {
  useTraining.getState().deactivate();
});

export function TrainingWidget() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const workout = useTraining();

  if (pathname === "/training") return null;

  if (workout.queue.some((x) => x.status === "prompting"))
    return (
      <div className="fixed left-3 bottom-3 right-3 bg-gray-900 p-2 items-center rounded-lg flex flex-row space-x-3">
        <div className="flex-1 px-2">Generating training program...</div>
        <div className="i-svg-spinners-3-dots-fade px-4 text-xl" />
      </div>
    );

  if (
    workout.queue.some(
      (x) =>
        x.status === "active" &&
        x.workout?.exercises.some((x) => x.completedSets < x.sets)
    )
  )
    return (
      <div className="fixed left-3 bottom-3 right-3 bg-red-900 p-2 items-center rounded-lg flex flex-row space-x-3">
        <div className="flex-1 px-2 font-bold">Training time!</div>
        <button
          className="hover:bg-red-800 rounded-md h-11 px-2 flex flex-row space-x-1 items-center"
          onClick={() => navigate("/training")}
        >
          <div className="text-sm font-medium">Let's get it </div>
          <div className="i-bx-right-arrow-alt" />
        </button>
      </div>
    );

  return null;
}

export function ListedExercise(props: {
  program: TrainingProgram;
  exercise: Exercise;
  i: number;
}) {
  const training = useTraining();
  const { program, i, exercise } = props;
  const [restTime, setRestTime] = useState(0);

  useCronSchedule("* * * * * *", () => {
    setRestTime((x) => Math.max(0, x - 1));
  });

  return (
    <div className="h-11 flex flex-row items-center text-sm flex-1 space-x-3">
      <div className="flex-1 px-2">{exercise.name}</div>
      <div className="text-xs">{exercise.reps} reps</div>
      <div className="rounded-md w-8 h-8 flex items-center justify-center bg-gray-950 text-xs">
        {exercise.completedSets}/{exercise.sets}
      </div>
      <div
        className={clsx(
          "rounded-md min-w-8 px-2 space-x-2 h-8 flex items-center justify-center",
          restTime > 0
            ? "bg-yellow-900"
            : exercise.completedSets >= exercise.sets
            ? "bg-green-900"
            : "bg-gray-800 cursor-pointer hover:bg-gray-700"
        )}
        onClick={() => {
          if (restTime > 0) return;
          training.completeSet(program.id, i, (rest) => {
            setRestTime(rest);
          });
        }}
      >
        <div
          className={restTime > 1 ? "i-svg-spinners-dot-revolve" : "i-bx-check"}
        />
        {restTime > 0 && <div className="font-bold">{restTime}</div>}
      </div>
    </div>
  );
}

export default function TrainingPage() {
  const training = useTraining();

  return (
    <div className="p-4 space-y-4 whitespace-pre-wrap">
      <div className="flex flex-row space-x-2">
        <div
          className="h-8 rounded-md flex flex-row items-center px-4 bg-gray-900 hover:bg-gray-800 cursor-pointer"
          onClick={() => training.createProgram()}
        >
          Generate
        </div>
      </div>
      {training.queue.slice(0, 15).map((program) =>
        program.status === "error" ? (
          <div
            key={program.id}
            className="border-red-500 rounded-lg px-2 h-11 b-solid b-1 flex flex-row items-center"
          >
            <div className="text-red-500 text-xs flex-1 px-2">
              {program.error}
            </div>
            <div
              className="text-red-500 h-8 w-8 rounded-md hover:bg-red-900 flex flex-row items-center justify-center cursor-pointer"
              onClick={() => training.removeProgram(program.id)}
            >
              <div className="i-bx-x" />
            </div>
          </div>
        ) : program.status === "prompting" ? (
          <div
            key={program.id}
            className="bg-gray-800 p-2 items-center rounded-lg flex flex-row space-x-3"
          >
            <div className="flex-1 px-2">Generating training program...</div>
            <div className="i-svg-spinners-3-dots-fade px-4 text-xl" />
          </div>
        ) : program.status === "completed" ? null : (
          <div key={program.id} className={clsx(" space-y-2")}>
            <div className="bg-gray-900 rounded-lg">
              <div
                className={clsx(
                  "p-8 italic text-sm leading-7 tracking-wide bg-black rounded-lg"
                )}
              >
                {program.meditation}
              </div>
              <div className="px-2">
                {program.workout?.exercises.map((exercise, i) => (
                  <ListedExercise
                    program={program}
                    i={i}
                    exercise={exercise}
                    key={i}
                  />
                ))}
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-1">
                  <div className="text-xs opacity-60">Nutrition:</div>
                  <div className="text-sm">{program.nutrition}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs opacity-60">Learning:</div>
                  <div className="text-sm">{program.learning}</div>
                </div>
              </div>
            </div>
            {program.status == "active" && (
              <div className="flex flex-row items-center justify-end space-x-2">
                <div
                  className="h-8 rounded-md flex flex-row items-center px-4 bg-green-950 hover:bg-green-900 cursor-pointer"
                  onClick={() => training.completeProgram(program.id)}
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
