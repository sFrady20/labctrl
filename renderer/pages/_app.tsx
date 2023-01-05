import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import { theme } from "../theme";
import type { AppProps } from "next/app";
import "../styles.css";
import "windi.css";
import NavBar from "components/NavBar";
import Background from "components/Background";

export default function (props: AppProps) {
  const { Component, pageProps } = props;
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Background />
      <NavBar {...pageProps} />
      <Box
        flex={1}
        display={"flex"}
        flexDirection={"column"}
        justifyContent={"flex-start"}
      >
        <Component {...pageProps} />
      </Box>
    </ThemeProvider>
  );
}
