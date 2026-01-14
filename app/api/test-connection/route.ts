import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'

export async function GET() {
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  const startTime = Date.now()

  try {
    // Check environment variables
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const nodeEnv = process.env.NODE_ENV

    logger.info('Environment check', {
      request_id: requestId,
      endpoint: '/api/test-connection',
      hasUrl,
      hasAnonKey,
      hasServiceKey,
      nodeEnv,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
    })

    // Try to create client
    const supabase = createClient()
    
    // Try a simple query
    const { data, error } = await supabase
      .from('encounters')
      .select('id')
      .limit(1)

    if (error) {
      logger.error('Query error', error, {
        request_id: requestId,
        endpoint: '/api/test-connection',
        env: { hasUrl, hasAnonKey, hasServiceKey, nodeEnv }
      })
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
        env: {
          hasUrl,
          hasAnonKey,
          hasServiceKey,
          nodeEnv
        }
      }, { status: 500 })
    }

    const duration = Date.now() - startTime
    logger.requestComplete('GET', '/api/test-connection', 200, duration, requestId, {
      recordCount: data?.length || 0
    })

    return NextResponse.json({
      success: true,
      message: 'Connection successful',
      recordCount: data?.length || 0,
      env: {
        hasUrl,
        hasAnonKey,
        hasServiceKey,
        nodeEnv
      }
    })

  } catch (error: any) {
    const duration = Date.now() - startTime
    logger.error('Test connection error', error, {
      request_id: requestId,
      endpoint: '/api/test-connection',
      duration_ms: duration
    })
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    }, { status: 500 })
  }
}
