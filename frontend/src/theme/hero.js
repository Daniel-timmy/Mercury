import { heroui } from "@heroui/react";

const theme = {
  defaultTheme: "light",
  defaultExtendTheme: "light",
  layout: {
    fontSize: {
      tiny: "0.75rem",
      small: "0.875rem",
      medium: "1rem",
      large: "1.125rem",
    },
    lineHeight: {
      tiny: "1rem",
      small: "1.25rem",
      medium: "1.5rem",
      large: "1.75rem",
    },
    radius: {
      small: "8px",
      medium: "12px",
      large: "16px",
    },
    borderWidth: {
      small: "1px",
      medium: "2px",
      large: "3px",
    },
  },
  themes: {
    light: {
      layout: {},
      colors: {
        background: "#FFFFFF",
        foreground: "#11181C",
        divider: "#E4E4E7",
        focus: "#3B82F6",
        content1: "#FFFFFF",
        content2: "#F4F4F5",
        content3: "#E4E4E7",
        content4: "#D4D4D8",
        default: {
          DEFAULT: "#F4F4F5",
          foreground: "#11181C",
        },
        primary: {
          DEFAULT: "#3B82F6",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#7C3AED",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#10B981",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#F59E0B",
          foreground: "#FFFFFF",
        },
        danger: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
      },
    },
  },
};

export default heroui(theme);