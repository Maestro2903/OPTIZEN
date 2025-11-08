import { Eye } from "lucide-react"
import Link from "next/link"

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/portal" className="flex items-center gap-2">
              <Eye className="h-8 w-8 text-primary-600" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-primary-600">
                  EyeCare
                </span>
                <span className="text-xs text-gray-500">Patient Portal</span>
              </div>
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href="/portal"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Home
              </Link>
              <Link
                href="/portal/appointments"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Appointments
              </Link>
              <Link
                href="/portal/records"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Medical Records
              </Link>
              <Link
                href="/portal/billing"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Billing
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-6 py-6">
          <p className="text-center text-sm text-gray-500">
            © 2025 Eye Care Hospital. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

