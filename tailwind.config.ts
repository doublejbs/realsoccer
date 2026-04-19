import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0B",
        surface: "#121214",
        elevated: "#1A1A1D",
        border: "#26262A",
        hairline: "#1F1F23",
        ink: {
          DEFAULT: "#FAFAFA",
          dim: "#A1A1AA",
          mute: "#71717A",
          faint: "#52525B",
        },
        accent: {
          DEFAULT: "#D4FF4A",
          hover: "#C2EE2C",
          ink: "#0A0A0B",
        },
        signal: {
          live: "#EF4444",
          soon: "#F59E0B",
        },
      },
      fontFamily: {
        display: ['"Fraunces"', "ui-serif", "Georgia", "serif"],
        sans: ['"Instrument Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      fontSize: {
        "display-xl": ["clamp(4rem, 15vw, 9rem)", { lineHeight: "0.9", letterSpacing: "-0.04em" }],
        "display-lg": ["clamp(3rem, 10vw, 6rem)", { lineHeight: "0.9", letterSpacing: "-0.03em" }],
        "display-md": ["clamp(2rem, 7vw, 3.5rem)", { lineHeight: "0.95", letterSpacing: "-0.02em" }],
      },
    },
  },
  plugins: [],
};

export default config;
