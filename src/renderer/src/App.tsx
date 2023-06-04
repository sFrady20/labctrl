import { RouterProvider, createHashRouter } from "react-router-dom";
import DefaultLayout from "./layouts/Default";
import HomePage from "./pages/Home";
import SettingsPage from "./pages/Settings";

const router = createHashRouter([
  {
    path: "/",
    Component: DefaultLayout,
    children: [
      { path: "/", Component: HomePage },
      { path: "/settings", Component: SettingsPage },
    ],
  },
]);

function App(): JSX.Element {
  return <RouterProvider router={router} />;
}

export default App;
