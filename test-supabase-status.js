// Test script to check Supabase project status
// Run this with: node test-supabase-status.js

require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Project Status...\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing environment variables!');
  process.exit(1);
}

console.log('📡 Project URL:', supabaseUrl);
console.log('🔑 API Key:', supabaseAnonKey.substring(0, 20) + '...');

async function testSupabaseStatus() {
  try {
    console.log('\n🌐 Testing basic connectivity...');
    
    // Test 1: Basic connectivity
    const startTime = Date.now();
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      console.log(`✅ Basic connectivity: OK (${responseTime}ms)`);
    } else {
      console.log(`❌ Basic connectivity failed: ${response.status} ${response.statusText}`);
      return;
    }
    
    // Test 2: Auth endpoint
    console.log('\n🔐 Testing auth endpoint...');
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Auth endpoint: OK');
      console.log('📋 Auth settings:', {
        site_url: authData.SITE_URL,
        disable_signup: authData.DISABLE_SIGNUP,
        enable_signup: authData.ENABLE_SIGNUP
      });
    } else {
      console.log(`❌ Auth endpoint failed: ${authResponse.status} ${authResponse.statusText}`);
    }
    
    // Test 3: Database connection
    console.log('\n📊 Testing database connection...');
    const dbResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=count`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Prefer': 'count=exact'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (dbResponse.ok) {
      console.log('✅ Database connection: OK');
      const count = dbResponse.headers.get('content-range');
      console.log('📊 Profiles table accessible');
    } else {
      console.log(`❌ Database connection failed: ${dbResponse.status} ${dbResponse.statusText}`);
    }
    
    console.log('\n🎉 Supabase project appears to be active and working!');
    console.log('💡 If you\'re still getting timeouts, try:');
    console.log('   1. Wait 2-3 minutes for the project to fully activate');
    console.log('   2. Check your network connection');
    console.log('   3. Try a different network (mobile hotspot)');
    
  } catch (error) {
    console.log('\n❌ Test failed:', error.message);
    
    if (error.message.includes('timeout')) {
      console.log('\n💡 TIMEOUT ERROR - This usually means:');
      console.log('   1. 🔴 Supabase project is PAUSED/INACTIVE');
      console.log('   2. 🌐 Network connectivity issues');
      console.log('   3. 🔥 Firewall blocking the connection');
      console.log('\n🔧 SOLUTIONS:');
      console.log('   1. Go to https://supabase.com/dashboard');
      console.log('   2. Check if your project shows "Paused" or "Inactive"');
      console.log('   3. If paused, click "Resume" or "Activate"');
      console.log('   4. Wait 2-3 minutes for the project to fully activate');
      console.log('   5. Try again');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 DNS ERROR - Check your internet connection');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 CONNECTION REFUSED - Check the Supabase URL');
    }
  }
}

testSupabaseStatus();
