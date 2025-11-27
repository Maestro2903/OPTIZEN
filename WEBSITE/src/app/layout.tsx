import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/Toaster'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
})

const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-playfair',
    display: 'swap',
    style: ['normal', 'italic'],
    weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
    title: 'Crains Vision',
    description: 'Professional eye care services',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
            <body className={inter.className}>
                {children}
                <Toaster />
            </body>
        </html>
    )
}
