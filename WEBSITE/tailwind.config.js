/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Inter"', 'sans-serif'],
                serif: ['"Playfair Display"', 'serif'],
            },
            colors: {
                primary: '#1A1C1E', // Dark Charcoal / Black for Action & Headings
                accent: '#3B82F6', // Sky Blue for small details/icons
                beige: '#EAF6FF', // Icy Blue for Backgrounds
                muted: '#64748B', // Slate 500
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'fade-in-up': 'fadeInUp 0.7s ease-out forwards',
                'spin-slow': 'spin 8s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        }
    },
    plugins: [],
}
