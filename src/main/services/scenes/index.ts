import Store from "electron-store";
import { Scene, Schedule, DEFAULT_SCENES } from "./types";

export * from "./types";

interface SceneStoreSchema {
  scenes: Scene[];
  schedules: Schedule[];
}

const store = new Store<SceneStoreSchema>({
  name: "scenes",
  defaults: {
    scenes: DEFAULT_SCENES,
    schedules: [],
  },
});

// Scene management
export function getAllScenes(): Scene[] {
  return store.get("scenes");
}

export function getScene(id: string): Scene | undefined {
  return store.get("scenes").find((s) => s.id === id);
}

export function addScene(scene: Scene): void {
  const scenes = store.get("scenes");
  store.set("scenes", [...scenes, scene]);
}

export function updateScene(id: string, updates: Partial<Scene>): void {
  const scenes = store.get("scenes");
  store.set(
    "scenes",
    scenes.map((s) => (s.id === id ? { ...s, ...updates } : s))
  );
}

export function removeScene(id: string): void {
  const scenes = store.get("scenes");
  store.set(
    "scenes",
    scenes.filter((s) => s.id !== id)
  );
  // Also remove schedules for this scene
  const schedules = store.get("schedules");
  store.set(
    "schedules",
    schedules.filter((s) => s.sceneId !== id)
  );
}

// Schedule management
export function getAllSchedules(): Schedule[] {
  return store.get("schedules");
}

export function getSchedule(id: string): Schedule | undefined {
  return store.get("schedules").find((s) => s.id === id);
}

export function addSchedule(schedule: Schedule): void {
  const schedules = store.get("schedules");
  store.set("schedules", [...schedules, schedule]);
}

export function updateSchedule(id: string, updates: Partial<Schedule>): void {
  const schedules = store.get("schedules");
  store.set(
    "schedules",
    schedules.map((s) => (s.id === id ? { ...s, ...updates } : s))
  );
}

export function removeSchedule(id: string): void {
  const schedules = store.get("schedules");
  store.set(
    "schedules",
    schedules.filter((s) => s.id !== id)
  );
}

export function toggleSchedule(id: string): void {
  const schedules = store.get("schedules");
  store.set(
    "schedules",
    schedules.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
  );
}
