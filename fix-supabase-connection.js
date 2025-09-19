// Comprehensive Supabase connection fix script
// Run this with: node fix-supabase-connection.js

require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 SUPABASE CONNECTION FIX TOOL\n');

// Check environment variables
console.log('📋 Environment Check:');
console.log('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('\n❌ CRITICAL: Missing environment variables!');
  console.log('💡 Create a .env file with your Supabase credentials');
  process.exit(1);
}

console.log('\n🌐 Testing Supabase Connection...');

async function testConnection() {
  try {
    const startTime = Date.now();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      signal: AbortSignal.timeout(10000)
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      console.log(`✅ SUCCESS! Connection working (${responseTime}ms)`);
      console.log('🎉 Your Supabase project is ACTIVE!');
      console.log('💡 You can now try signing up/signing in again.');
      return true;
    } else {
      console.log(`❌ Connection failed: ${response.status} ${response.statusText}`);
      return false;
    }
    
  } catch (error) {
    if (error.message.includes('timeout')) {
      console.log('❌ TIMEOUT ERROR - Project is PAUSED/INACTIVE');
      console.log('\n🔧 IMMEDIATE FIX REQUIRED:');
      console.log('1. Go to: https://supabase.com/dashboard');
      console.log('2. Find your project:', supabaseUrl);
      console.log('3. Look for "Paused" or "Inactive" status');
      console.log('4. Click "Resume" or "Activate" button');
      console.log('5. Wait 2-3 minutes for activation');
      console.log('6. Run this script again to verify');
      
      console.log('\n🆘 ALTERNATIVE: Create New Project');
      console.log('1. Go to: https://supabase.com/dashboard');
      console.log('2. Click "New Project"');
      console.log('3. Create new project');
      console.log('4. Update your .env file with new credentials');
      
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('❌ DNS ERROR - Check your internet connection');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('❌ CONNECTION REFUSED - Check Supabase URL');
    } else {
      console.log('❌ UNKNOWN ERROR:', error.message);
    }
    
    return false;
  }
}

async function runDiagnostic() {
  const isWorking = await testConnection();
  
  if (!isWorking) {
    console.log('\n📊 DIAGNOSTIC SUMMARY:');
    console.log('❌ Supabase project is not accessible');
    console.log('🔧 Most likely cause: Project is paused/inactive');
    console.log('💡 Solution: Resume project in Supabase dashboard');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Resume your project in Supabase dashboard');
    console.log('2. Wait 2-3 minutes for activation');
    console.log('3. Run: node fix-supabase-connection.js');
    console.log('4. If successful, restart your app: npx expo start --clear');
    console.log('5. Try signing up/signing in again');
  }
}

runDiagnostic();
