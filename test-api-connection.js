// Test script to check API connection
// Run this with: node test-api-connection.js

require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing API Connection...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing environment variables!');
  console.log('Please check your .env file.');
  process.exit(1);
}

// Test URL format
if (!supabaseUrl.includes('supabase.co')) {
  console.log('⚠️  Warning: Supabase URL format looks incorrect');
  console.log('Expected format: https://your-project-id.supabase.co');
}

// Test key format
if (!supabaseAnonKey.startsWith('eyJ')) {
  console.log('⚠️  Warning: Supabase anon key format looks incorrect');
  console.log('Expected format: eyJ...');
}

console.log('✅ Environment variables are set correctly!');

// Test API connection
async function testConnection() {
  try {
    console.log('\n🌐 Testing API connection...');
    
    // Test basic connection
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ API connection successful!');
    } else {
      console.log('❌ API connection failed:', response.status, response.statusText);
    }
    
    // Test auth endpoint
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (authResponse.ok) {
      console.log('✅ Auth endpoint accessible!');
    } else {
      console.log('❌ Auth endpoint failed:', authResponse.status, authResponse.statusText);
    }
    
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('💡 This might be a DNS resolution issue. Check your internet connection.');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Connection refused. Check if the Supabase URL is correct.');
    } else if (error.message.includes('timeout')) {
      console.log('💡 Connection timeout. Check your internet connection.');
    }
  }
}

testConnection();
