import { RouterProvider, createHashRouter } from "react-router-dom";
import DefaultLayout from "./layouts/Default";
import LightingPage from "./pages/Lighting";
import SettingsPage from "./pages/Settings";
import { TasksPage } from "./pages/Tasks";

const router = createHashRouter([
  {
    path: "/",
    Component: DefaultLayout,
    children: [
      { path: "/", Component: LightingPage },
      { path: "/tasks", Component: TasksPage },
      { path: "/settings", Component: SettingsPage },
    ],
  },
]);

function App(): JSX.Element {
  return <RouterProvider router={router} />;
}

export default App;
