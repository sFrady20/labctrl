import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { DateTime } from "luxon";
import useCronSchedule from "@renderer/util/useSchedule";
import clsx from "clsx";
import { TrainingWidget } from "@renderer/pages/Training";

export default function DefaultLayout() {
  const [time, setTime] = useState(DateTime.now());
  const navigate = useNavigate();
  const location = useLocation();

  useCronSchedule("* * * * * *", () => {
    setTime(DateTime.now());
  });

  return (
    <div className="flex-1 flex flex-col w-full">
      <div className="mx-2 h-11 flex items-center bg-black rounded-b-lg px-2 space-x-3">
        <div className="flex flex-row rounded-lg overflow-hidden">
          {[
            { icon: "i-bx-bulb", path: "/lighting" },
            { icon: "i-bx-task", path: "/tasks" },
            { icon: "i-bx-dumbbell", path: "/training" },
          ].map(({ icon, path }, i) => (
            <div
              key={i}
              className={clsx(
                "w-8 h-8 hover:bg-gray-900 cursor-pointer flex items-center justify-center",
                {
                  "bg-gray-800 hover:bg-gray-800": location.pathname === path,
                }
              )}
              onClick={() => {
                navigate(path);
              }}
            >
              <div className={clsx("text-[18px]", icon)} />
            </div>
          ))}
        </div>
        <div className="flex-1 text-sm font-semibold">
          {time.toFormat("cccc, LLLL d • hh:mm a")}
        </div>
        <div
          className="w-8 h-8 hover:bg-gray-900 rounded-lg cursor-pointer flex items-center justify-center"
          onClick={() =>
            window.main.invoke("openExternal", "https://github.com/sFrady20")
          }
        >
          <div className="i-bx-bxl-github text-[18px]" />
        </div>
      </div>
      <Outlet />
      <TrainingWidget />
    </div>
  );
}
