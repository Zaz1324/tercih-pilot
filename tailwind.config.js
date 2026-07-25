/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#080c18",
          900: "#0d1324",
          850: "#11192d",
          800: "#172036",
          700: "#24304b",
        },
        pilot: {
          300: "#88b8ff",
          400: "#5d9cff",
          500: "#3b82f6",
          600: "#2868db",
        },
      },
      boxShadow: {
        glow: "0 18px 55px rgba(36, 104, 219, 0.18)",
        panel: "0 18px 45px rgba(0, 0, 0, 0.24)",
      },
      fontFamily: {
        sans: ["Manrope Variable", "sans-serif"],
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 280ms ease-out both",
      },
    },
  },
  plugins: [],
};
