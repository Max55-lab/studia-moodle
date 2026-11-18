/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./assets/js/**/*.js"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "-apple-system", '"Segoe UI"', "sans-serif"],
        display: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        studia: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065"
        }
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(17, 24, 39, 0.05)",
        card: "0 10px 30px -5px rgba(124, 58, 237, 0.07)",
        glow: "0 12px 32px -4px rgba(109, 40, 217, 0.35)"
      }
    }
  },
  plugins: []
};
