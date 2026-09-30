export const palette = {
  blue: {
    50: "#effaff",
    100: "#d9f1ff",
    300: "#9ed2ff",
    500: "#0087f3",
    600: "#006dd8",
    700: "#005bbf",
    900: "#001c52",
    950: "#000d3a",
  },
  red: {
    50: "#fff3f4",
    100: "#ffe3e3",
    300: "#ff979d",
    500: "#f1002f",
    600: "#cf0038",
    900: "#75001c",
  },
  yellow: {
    50: "#fff7ea",
    200: "#ffcf77",
    400: "#ffbe00",
    500: "#f3b01d",
    900: "#533300",
  },
  green: {
    50: "#f1fcf0",
    100: "#d6fad6",
    300: "#75d87a",
    600: "#007900",
    900: "#004b00",
  },
  neutral: {
    0: "#ffffff",
    50: "#fbfcfc",
    100: "#f4f5f6",
    200: "#eaebed",
    300: "#d9dbdd",
    400: "#88898b",
    500: "#737476",
    600: "#5a5b5c",
    700: "#444547",
    800: "#323334",
    900: "#212223",
    950: "#131415",
  },
} as const;

export const brand = {
  blue: palette.blue[600],
  red: palette.red[500],
  yellow: palette.yellow[400],
  navy: palette.blue[900],
  ink: palette.neutral[900],
} as const;

export const fonts = {
  heading: '"Hanken Grotesk Variable", "Inter Variable", system-ui, sans-serif',
  body: '"Inter Variable", system-ui, -apple-system, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono Variable", ui-monospace, Consolas, monospace',
} as const;

export const slantDegrees = -16;
