// import { createTheme } from "@mui/material/styles";

// const common = {
//   typography: {
//     fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont",
//     h1: { fontWeight: 700 },
//     h2: { fontWeight: 600 },
//     h3: { fontWeight: 600 },
//     h4: { fontWeight: 500 },
//     h5: { fontWeight: 500 },
//     h6: { fontWeight: 500 },
//     subtitle1: {
//       fontFamily: "'Lora', serif",
//     },
//     body2: {
//       color: "inherit",
//     },
//     code: {
//       fontFamily: "'Space Mono', monospace",
//     },
//   },
//   shape: {
//     borderRadius: 8,
//   },
// };

// export const lightTheme = createTheme({
//   ...common,
//   palette: {
//     mode: "light",
//     background: {
//       default: "hsl(209, 40%, 96%)",
//       paper: "hsl(210, 40%, 98%)",
//     },
//     text: {
//       primary: "hsl(222, 47%, 11%)",
//       secondary: "hsl(215, 19%, 34%)",
//     },
//     primary: {
//       main: "hsl(200, 98%, 39%)",
//       contrastText: "hsl(204, 100%, 97%)",
//     },
//     secondary: {
//       main: "hsl(215, 24%, 26%)",
//       contrastText: "hsl(210, 40%, 98%)",
//     },
//     error: {
//       main: "hsl(0, 72%, 50%)",
//     },
//     success: {
//       main: "hsl(142, 76%, 36%)",
//     },
//     warning: {
//       main: "hsl(38, 92%, 50%)",
//       contrastText: "hsl(222, 47%, 6%)",
//     },
//     divider: "hsl(212, 26%, 83%)",
//   },
//   shadows: [
//     "none",
//     "0 1px 3px hsl(0 0% 0% / 0.05)",
//     "0 1px 3px hsl(0 0% 0% / 0.1)",
//     "0 4px 24px hsl(222 47% 4% / 0.5)", // card shadow
//     ...Array(21).fill("0 1px 3px hsl(0 0% 0% / 0.1)"),
//   ],
// });

// export const darkTheme = createTheme({
//   ...common,
//   palette: {
//     mode: "dark",
//     background: {
//       default: "hsl(222, 47%, 11%)",
//       paper: "hsl(217, 32%, 17%)",
//     },
//     text: {
//       primary: "hsl(210, 40%, 98%)",
//       secondary: "hsl(215, 20%, 65%)",
//     },
//     primary: {
//       main: "hsl(198, 93%, 59%)",
//       contrastText: "hsl(204, 80%, 15%)",
//     },
//     secondary: {
//       main: "hsl(212, 26%, 83%)",
//       contrastText: "hsl(228, 84%, 4%)",
//     },
//     error: {
//       main: "hsl(0, 84%, 60%)",
//     },
//     divider: "hsl(215, 19%, 34%)",
//   },
// });


import { createTheme } from "@mui/material/styles";

const common = {
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont",
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 500 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
    subtitle1: {
      fontFamily: "'Lora', serif",
    },
    body2: {
      color: "inherit",
    },
    code: {
      fontFamily: "'Space Mono', monospace",
    },
  },
  shape: {
    borderRadius: 8,
  },
};

export const lightTheme = createTheme({
  ...common,
  palette: {
    mode: "light",
    background: {
      default: "#ffffff", // changed to white
      paper: "hsla(0, 0%, 100%, 1.00)",
    },
    text: {
      primary: "hsl(222, 47%, 11%)",
      secondary: "hsl(215, 19%, 34%)",
    },
    primary: {
      main: "hsl(200, 98%, 39%)",
      contrastText: "hsl(204, 100%, 97%)",
    },
    secondary: {
      main: "hsl(215, 24%, 26%)",
      contrastText: "hsl(210, 40%, 98%)",
    },
    error: {
      main: "hsl(0, 72%, 50%)",
    },
    success: {
      main: "hsl(142, 76%, 36%)",
    },
    warning: {
      main: "hsl(38, 92%, 50%)",
      contrastText: "hsl(222, 47%, 6%)",
    },
    divider: "hsl(212, 26%, 83%)",
  },
  shadows: [
    "none",
    "0 1px 3px hsl(0 0% 0% / 0.05)",
    "0 1px 3px hsl(0 0% 0% / 0.1)",
    "0 4px 24px hsl(222 47% 4% / 0.5)", // card shadow
    ...Array(21).fill("0 1px 3px hsl(0 0% 0% / 0.1)"),
  ],
});

export const darkTheme = createTheme({
  ...common,
  palette: {
    mode: "dark",
    background: {
      default: "hsl(222, 47%, 11%)",
      paper: "hsl(217, 32%, 17%)",
    },
    text: {
      primary: "hsl(210, 40%, 98%)",
      secondary: "hsl(215, 20%, 65%)",
    },
    primary: {
      main: "hsla(220, 95%, 57%, 1.00)",
      contrastText: "hsl(204, 80%, 15%)",
    },
    secondary: {
      main: "hsl(212, 26%, 83%)",
      contrastText: "hsl(228, 84%, 4%)",
    },
    error: {
      main: "hsl(0, 84%, 60%)",
    },
    divider: "hsl(215, 19%, 34%)",
  },
});
