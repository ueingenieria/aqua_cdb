/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#1e40af', // Blue 800 - Matching main app roughly
                secondary: '#0ea5e9', // Sky 500
            },
        },
    },
    plugins: [],
}
