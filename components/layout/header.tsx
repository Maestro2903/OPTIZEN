"use client"

import { Bell, Search, Plus, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-18 items-center justify-between bg-white/80 backdrop-blur-xl px-8 border-b border-neutral-200">
      {/* Page Title & Search */}
      <div className="flex items-center gap-6 flex-1">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Welcome back, here&apos;s your overview</p>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            placeholder="Search patients, appointments..."
            className="w-full h-10 pl-10 pr-4 text-sm bg-neutral-100 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 transition-smooth outline-none"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded bg-neutral-200 px-1.5 font-mono text-[10px] font-medium text-neutral-600">
            ⌘K
          </kbd>
        </div>

        {/* Quick Action Button */}
        <Button 
          size="sm"
          className="h-10 rounded-xl bg-primary hover:bg-primary-600 text-white shadow-sm transition-smooth"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Appointment
        </Button>

        {/* Notification Bell */}
        <button className="relative h-10 w-10 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-smooth flex items-center justify-center">
          <Bell className="h-5 w-5 text-neutral-700" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-medical-red shadow-sm" />
        </button>

        {/* User Avatar */}
        <button className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-medical-purple flex items-center justify-center text-white font-semibold text-sm shadow-md hover:shadow-lg transition-smooth">
          <User className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}

