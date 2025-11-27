"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const isSubmittingRef = React.useRef(false)

  const handleLogin = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Prevent multiple submissions
    if (isSubmittingRef.current) {
      return
    }
    
    // Validate inputs
    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please enter both email and password",
        variant: "destructive",
      })
      return
    }

    isSubmittingRef.current = true
    setIsLoading(true)

    try {
      const supabase = createClient()
      
      // Trim email to remove any whitespace
      const trimmedEmail = email.trim().toLowerCase()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      })

      if (error) {
        console.error('Login error:', error)
        toast({
          title: "Login Failed",
          description: error.message || "Invalid email or password. Please check your credentials and try again.",
          variant: "destructive",
        })
        isSubmittingRef.current = false
        setIsLoading(false)
        return
      }

      if (data.session) {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        })
        // Small delay to ensure session is fully established
        await new Promise(resolve => setTimeout(resolve, 100))
        router.push("/patients")
        router.refresh()
        // Don't reset loading state here as we're navigating away
      } else {
        toast({
          title: "Login Failed",
          description: "No session was created. Please try again.",
          variant: "destructive",
        })
        isSubmittingRef.current = false
        setIsLoading(false)
      }
    } catch (error: any) {
      console.error('Unexpected login error:', error)
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      isSubmittingRef.current = false
      setIsLoading(false)
    }
  }, [email, password, router, toast])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <Image 
              src="/logo.svg" 
              alt="OptiZen Logo" 
              width={80} 
              height={80}
              priority
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">OptiZen</h1>
          <p className="text-sm text-muted-foreground mt-1">Hospital Management System</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@optizen.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
