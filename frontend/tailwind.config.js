/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', "Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        // stardust palette, same warm minimal feel
        milk: "#FAF7F2",
        blush: "#F4CFCF",
        rosewood: "#E8A0B4",
        cocoa: "#4A3F3A",
        taupe: "#8A7E78",
        sage: "#C9CFC0",
      },
    },
  },
  plugins: [],
};
