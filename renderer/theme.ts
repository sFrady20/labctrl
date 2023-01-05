import { createTheme } from "@mui/material";

export const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#",
    },
    primary: {
      main: "#ffffff",
    },
    secondary: {
      main: "#aaaaaa",
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    allVariants: {
      fontFamily: `"Poppins", "sans-serif"`,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: "bold",
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        body: {
          background: "transparent",
          opacity: 0.99,

          [`& > #__next`]: {
            overflow: "hidden",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          },
        },
      }),
    },
  },
});
