// Test script to verify notifications table exists and is accessible
// Run this in your browser console to test the notifications table

async function testNotificationsTable() {
  console.log('🧪 Testing notifications table...');
  
  try {
    // Get Supabase URL and key from environment
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://eqaxmxbqqiuiwkhjwvvz.supabase.co';
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseKey) {
      console.error('❌ Supabase key not found');
      return;
    }
    
    // Get access token
    let accessToken = null;
    try {
      const storedSession = localStorage.getItem('sb-eqaxmxbqqiuiwkhjwvvz-auth-token');
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession);
        const session = parsedSession.currentSession || parsedSession;
        accessToken = session?.access_token;
      }
    } catch (error) {
      console.warn('⚠️ Failed to get token:', error);
    }
    
    if (!accessToken) {
      console.error('❌ No access token available');
      return;
    }
    
    console.log('🔍 Testing notifications table access...');
    
    // Test 1: Check if table exists by trying to select from it
    const testResponse = await fetch(`${supabaseUrl}/rest/v1/notifications?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': supabaseKey,
        'Accept': 'application/json'
      }
    });
    
    console.log('📊 Test response status:', testResponse.status);
    
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ Notifications table exists and is accessible');
      console.log('📊 Sample data:', testData);
    } else {
      const errorText = await testResponse.text();
      console.error('❌ Notifications table test failed:', errorText);
    }
    
    // Test 2: Try to create a test notification
    console.log('🔍 Testing notification creation...');
    
    const testNotification = {
      family_id: '00000000-0000-0000-0000-000000000000', // Dummy ID for test
      user_id: '00000000-0000-0000-0000-000000000000',   // Dummy ID for test
      type: 'test',
      title: 'Test Notification',
      message: 'This is a test notification',
      status: 'unread'
    };
    
    const createResponse = await fetch(`${supabaseUrl}/rest/v1/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': supabaseKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testNotification)
    });
    
    console.log('📊 Create response status:', createResponse.status);
    
    if (createResponse.ok) {
      const createdNotification = await createResponse.json();
      console.log('✅ Test notification created successfully:', createdNotification);
    } else {
      const errorText = await createResponse.text();
      console.error('❌ Test notification creation failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testNotificationsTable();
