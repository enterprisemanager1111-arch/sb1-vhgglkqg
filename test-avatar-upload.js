#!/usr/bin/env node

/**
 * Test script to verify Supabase Storage configuration for avatar uploads
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Storage Configuration...\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStorageBuckets() {
  console.log('📁 Testing Storage Buckets...');
  
  try {
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError.message);
      return false;
    }
    
    console.log('✅ Available buckets:');
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.id} (public: ${bucket.public})`);
    });
    
    // Check for avatars bucket
    const avatarsBucket = buckets.find(bucket => bucket.id === 'avatars');
    if (avatarsBucket) {
      console.log('✅ Avatars bucket found and configured');
      return true;
    } else {
      console.log('❌ Avatars bucket not found');
      console.log('💡 You need to create the avatars bucket in Supabase Dashboard');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error testing storage buckets:', error.message);
    return false;
  }
}

async function testProjectStatus() {
  console.log('🌐 Testing Project Status...');
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Project is active and accessible');
      return true;
    } else {
      console.log(`❌ Project returned status: ${response.status}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Project connection failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Supabase Storage Test...\n');
  
  // Test project status
  const projectActive = await testProjectStatus();
  console.log('');
  
  if (!projectActive) {
    console.log('❌ Cannot proceed with storage tests - project is not accessible');
    console.log('💡 Please resume your Supabase project at: https://supabase.com/dashboard');
    process.exit(1);
  }
  
  // Test storage buckets
  const bucketsOk = await testStorageBuckets();
  console.log('');
  
  if (bucketsOk) {
    console.log('✅ All tests passed! Avatar upload should work.');
    console.log('💡 Make sure to resume your Supabase project if it\'s paused.');
  } else {
    console.log('❌ Storage configuration issues found.');
    console.log('💡 Please check the Supabase Dashboard Storage section.');
  }
}

main().catch(console.error);
