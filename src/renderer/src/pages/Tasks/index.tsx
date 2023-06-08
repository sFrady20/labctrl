import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ReactSortable } from "react-sortablejs";
import clsx from "clsx";
import styles from "./tasks.module.css";

type Task = {
  id: string;
  message: string;
  status?: "complete" | "discarded";
};

const useTasks = create(
  persist<{
    input: string;
    setInput: (value: string) => void;
    lists: { [key: string]: Task[] | undefined };
    addTask: (message: string, list?: string) => Task;
    moveTask: (id: string, fromList: string, toList: string) => void;
    setTasks: (list: string, tasks: Task[]) => void;
  }>(
    (set, get) => ({
      input: "",
      setInput: (value) => set({ input: value }),
      lists: {},
      addTask: (message: string, list = "default") => {
        const task: Task = {
          id: Math.random().toString(32).substring(7),
          message,
        };
        set((x) => ({
          ...x,
          lists: {
            ...(x.lists || {}),
            [list]: [...(x.lists[list] || []), task],
          },
        }));
        return task;
      },
      moveTask: (taskId, fromList, toList) => {
        if (fromList === toList) return;
        const task = (get().lists[fromList] || []).find((x) => x.id === taskId);
        if (!task) return;
        set((x) => ({
          ...x,
          lists: {
            ...x.lists,
            [toList]: [...(x.lists[toList] || []), task],
            [fromList]: [
              ...(x.lists[fromList] || []).filter((x) => x.id !== taskId),
            ],
          },
        }));
      },
      setTasks: (list, tasks: Task[]) => {
        set((x) => ({ ...x, lists: { ...(x.lists || {}), [list]: tasks } }));
      },
    }),
    { name: "tasks" }
  )
);

function ListedTask(props: { task: Task; list: string }) {
  const tasks = useTasks();
  const { task, list } = props;

  return (
    <div className="task p-1 bg-gray-900 flex flex-row items-start space-x-3 cursor-pointer rounded-lg">
      <div
        className="p-2 rounded-lg hover:bg-gray-800"
        onClick={() => {
          task.status === "complete"
            ? tasks.moveTask(task.id, "completed", "default")
            : tasks.moveTask(task.id, "default", "completed");
        }}
      >
        <div
          className={clsx("p-1", {
            "i-bx-checkbox": task.status === undefined,
            "i-bx-bxs-checkbox-checked text-green-500":
              task.status === "complete",
            "i-bx-x text-gray-600": task.status === "discarded",
          })}
        />
      </div>
      <div
        className={clsx("text-sm py-[6px]", {
          "opacity-20":
            task.status === "complete" || task.status === "discarded",
        })}
      >
        {task.message}
      </div>
    </div>
  );
}

export function TasksPage() {
  const tasks = useTasks();

  return (
    <div className="space-y-4 p-4 flex flex-col flex-1">
      <div
        className={clsx(
          "flex flex-row self-end rounded-lg space-x-1 b-1 b-solid b-gray-800 divide-x-1 divide-solid divide-gray-800",
          styles.bins
        )}
      >
        <ReactSortable
          list={tasks.lists["default"] || []}
          setList={(list) => tasks.setTasks("default", list)}
          className="px-4 h-8 flex flex-row items-center text-xs font-semibold cursor-pointer"
          group={"tasks"}
          draggable={".task"}
        >
          <div>Active</div>
        </ReactSortable>
        <ReactSortable
          list={tasks.lists["completed"] || []}
          setList={(list) => tasks.setTasks("completed", list)}
          className="px-4 h-8 flex flex-row items-center text-xs font-semibold cursor-pointer"
          group={"tasks"}
          draggable={".task"}
        >
          <div>Completed</div>
        </ReactSortable>
        <ReactSortable
          list={tasks.lists["discarded"] || []}
          setList={(list) => tasks.setTasks("discarded", list)}
          className="px-4 h-8 flex flex-row items-center text-xs font-semibold cursor-pointer"
          group={"tasks"}
          draggable={".task"}
        >
          <div>Discarded</div>
        </ReactSortable>
      </div>
      <ReactSortable
        className="flex flex-col rounded-lg overflow-hidden space-y-1"
        list={tasks.lists["default"] || []}
        setList={(list) => tasks.setTasks("default", list)}
        group={"tasks"}
        draggable={".task"}
      >
        {(tasks.lists["default"] || []).map((task) => (
          <ListedTask key={task.id} task={task} list="default" />
        ))}
      </ReactSortable>
      <textarea
        className="bg-gray-950 min-h-30 flex-1 resize-none px-4 text-sm"
        value={tasks.input}
        onChange={(e) => {
          tasks.setInput(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          tasks.addTask(tasks.input);
          tasks.setInput("");
        }}
      />
    </div>
  );
}
