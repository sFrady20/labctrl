import { RouterProvider, createHashRouter, redirect } from "react-router-dom";
import DefaultLayout from "./layouts/Default";
import LightingPage from "./pages/Lighting";
import SettingsPage from "./pages/Settings";
import TrainingPage from "./pages/Training";
import { TasksPage } from "./pages/Tasks";

const router = createHashRouter([
  {
    path: "/",
    Component: DefaultLayout,
    children: [
      {
        path: "/",
        Component: () => {
          redirect("/tasks");
          return null;
        },
      },
      { path: "/tasks", Component: TasksPage },
      { path: "/lighting", Component: LightingPage },
      { path: "/training", Component: TrainingPage },
      { path: "/settings", Component: SettingsPage },
    ],
  },
]);

function App(): JSX.Element {
  return <RouterProvider router={router} />;
}

export default App;
