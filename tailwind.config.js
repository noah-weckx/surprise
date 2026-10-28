/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/js/**/*.js"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Georgia", "serif"],
        sans: ["Segoe UI", "sans-serif"]
      },
      colors: {
        ink: "#29261f",
        paper: "#f7f4ed",
        moss: "#496653",
        rust: "#a9573e",
        gold: "#d0a45c"
      }
    }
  },
  plugins: []
};
