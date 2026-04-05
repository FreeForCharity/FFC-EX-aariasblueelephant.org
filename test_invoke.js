import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testEmailFunction(type, record) {
  console.log(`Invoking send-registration-email for ${type}...`)
  try {
    const { data, error } = await supabase.functions.invoke('send-registration-email', {
      body: { record, type }
    })
    console.log('Data:', data)
    console.log('Error:', error)
  } catch (err) {
    console.error('Exception:', err)
  }
}

async function runTests() {
    // Test Registration Received
    await testEmailFunction('REGISTRATION_RECEIVED', {
        user_name: 'Test User',
        user_email: 'test@example.com',
        event_title: 'Summer Fun Day'
    });

    // Test Volunteer Received
    await testEmailFunction('VOLUNTEER_RECEIVED', {
        user_name: 'Volunteer Test',
        user_email: 'volunteer@example.com',
        interest: 'Inclusive Play'
    });
}

runTests();
