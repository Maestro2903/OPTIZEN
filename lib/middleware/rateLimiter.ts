/**
 * Rate Limiting Middleware for API Protection
 * Implements sliding window rate limiting with Redis-like functionality
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string // Custom error message
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
  keyGenerator?: (req: NextRequest) => string // Custom key generator
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
    requests: number[]
  }
}

class InMemoryRateLimitStore {
  private store: RateLimitStore = {}
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private cleanup() {
    const now = Date.now()
    Object.keys(this.store).forEach(key => {
      const entry = this.store[key]
      if (entry.resetTime < now) {
        delete this.store[key]
      }
    })
  }

  get(key: string): { count: number; resetTime: number } | null {
    const entry = this.store[key]
    if (!entry || entry.resetTime < Date.now()) {
      return null
    }
    return { count: entry.count, resetTime: entry.resetTime }
  }

  set(key: string, count: number, resetTime: number): void {
    this.store[key] = {
      count,
      resetTime,
      requests: []
    }
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now()
    const resetTime = now + windowMs

    if (!this.store[key] || this.store[key].resetTime < now) {
      this.store[key] = {
        count: 1,
        resetTime,
        requests: [now]
      }
    } else {
      this.store[key].count++
      this.store[key].requests.push(now)

      // Clean old requests outside the window
      const windowStart = now - windowMs
      this.store[key].requests = this.store[key].requests.filter(time => time > windowStart)
      this.store[key].count = this.store[key].requests.length
    }

    return {
      count: this.store[key].count,
      resetTime: this.store[key].resetTime
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval)
    this.store = {}
  }
}

// Global store instance
const rateLimitStore = new InMemoryRateLimitStore()

// Default configurations for different endpoint types
export const rateLimitConfigs = {
  // General API endpoints
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests, please try again later.'
  },

  // Authentication endpoints (stricter)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later.'
  },

  // Financial endpoints (very strict)
  financial: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20,
    message: 'Too many financial operation requests, please try again later.'
  },

  // Medical data endpoints (strict)
  medical: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 50,
    message: 'Too many medical data requests, please try again later.'
  },

  // Search and read operations (more lenient)
  read: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 200,
    message: 'Too many requests, please try again later.'
  },

  // Admin operations (moderate)
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 30,
    message: 'Too many admin requests, please try again later.'
  }
}

/**
 * Default key generator - uses IP address and user ID if available
 */
function defaultKeyGenerator(req: NextRequest): string {
  // Get IP address
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown'

  // Try to get user ID from authorization header or other means
  const auth = req.headers.get('authorization')
  let userId = 'anonymous'

  if (auth) {
    // This is a simplified approach - in practice, you'd decode the JWT
    // For now, we'll use a hash of the auth header
    userId = Buffer.from(auth).toString('base64').slice(0, 10)
  }

  return `${ip}:${userId}`
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimit(config: RateLimitConfig) {
  return function rateLimit(req: NextRequest): NextResponse | null {
    const keyGenerator = config.keyGenerator || defaultKeyGenerator
    const key = keyGenerator(req)

    const result = rateLimitStore.increment(key, config.windowMs)

    // Add rate limit headers
    const headers = new Headers()
    headers.set('X-RateLimit-Limit', config.maxRequests.toString())
    headers.set('X-RateLimit-Remaining', Math.max(0, config.maxRequests - result.count).toString())
    headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString())

    if (result.count > config.maxRequests) {
      headers.set('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString())

      return NextResponse.json(
        {
          success: false,
          error: config.message || 'Rate limit exceeded',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers
        }
      )
    }

    return null // Continue processing
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  default: createRateLimit(rateLimitConfigs.default),
  auth: createRateLimit(rateLimitConfigs.auth),
  financial: createRateLimit(rateLimitConfigs.financial),
  medical: createRateLimit(rateLimitConfigs.medical),
  read: createRateLimit(rateLimitConfigs.read),
  admin: createRateLimit(rateLimitConfigs.admin)
}

/**
 * Apply rate limiting to API route
 */
export async function applyRateLimit(
  req: NextRequest,
  limiterType: keyof typeof rateLimiters = 'default'
): Promise<NextResponse | null> {
  const limiter = rateLimiters[limiterType]
  return limiter(req)
}

/**
 * Rate limiting decorator for API route handlers
 */
export function withRateLimit(
  limiterType: keyof typeof rateLimiters = 'default'
) {
  return function decorator(handler: Function) {
    return async function rateLimitedHandler(req: NextRequest, ...args: any[]) {
      // Apply rate limiting
      const rateLimitResponse = await applyRateLimit(req, limiterType)
      if (rateLimitResponse) {
        return rateLimitResponse
      }

      // Continue with original handler
      return handler(req, ...args)
    }
  }
}

/**
 * Custom rate limiter for specific endpoints
 */
export function customRateLimit(config: RateLimitConfig) {
  const limiter = createRateLimit(config)

  return function (handler: Function) {
    return async function rateLimitedHandler(req: NextRequest, ...args: any[]) {
      const rateLimitResponse = limiter(req)
      if (rateLimitResponse) {
        return rateLimitResponse
      }

      return handler(req, ...args)
    }
  }
}

/**
 * Get current rate limit status for a key
 */
export function getRateLimitStatus(req: NextRequest, config: RateLimitConfig): {
  limit: number
  remaining: number
  reset: number
  blocked: boolean
} {
  const keyGenerator = config.keyGenerator || defaultKeyGenerator
  const key = keyGenerator(req)
  const entry = rateLimitStore.get(key)

  if (!entry) {
    return {
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: Date.now() + config.windowMs,
      blocked: false
    }
  }

  return {
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    reset: entry.resetTime,
    blocked: entry.count > config.maxRequests
  }
}

/**
 * Middleware for Next.js middleware file
 */
export function rateLimitMiddleware(req: NextRequest): NextResponse | undefined {
  const { pathname } = req.nextUrl

  // Apply different rate limits based on path
  if (pathname.startsWith('/api/auth')) {
    const response = rateLimiters.auth(req)
    if (response) return response
  } else if (pathname.includes('/revenue') || pathname.includes('/invoices')) {
    const response = rateLimiters.financial(req)
    if (response) return response
  } else if (pathname.includes('/patients') || pathname.includes('/cases') || pathname.includes('/operations')) {
    const response = rateLimiters.medical(req)
    if (response) return response
  } else if (pathname.startsWith('/api/')) {
    const response = rateLimiters.default(req)
    if (response) return response
  }

  // Continue if no rate limit hit
  return undefined
}

// Cleanup on process exit
process.on('exit', () => {
  rateLimitStore.destroy()
})

process.on('SIGINT', () => {
  rateLimitStore.destroy()
  process.exit(0)
})

process.on('SIGTERM', () => {
  rateLimitStore.destroy()
  process.exit(0)
})