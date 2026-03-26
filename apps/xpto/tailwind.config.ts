import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#f7f5f1",
        "surface-2": "#f1ede5",
        "surface-3": "#ebe5da",
        text: "#5c6257",
        "text-soft": "#8a8f83",
        "text-strong": "#171c17",
        accent: "#6b8364",
        accentStrong: "#56704f",
      },
      fontFamily: {
        sans: ["var(--font-primary)", "ui-sans-serif", "sans-serif"],
        display: ["var(--font-primary)", "ui-sans-serif", "sans-serif"],
      },
      boxShadow: {
        shell: "0 18px 48px rgba(87, 79, 62, 0.12)",
        button: "0 16px 34px rgba(101, 126, 94, 0.22)",
        chip: "0 12px 32px rgba(96, 89, 72, 0.12)",
        card: "0 18px 48px rgba(92, 84, 67, 0.12)",
        frame: "0 34px 90px rgba(109, 97, 74, 0.16)",
        board: "0 18px 44px rgba(98, 88, 70, 0.14)",
        footer: "0 26px 72px rgba(97, 86, 67, 0.14)",
      },
      backgroundImage: {
        "page-noise":
          "radial-gradient(circle at top left, rgba(161, 186, 151, 0.28), transparent 28%), radial-gradient(circle at 85% 10%, rgba(204, 193, 170, 0.3), transparent 24%), radial-gradient(circle at 50% 35%, rgba(217, 226, 208, 0.75), transparent 34%)",
        "hero-highlight":
          "linear-gradient(135deg, rgba(199, 214, 188, 0.95), rgba(227, 216, 188, 0.92))",
        "button-accent":
          "linear-gradient(135deg, #52664e 0%, #7f9877 100%)",
        "mark-accent":
          "radial-gradient(circle at 30% 30%, #f4f8f1 0 16%, transparent 17%), linear-gradient(135deg, #5a7057 0%, #8ea786 100%)",
        "frame-base":
          "linear-gradient(180deg, rgba(252, 249, 243, 0.98), rgba(245, 239, 230, 0.98))",
        "canvas-base":
          "radial-gradient(circle at top left, rgba(174, 198, 164, 0.22), transparent 30%), linear-gradient(180deg, #fbf8f2 0%, #f2ece2 100%)",
        "journal-grid":
          "linear-gradient(rgba(120, 138, 112, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(120, 138, 112, 0.12) 1px, transparent 1px)",
        "journal-photo":
          "linear-gradient(180deg, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0)), linear-gradient(145deg, #b6c7ad 0%, #dde7d4 100%)",
        "footer-base":
          "radial-gradient(circle at top right, rgba(170, 193, 161, 0.3), transparent 24%), radial-gradient(circle at top left, rgba(221, 212, 193, 0.35), transparent 28%)",
      },
    },
  },
  plugins: [],
};

export default config;
