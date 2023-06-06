import { useState } from "react";
import { Outlet } from "react-router-dom";
import { DateTime } from "luxon";
import useCronSchedule from "@renderer/util/useSchedule";

export default function DefaultLayout() {
  const [time, setTime] = useState(DateTime.now());

  useCronSchedule("* * * * * *", () => {
    setTime(DateTime.now());
  });

  return (
    <div className="flex-1 flex flex-col w-full">
      <div className="mx-2 h-11 flex items-center bg-black rounded-b-lg px-4">
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
    </div>
  );
}
