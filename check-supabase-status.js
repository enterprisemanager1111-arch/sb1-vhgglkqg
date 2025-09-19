// Quick script to check if Supabase project is active
// Run this with: node check-supabase-status.js

require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Checking Supabase Project Status...\n');

async function checkStatus() {
  try {
    console.log('🌐 Testing connection to:', supabaseUrl);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (response.ok) {
      console.log('✅ SUCCESS! Your Supabase project is ACTIVE and working!');
      console.log('🎉 You can now try signing up/signing in again.');
    } else {
      console.log(`❌ Project responded but with error: ${response.status}`);
    }
    
  } catch (error) {
    if (error.message.includes('timeout')) {
      console.log('❌ TIMEOUT - Project is still PAUSED/INACTIVE');
      console.log('💡 Please go to https://supabase.com/dashboard and resume your project');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

checkStatus();
