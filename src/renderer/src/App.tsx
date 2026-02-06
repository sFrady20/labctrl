import { RouterProvider, createHashRouter, Navigate } from "react-router-dom";
import DefaultLayout from "./layouts/Default";
import DashboardPage from "./pages/Dashboard";
import LightsPage from "./pages/Lights";
import PalettesPage from "./pages/Palettes";
import SettingsPage from "./pages/Settings";

const router = createHashRouter([
  {
    path: "/",
    Component: DefaultLayout,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", Component: DashboardPage },
      { path: "lights", Component: LightsPage },
      { path: "palettes", Component: PalettesPage },
      { path: "settings", Component: SettingsPage },
    ],
  },
]);

function App(): JSX.Element {
  return <RouterProvider router={router} />;
}

export default App;
