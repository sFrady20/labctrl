import {
  Box,
  Button,
  Checkbox,
  IconButton,
  ListItem,
  ListItemAvatar,
  TextField,
} from "@mui/material";
import { proxy, subscribe, useSnapshot } from "valtio";
import DeleteIcon from "@mui/icons-material/Delete";
import { memo } from "react";

type Task = { message: string; completed?: boolean };

const getTasks = (): Task[] => {
  try {
    return (
      (typeof localStorage !== "undefined" &&
        JSON.parse(localStorage.getItem("tasks"))) ||
      []
    );
  } catch {
    return [];
  }
};

const tasks = proxy<Task[]>(getTasks());
subscribe(tasks, () => {
  localStorage.setItem("tasks", JSON.stringify(tasks));
});

const Task = memo((props: { i: number }) => {
  const { i } = props;
  const snap = useSnapshot(tasks, { sync: true });
  const task = snap[i];

  if (!task) return null;

  return (
    <ListItem>
      <ListItemAvatar>
        <Checkbox
          checked={task.completed}
          size={"small"}
          onChange={(e, checked) => {
            tasks[i].completed = checked;
          }}
        />
        {task.completed && (
          <IconButton onClick={() => delete tasks[i]}>
            <DeleteIcon color={"error"} />
          </IconButton>
        )}
      </ListItemAvatar>
      <TextField
        size={"small"}
        variant="standard"
        fullWidth
        value={task.message}
        onChange={(e) => {
          tasks[i].message = e.target.value;
        }}
      />
    </ListItem>
  );
});

const tasksPage = () => {
  const snap = useSnapshot(tasks);

  return (
    <>
      {snap.map((x, i) => (
        <Task i={i} key={i} />
      ))}
      <Box
        sx={{
          position: "absolute",
          left: 0,
          bottom: 0,
          right: 0,
          paddingX: 4,
          paddingY: 2,
        }}
      >
        <Button
          variant={"contained"}
          fullWidth
          onClick={() => {
            tasks.push({ message: "" });
          }}
        >
          Add Task
        </Button>
      </Box>
    </>
  );
};

export default tasksPage;
