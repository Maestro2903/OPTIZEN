import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Eye Care Hospital CRM",
  description: "Comprehensive Hospital Management System for Eye Care Clinics",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
}

