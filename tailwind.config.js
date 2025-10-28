/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,mdx}"],

  theme: {
    fontFamily: {
      // Sans is the default font-space that tailwind injects everywhere.
      // By overriding this, we are effectively forcing EVERYWHERE to use our
      // custom Space Mono font.
      // sans: 'Space Mono, monospace',
    },
    extend: {
      height: {
        screen: "100dvh",
      },
    },
  },
  plugins: [],
};
