/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}", // asegúrate de incluir todos los paths
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6ead8f',
        primaryDark: '#568f74',
        secondary: '#ffbd59',
        accent: '#568f74',
        // Sidebar colors
        sidebar: "hsl(var(--sidebar-background))",
        "sidebar-foreground": "hsl(var(--sidebar-foreground))",
        "sidebar-primary": "hsl(var(--sidebar-primary))",
        "sidebar-primary-foreground": "hsl(var(--sidebar-primary-foreground))",
        "sidebar-accent": "hsl(var(--sidebar-accent))",
        "sidebar-accent-foreground": "hsl(var(--sidebar-accent-foreground))",
        "sidebar-border": "hsl(var(--sidebar-border))",
        "sidebar-ring": "hsl(var(--sidebar-ring))",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
