/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SwimLanes item type colors (from CLAUDE.md)
        'task': '#3b82f6',      // blue
        'milestone': '#22c55e',  // green
        'release': '#f97316',    // orange
        'meeting': '#a855f7',    // purple
      },
    },
  },
  plugins: [],
}
