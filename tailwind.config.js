/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/js/**/*.js"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Plus Jakarta Sans", "Segoe UI", "sans-serif"]
      },
      colors: {
        "emerald-deep": "#064e3b",
        emerald: {
          500: "#10b981",
          700: "#047857",
          900: "#064e3b"
        },
        parchment: "#fdfbf7",
        terracotta: "#c2410c",
        "sage-light": "#a3e635",
        bark: "#1c1917",
        ink: "#1c1917",
        paper: "#fdfbf7",
        moss: "#047857",
        rust: "#c2410c",
        gold: "#b7791f"
      }
    }
  },
  plugins: []
};
