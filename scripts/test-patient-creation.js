#!/usr/bin/env node

/**
 * Test Patient Creation - Debugging Script
 * Tests the patient creation endpoint with detailed logging
 */

const fetch = require('node-fetch')

async function testPatientCreation() {
  console.log('🧪 Testing Patient Creation API\n')

  const testPatient = {
    patient_id: `PAT-${Date.now()}-TEST`,
    full_name: 'Test Patient',
    mobile: '9876543210',
    gender: 'male',
    state: 'Gujarat',
    status: 'active'
  }

  console.log('📤 Sending request to: http://localhost:3001/api/patients')
  console.log('📋 Patient data:', JSON.stringify(testPatient, null, 2))
  console.log('')

  try {
    const response = await fetch('http://localhost:3001/api/patients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPatient),
    })

    console.log(`📊 Response status: ${response.status} ${response.statusText}`)
    console.log('📥 Response headers:')
    response.headers.forEach((value, name) => {
      console.log(`   ${name}: ${value}`)
    })
    console.log('')

    // Handle non-2xx responses
    if (!response.ok) {
      console.log('❌ Patient creation failed!')
      console.log(`   HTTP Status: ${response.status}`)
      console.log(`   Content-Type: ${response.headers.get('content-type')}`)
    }

    // Safely parse JSON response
    const rawBody = await response.text()
    let data
    try {
      data = JSON.parse(rawBody)
      console.log('📦 Response body:')
      console.log(JSON.stringify(data, null, 2))
      console.log('')
    } catch (parseError) {
      console.log('⚠️  Failed to parse JSON response')
      console.log('📦 Raw response body:')
      console.log(rawBody)
      console.log('')
      throw new Error(`JSON parse failed: ${parseError.message}. Raw body: ${rawBody.substring(0, 200)}`)
    }

    if (response.ok) {
      console.log('✅ Patient created successfully!')
    } else {
      console.log('❌ Patient creation failed!')
      console.log('Error:', data.error || 'Unknown error')
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message)
    console.error('Full error:', error)
  }
}

testPatientCreation()
