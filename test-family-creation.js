// Test script for family creation functionality
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please make sure your .env file contains:');
  console.error('EXPO_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFamilyCreation() {
  console.log('🧪 Testing Family Creation Functionality');
  console.log('=====================================');

  try {
    // Test 1: Check if families table has the new fields
    console.log('\n1️⃣ Testing families table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('families')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Error accessing families table:', tableError.message);
      console.log('💡 You may need to run the database migration:');
      console.log('   supabase/migrations/20250121000000_add_family_additional_fields.sql');
      return false;
    }

    console.log('✅ Families table is accessible');

    // Test 2: Check if family_img bucket exists
    console.log('\n2️⃣ Testing family_img storage bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error accessing storage:', bucketError.message);
      return false;
    }

    const familyImgBucket = buckets.find(bucket => bucket.id === 'family_img');
    if (!familyImgBucket) {
      console.error('❌ family_img bucket not found');
      console.log('💡 You may need to run the storage migration:');
      console.log('   supabase/migrations/20250115000002_create_family_img_bucket.sql');
      return false;
    }

    console.log('✅ family_img bucket exists and is accessible');

    // Test 3: Test family creation (without image)
    console.log('\n3️⃣ Testing family creation...');
    const testFamilyData = {
      name: 'Test Family ' + Date.now(),
      code: 'TEST' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      slogan: 'Test Family Slogan',
      type: 'Private',
      family_img: null,
      created_by: '00000000-0000-0000-0000-000000000000' // Dummy UUID for testing
    };

    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .insert(testFamilyData)
      .select()
      .single();

    if (familyError) {
      console.error('❌ Error creating family:', familyError.message);
      return false;
    }

    console.log('✅ Family created successfully:', familyData);

    // Test 4: Clean up test data
    console.log('\n4️⃣ Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('families')
      .delete()
      .eq('id', familyData.id);

    if (deleteError) {
      console.warn('⚠️ Warning: Could not clean up test family:', deleteError.message);
    } else {
      console.log('✅ Test family cleaned up');
    }

    console.log('\n🎉 All tests passed! Family creation functionality is working correctly.');
    console.log('\n📋 Next steps:');
    console.log('1. Make sure to run the database migration in your Supabase dashboard');
    console.log('2. Test the actual app functionality by creating a family');
    console.log('3. Verify that images are uploaded to the family_img bucket');

    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run the test
testFamilyCreation().then(success => {
  process.exit(success ? 0 : 1);
});
