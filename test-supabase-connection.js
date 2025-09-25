// Test Supabase Connection
const { createClient } = require('@supabase/supabase-js');

// You need to replace these with your actual Supabase credentials
const supabaseUrl = 'https://eqaxmxbqqiuiwkhjwvvz.supabase.co';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY_HERE'; // Replace with your actual key

console.log('🔧 Testing Supabase connection...');
console.log('URL:', supabaseUrl);

if (supabaseKey === 'YOUR_SUPABASE_ANON_KEY_HERE') {
  console.error('❌ Please replace YOUR_SUPABASE_ANON_KEY_HERE with your actual Supabase anon key');
  console.error('🔧 Get your key from: https://supabase.com/dashboard/project/eqaxmxbqqiuiwkhjwvvz/settings/api');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔧 Testing basic connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('📊 Data:', data);
    return true;
    
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return false;
  }
}

testConnection();
