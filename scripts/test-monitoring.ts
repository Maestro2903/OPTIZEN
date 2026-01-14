/**
 * Test Monitoring Endpoints
 * Script to verify health check and metrics endpoints work correctly
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const API_BASE = `${BASE_URL}/api`

interface TestResult {
  name: string
  passed: boolean
  message: string
  data?: any
}

async function testEndpoint(url: string, name: string): Promise<TestResult> {
  try {
    const startTime = Date.now()
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const duration = Date.now() - startTime
    const data = await response.json()

    return {
      name,
      passed: response.ok,
      message: response.ok 
        ? `✅ ${name} returned ${response.status} in ${duration}ms`
        : `❌ ${name} returned ${response.status}: ${data.error || 'Unknown error'}`,
      data: response.ok ? data : undefined
    }
  } catch (error) {
    return {
      name,
      passed: false,
      message: `❌ ${name} failed: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

async function runTests() {
  console.log('🧪 Testing Monitoring Endpoints\n')
  console.log(`Base URL: ${BASE_URL}\n`)

  const results: TestResult[] = []

  // Test health endpoint
  results.push(await testEndpoint(`${API_BASE}/monitoring/health`, 'Health Check'))

  // Test metrics endpoint
  results.push(await testEndpoint(`${API_BASE}/monitoring/metrics`, 'Metrics'))

  // Print results
  console.log('\n📊 Test Results:\n')
  results.forEach(result => {
    console.log(result.message)
    if (result.data && result.passed) {
      console.log('   Data:', JSON.stringify(result.data, null, 2))
    }
    console.log()
  })

  // Summary
  const passed = results.filter(r => r.passed).length
  const total = results.length
  console.log(`\n✅ Passed: ${passed}/${total}`)
  
  if (passed === total) {
    console.log('🎉 All tests passed!')
    process.exit(0)
  } else {
    console.log('⚠️  Some tests failed')
    process.exit(1)
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error running tests:', error)
  process.exit(1)
})












