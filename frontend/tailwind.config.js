/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        patriot: {
          "primary": "#900305",
          "primary-content": "#ffffff",
          "secondary": "#c29b7c",
          "secondary-content": "#181617",
          "accent": "#292524",
          "accent-content": "#ffffff",
          "neutral": "#292524",
          "neutral-content": "#ffffff",
          "base-100": "#FAF6F0",
          "base-200": "#EDE1D8",
          "base-300": "#E0D0C3",
          "base-content": "#181617",
        },
      },
      "light",
      "dark",
      "emerald",
      "synthwave"
    ],
    defaultTheme: "patriot"
  }
}
