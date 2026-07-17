/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          50: "#f6f6f9",
          100: "#ececf3",
          200: "#d5d5e3",
          300: "#b0b0cb",
          400: "#8383aa",
          500: "#60608c",
          600: "#4b4b72",
          700: "#3d3d5c",
          800: "#34344e",
          900: "#1a1a29",
          950: "#0f0f18"
        },
        brand: {
          50: "#f3f6fc",
          100: "#e4ecf7",
          200: "#cddcf0",
          300: "#a7c1e5",
          400: "#7a9ed8",
          500: "#5c7ecb",
          600: "#4865bd",
          700: "#3c52aa",
          800: "#35458c",
          900: "#2f3c74",
          950: "#1b2144"
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"]
      }
    },
  },
  plugins: [],
}
