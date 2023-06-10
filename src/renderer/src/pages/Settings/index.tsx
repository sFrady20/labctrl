import { useNavigate } from "react-router";

export default function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col space-y-4 w-full p-4">
      <div
        className="w-11 h-11 flex items-center justify-center rounded-lg cursor-pointer hover:bg-gray-900"
        onClick={() => navigate(-1)}
      >
        <div className="i-bx-arrow-back" />
      </div>
      <div
        className="h-11 flex items-center space-x-3 hover:bg-gray-900 rounded-lg px-4 cursor-pointer"
        onClick={async () =>
          console.log(await window.main.invoke("getAllLights"))
        }
      >
        <div className="font-medium">Output light details</div>
      </div>
    </div>
  );
}
