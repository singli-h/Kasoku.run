/** @type {import('tailwindcss').Config} */
module.exports = {
  purge: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      backgroundColor: {
        "indigo-600": "#4F46E5",
        "indigo-800": "#3730A3",
        "light-beige": "#F9FAFB",
      },
      textColor: {
        "indigo-600": "#4F46E5",
        "indigo-500": "#4338CA",
        "dark-slate-gray": "#2F3E46",
      },
      backgroundImage: (theme) => ({
        "gradient-radial":
          "radial-gradient(ellipse at center, var(--tw-gradient-stops))",
      }),
      gradientColorStops: (theme) => ({
        start: "#E5E7EB",
        end: "#F3F4F6",
      }),
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
