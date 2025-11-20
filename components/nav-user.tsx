"use client"

import { LogOut } from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUser } from "@/contexts/user-context"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function NavUser() {
  const { user, loading } = useUser()
  const router = useRouter()
  const { state } = useSidebar()

  const handleLogout = () => {
    router.push('/auth/logout')
  }

  // Get user initials for avatar fallback
  const fullName = (user?.full_name || '').trim()
  const initials = fullName
    ? fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??'

  // Format role for display
  const formatRole = (role: string | undefined) => {
    if (!role) return 'User'
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (loading) {
    return (
      <div className="border-t border-gray-200 p-4 bg-white">
        {state === "collapsed" ? (
          <div className="flex items-center justify-center">
            <Skeleton className="w-9 h-9 rounded-full" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-full" />
            <div className="flex flex-col gap-1 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!user) {
    return null
  }

  // When sidebar is collapsed, show only centered avatar with dropdown
  if (state === "collapsed") {
    return (
      <div className="border-t border-gray-200 p-4 bg-white w-full flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full transition-all">
                <Avatar className="w-9 h-9 rounded-full bg-gray-200 shrink-0 cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all">
                  <AvatarImage src={user.avatar_url} alt={user.full_name} />
                  <AvatarFallback className="rounded-full bg-gray-200 text-gray-600 text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              side="right"
              className="w-48 ml-2"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {formatRole(user.role)}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-600 focus:text-red-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      </div>
    )
  }

  // When sidebar is expanded, show full user info
  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <Avatar className="w-9 h-9 rounded-full bg-gray-200 shrink-0">
          <AvatarImage src={user.avatar_url} alt={user.full_name} />
          <AvatarFallback className="rounded-full bg-gray-200 text-gray-600 text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* User Info */}
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-900 truncate">
            {user.full_name}
          </span>
          <span className="text-xs text-gray-500 truncate w-24">
            {formatRole(user.role)}
          </span>
        </div>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 shrink-0 text-gray-400 hover:text-red-600 transition-colors"
          )}
          title="Log out"
        >
          <LogOut className="w-5 h-5" />
          <span className="sr-only">Log out</span>
        </Button>
      </div>
    </div>
  )
}

