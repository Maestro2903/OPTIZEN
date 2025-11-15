import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check environment variables
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const nodeEnv = process.env.NODE_ENV

    console.log('Environment check:', {
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
      console.error('Query error:', error)
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
    console.error('Test connection error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    }, { status: 500 })
  }
}
