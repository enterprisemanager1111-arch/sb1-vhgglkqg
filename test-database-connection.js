// Test script to check database connection and schema
// Run this with: node test-database-connection.js

require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Database Connection and Schema...\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing environment variables!');
  process.exit(1);
}

async function testDatabase() {
  try {
    console.log('🌐 Testing basic API connection...');
    
    // Test basic connection
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log('❌ API connection failed:', response.status, response.statusText);
      return;
    }
    
    console.log('✅ API connection successful!');
    
    // Test profiles table
    console.log('\n📊 Testing profiles table...');
    const profilesResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*&limit=1`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (profilesResponse.ok) {
      console.log('✅ Profiles table accessible!');
      const data = await profilesResponse.json();
      console.log('📋 Sample profile structure:', data.length > 0 ? Object.keys(data[0]) : 'No profiles found');
    } else {
      console.log('❌ Profiles table error:', profilesResponse.status, profilesResponse.statusText);
      const errorText = await profilesResponse.text();
      console.log('Error details:', errorText);
    }
    
    // Test auth endpoint
    console.log('\n🔐 Testing auth endpoint...');
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (authResponse.ok) {
      console.log('✅ Auth endpoint accessible!');
      const authData = await authResponse.json();
      console.log('🔧 Auth settings:', {
        site_url: authData.SITE_URL,
        disable_signup: authData.DISABLE_SIGNUP,
        enable_signup: authData.ENABLE_SIGNUP
      });
    } else {
      console.log('❌ Auth endpoint failed:', authResponse.status, authResponse.statusText);
    }
    
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('💡 DNS resolution issue. Check your internet connection.');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Connection refused. Check if the Supabase URL is correct.');
    } else if (error.message.includes('timeout')) {
      console.log('💡 Connection timeout. Check your internet connection.');
    }
  }
}

testDatabase();
