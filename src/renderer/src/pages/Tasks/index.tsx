import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ReactSortable } from "react-sortablejs";
import clsx from "clsx";
import styles from "./tasks.module.css";
import { produce } from "immer";

const colors = [
  "gray",
  "red",
  "orange",
  "yellow",
  "lime",
  "green",
  "teal",
  "blue",
  "purple",
] as const;

//just so uno compiles them
const _classes =
  "bg-gray-900 hover:bg-gray-800 bg-red-900 hover:bg-red-800 bg-orange-900 hover:bg-orange-800 bg-yellow-900 hover:bg-yellow-800 bg-lime-900 hover:bg-lime-800 bg-green-900 hover:bg-green-800 bg-teal-900 hover:bg-teal-800 bg-blue-900 hover:bg-blue-800 bg-purple-900 hover:bg-purple-800";

type Task = {
  id: string;
  message: string;
  color?: (typeof colors)[number];
};

const useTasks = create(
  persist<{
    input: string;
    setInput: (value: string) => void;
    tab: string;
    setTab: (value: string) => void;
    lists: { [key: string]: Task[] | undefined };
    addTask: (message: string, list?: string) => Task;
    moveTask: (id: string, fromList: string, toList: string) => void;
    editTask: (id: string, list: string, editor: (task: Task) => void) => void;
    setTasks: (list: string, tasks: Task[]) => void;
  }>(
    (set, get) => ({
      input: "",
      setInput: (value) => set({ input: value }),
      tab: "default",
      setTab: (value) => set({ tab: value }),
      lists: {},
      addTask: (message: string, list = "default") => {
        const task: Task = {
          id: Math.random().toString(32).substring(7),
          message,
          color: "gray",
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
      editTask: (taskId, list, editor) => {
        set((x) =>
          produce(x, (x) => {
            let task = (x.lists[list] || []).find((x) => x.id === taskId);
            if (!task) return x;
            editor(task);
            return x;
          })
        );
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
    <div
      className={`task p-1 bg-${
        task.color || "gray"
      }-900 flex flex-row items-start space-x-3 cursor-move rounded-lg group`}
    >
      <div
        className={`p-2 rounded-lg hover:bg-${
          task.color || "gray"
        }-800 cursor-pointer`}
        onClick={() => {
          list === "completed"
            ? tasks.moveTask(task.id, "completed", "default")
            : tasks.moveTask(task.id, "default", "completed");
        }}
      >
        <div
          className={clsx("p-1", {
            "i-bx-checkbox": list === "default",
            "i-bx-bxs-checkbox-checked text-green-500": list === "completed",
            "i-bx-x text-gray-600": list === "discarded",
          })}
        />
      </div>
      <div
        className={clsx("text-sm py-[6px] flex-1", {
          "opacity-20": list === "completed" || list === "discarded",
        })}
      >
        {task.message}
      </div>
      <div
        className={`p-2 rounded-lg hover:bg-${
          task.color || "gray"
        }-800 cursor-pointer hidden group-hover:flex`}
        onClick={() => {
          tasks.editTask(
            task.id,
            list,
            (x) =>
              (x.color =
                colors[
                  (colors.indexOf(task.color || "gray") + 1) % colors.length
                ])
          );
        }}
      >
        <div className={clsx("p-1 i-bx-palette")} />
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
          "flex flex-row self-end rounded-lg b-1 b-solid b-gray-800 divide-x-1 divide-solid divide-gray-800 overflow-hidden",
          styles.bins
        )}
      >
        {[
          { label: "Active", tab: "default" },
          { label: "Completed", tab: "completed" },
          { label: "Discarded", tab: "discarded" },
        ].map(({ label, tab }, i) => (
          <ReactSortable
            key={i}
            list={tasks.lists[tab] || []}
            setList={(list) => tasks.setTasks(tab, list)}
            group={"tasks"}
            draggable={".task"}
          >
            <div
              className={clsx(
                "px-4 h-8 flex flex-row items-center text-xs font-semibold cursor-pointer",
                { "bg-gray-900": tasks.tab === tab }
              )}
              onClick={() => tasks.setTab(tab)}
            >
              {label}
            </div>
          </ReactSortable>
        ))}
      </div>
      <ReactSortable
        className="flex flex-col rounded-lg overflow-hidden space-y-1"
        list={tasks.lists[tasks.tab] || []}
        setList={(list) => tasks.setTasks(tasks.tab, list)}
        group={"tasks"}
        draggable={".task"}
      >
        {(tasks.lists[tasks.tab] || []).map((task) => (
          <ListedTask key={task.id} task={task} list={tasks.tab} />
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
