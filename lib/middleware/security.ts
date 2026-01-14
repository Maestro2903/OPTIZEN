/**
 * Security Middleware for HTTPS Enforcement and Security Headers
 * Implements comprehensive security measures for healthcare applications
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Security headers configuration for healthcare compliance
 */
export const securityHeaders = {
  // HTTPS enforcement
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Content Security Policy for healthcare apps
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https: wss:",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; '),

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // XSS protection
  'X-XSS-Protection': '1; mode=block',

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Referrer policy for privacy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Feature policy restrictions
  'Permissions-Policy': [
    'geolocation=(self)',
    'microphone=()',
    'camera=()',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'speaker=(self)'
  ].join(', '),

  // Server information hiding
  'X-Powered-By': '', // Remove this header

  // Cache control for sensitive data
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',

  // Additional security headers
  'X-DNS-Prefetch-Control': 'off',
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none'
}

/**
 * HTTPS enforcement middleware
 */
export function enforceHTTPS(req: NextRequest): NextResponse | null {
  const protocol = req.headers.get('x-forwarded-proto') || 'http'

  // If not HTTPS, redirect to HTTPS using Next.js URL API for security
  if (protocol !== 'https') {
    const httpsUrl = new URL(req.nextUrl)
    httpsUrl.protocol = 'https:'
    return NextResponse.redirect(httpsUrl, 301)
  }

  return null
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Apply all security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value)
    } else {
      // Remove headers with empty values
      response.headers.delete(key)
    }
  })

  return response
}

/**
 * IP whitelisting for admin endpoints
 */
export function checkIPWhitelist(req: NextRequest, allowedIPs: string[] = []): boolean {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown'

  // If no whitelist is configured, allow all
  if (allowedIPs.length === 0) {
    return true
  }

  return allowedIPs.includes(ip)
}

/**
 * CORS configuration for healthcare APIs
 */
export function configureCORS(req: NextRequest, allowedOrigins: string[] = []): Headers {
  const headers = new Headers()
  const origin = req.headers.get('origin')

  // Get allowed origins from environment or use defaults
  const envOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
  const defaultAllowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    ...(process.env.DOMAIN ? [`https://${process.env.DOMAIN}`, `https://www.${process.env.DOMAIN}`] : []),
    ...envOrigins
  ]

  const allowedOriginsList = allowedOrigins.length > 0 ? allowedOrigins : defaultAllowedOrigins

  // Check if origin is allowed
  if (origin && allowedOriginsList.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Credentials', 'true')
  }

  // Set CORS headers
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  headers.set('Access-Control-Allow-Headers', [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Session-ID',
    'X-Request-ID'
  ].join(', '))
  headers.set('Access-Control-Max-Age', '86400') // 24 hours

  return headers
}

/**
 * Rate limiting based on request patterns (honeypot detection)
 */
export function detectSuspiciousActivity(req: NextRequest): boolean {
  const userAgent = req.headers.get('user-agent') || ''
  const referer = req.headers.get('referer') || ''

  // Suspicious patterns
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scanner/i,
    /hack/i,
    /sql/i,
    /injection/i,
    /script/i
  ]

  // Check for suspicious user agents
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    return true
  }

  // Check for missing or suspicious referers on sensitive endpoints
  if (req.nextUrl.pathname.includes('/api/') && !referer) {
    return true
  }

  return false
}

/**
 * Request sanitization
 */
export function sanitizeRequest(req: NextRequest): boolean {
  const url = req.nextUrl.pathname + req.nextUrl.search

  // Dangerous patterns in URLs
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /\.\./,
    /\/\.\./,
    /%2e%2e/i,
    /%252e%252e/i,
    /union.*select/i,
    /drop.*table/i,
    /insert.*into/i,
    /delete.*from/i
  ]

  // Check for dangerous patterns
  if (dangerousPatterns.some(pattern => pattern.test(url))) {
    return false
  }

  return true
}

/**
 * Comprehensive security middleware
 */
export function securityMiddleware(req: NextRequest): NextResponse | null {
  // 1. Enforce HTTPS
  const httpsResponse = enforceHTTPS(req)
  if (httpsResponse) {
    return httpsResponse
  }

  // 2. Sanitize request
  if (!sanitizeRequest(req)) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    )
  }

  // 3. Detect suspicious activity
  if (detectSuspiciousActivity(req)) {
    return NextResponse.json(
      { success: false, error: 'Suspicious activity detected' },
      { status: 403 }
    )
  }

  // 4. Handle OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    const corsHeaders = configureCORS(req)
    return new NextResponse(null, { status: 200, headers: corsHeaders })
  }

  return null
}

/**
 * Create secure response with all security headers
 */
export function createSecureResponse(
  body?: any,
  options?: ResponseInit,
  req?: NextRequest
): NextResponse {
  const response = body
    ? NextResponse.json(body, options)
    : new NextResponse(null, options)

  // Apply security headers
  applySecurityHeaders(response)

  // Apply CORS headers if request is provided
  if (req) {
    const corsHeaders = configureCORS(req)
    corsHeaders.forEach((value, key) => {
      response.headers.set(key, value)
    })
  }

  return response
}

/**
 * Middleware for protecting admin routes
 */
export function protectAdminRoute(req: NextRequest, allowedIPs: string[] = []): NextResponse | null {
  // Check IP whitelist
  if (!checkIPWhitelist(req, allowedIPs)) {
    return NextResponse.json(
      { success: false, error: 'Access denied from this IP address' },
      { status: 403 }
    )
  }

  return null
}

/**
 * Content Security Policy violation reporting endpoint
 */
export function handleCSPViolation(req: NextRequest): NextResponse {
  // Log CSP violation for security monitoring
  console.warn('CSP Violation detected:', {
    url: req.nextUrl.href,
    userAgent: req.headers.get('user-agent'),
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
    timestamp: new Date().toISOString()
  })

  return createSecureResponse({ received: true }, { status: 204 })
}

/**
 * Security configuration for different environments
 */
export const securityConfig = {
  development: {
    httpsEnforced: false,
    strictCSP: false,
    ipWhitelisting: false
  },
  staging: {
    httpsEnforced: true,
    strictCSP: true,
    ipWhitelisting: false
  },
  production: {
    httpsEnforced: true,
    strictCSP: true,
    ipWhitelisting: true,
    allowedIPs: process.env.ADMIN_ALLOWED_IPS?.split(',') || []
  }
}

/**
 * Get current security configuration
 */
export function getSecurityConfig() {
  const env = process.env.NODE_ENV as keyof typeof securityConfig
  return securityConfig[env] || securityConfig.development
}