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

    const data = await response.json()
    console.log('📦 Response body:')
    console.log(JSON.stringify(data, null, 2))
    console.log('')

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
