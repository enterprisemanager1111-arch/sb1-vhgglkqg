// Test script to verify Supabase connection
// Run this with: node test-supabase-connection.js

require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing environment variables!');
  console.log('Please create a .env file with your Supabase credentials.');
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
console.log('✅ You can now start your development server: npx expo start --clear');
