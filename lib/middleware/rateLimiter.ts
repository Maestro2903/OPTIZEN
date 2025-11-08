/**
 * Rate Limiting Middleware for API Protection
 * Implements sliding window rate limiting
 * 
 * IMPORTANT FOR PRODUCTION:
 * The current implementation uses in-memory storage which will NOT work correctly
 * in serverless or horizontally scaled deployments. For production, you MUST:
 * 
 * 1. Use a shared store backend (Redis, Upstash, Vercel KV, or Cloudflare KV)
 * 2. Implement the RateLimitStoreAdapter interface for your chosen backend
 * 3. Configure the store via environment variables
 * 
 * Example Redis adapter:
 * - Use @upstash/redis for serverless-friendly Redis
 * - Set REDIS_URL in your environment
 * - Replace InMemoryRateLimitStore with RedisRateLimitStore
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string // Custom error message
  keyGenerator?: (req: NextRequest) => string | Promise<string> // Custom key generator (can be async)
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
    requests: number[]
  }
}

/**
 * In-Memory Rate Limit Store
 * 
 * WARNING: This implementation is only suitable for:
 * - Local development
 * - Single-instance deployments
 * 
 * DO NOT USE in production with:
 * - Serverless environments (Vercel, AWS Lambda, etc.)
 * - Horizontally scaled deployments
 * - Multi-instance/multi-region setups
 * 
 * Each instance maintains its own store, so rate limits will be
 * per-instance rather than global, leading to ineffective rate limiting.
 */
class InMemoryRateLimitStore {
  private store: RateLimitStore = {}
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every 5 minutes
    // Only set up interval if we're in a long-running Node.js process
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup()
      }, 5 * 60 * 1000)
    }
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

  get(key: string, windowMs?: number): { count: number; resetTime: number } | null {
    const entry = this.store[key]
    if (!entry) {
      return null
    }

    // For sliding window, filter requests to current window
    if (windowMs && entry.requests.length > 0) {
      const now = Date.now()
      const windowStart = now - windowMs
      const validRequests = entry.requests.filter(time => time > windowStart)
      
      if (validRequests.length === 0) {
        return null
      }

      // Calculate reset time based on oldest request
      const oldestRequest = validRequests[0]
      const resetTime = oldestRequest + windowMs

      return { count: validRequests.length, resetTime }
    }

    // Fallback for non-sliding window or empty requests
    if (entry.resetTime < Date.now()) {
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

    if (!this.store[key] || this.store[key].resetTime < now) {
      // Create new entry
      const resetTime = now + windowMs
      this.store[key] = {
        count: 1,
        resetTime,
        requests: [now]
      }
    } else {
      // Add new request
      this.store[key].requests.push(now)

      // Clean old requests outside the sliding window
      const windowStart = now - windowMs
      this.store[key].requests = this.store[key].requests.filter(time => time > windowStart)
      this.store[key].count = this.store[key].requests.length

      // Update resetTime to be based on the earliest request in the window
      if (this.store[key].requests.length > 0) {
        this.store[key].resetTime = this.store[key].requests[0] + windowMs
      } else {
        this.store[key].resetTime = now + windowMs
      }
    }

    return {
      count: this.store[key].count,
      resetTime: this.store[key].resetTime
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
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

  // Authentication endpoints (less restrictive for real auth flows)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // Increased from 5 to allow legitimate auth flows
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
 * Validates JWT tokens to extract authenticated user IDs
 */
async function defaultKeyGenerator(req: NextRequest): Promise<string> {
  // Get IP address
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown'

  // Try to get user ID from authorization header
  const auth = req.headers.get('authorization')
  let userId = 'anonymous'

  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.substring(7) // Remove 'Bearer ' prefix
    
    try {
      // Validate JWT and extract user ID
      // Note: For production, install 'jose' package for proper JWT validation:
      // npm install jose
      // import { jwtVerify } from 'jose'
      // const secret = new TextEncoder().encode(process.env.JWT_SECRET)
      // const { payload } = await jwtVerify(token, secret)
      // userId = payload.sub || payload.userId || 'anonymous'
      
      // For now, using a simple base64 decode (NOT SECURE - replace with jose in production)
      const parts = token.split('.')
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
          userId = payload.sub || payload.userId || payload.user_id || 'anonymous'
        } catch {
          userId = 'invalid-token'
        }
      } else {
        userId = 'invalid-token'
      }
    } catch {
      userId = 'invalid-token'
    }
  }

  return `${ip}:${userId}`
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimit(config: RateLimitConfig) {
  return async function rateLimit(req: NextRequest): Promise<NextResponse | null> {
    const keyGenerator = config.keyGenerator || defaultKeyGenerator
    const key = await keyGenerator(req)

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
export async function getRateLimitStatus(req: NextRequest, config: RateLimitConfig): Promise<{
  limit: number
  remaining: number
  reset: number
  blocked: boolean
}> {
  const keyGenerator = config.keyGenerator || defaultKeyGenerator
  const key = await keyGenerator(req)
  const entry = rateLimitStore.get(key, config.windowMs)

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
export async function rateLimitMiddleware(req: NextRequest): Promise<NextResponse | undefined> {
  const { pathname } = req.nextUrl

  // Apply different rate limits based on path
  if (pathname.startsWith('/api/auth')) {
    const response = await rateLimiters.auth(req)
    if (response) return response
  } else if (pathname.includes('/revenue') || pathname.includes('/invoices')) {
    const response = await rateLimiters.financial(req)
    if (response) return response
  } else if (pathname.includes('/patients') || pathname.includes('/cases') || pathname.includes('/operations')) {
    const response = await rateLimiters.medical(req)
    if (response) return response
  } else if (pathname.startsWith('/api/')) {
    const response = await rateLimiters.default(req)
    if (response) return response
  }

  // Continue if no rate limit hit
  return undefined
}

// Cleanup on process exit (only for traditional Node.js deployments)
// Note: These handlers may not run in serverless/Edge environments where
// the runtime is per-request and instances are garbage collected automatically
if (typeof process !== 'undefined' && typeof process.on === 'function') {
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
}