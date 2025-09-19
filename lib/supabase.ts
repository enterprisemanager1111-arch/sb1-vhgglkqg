import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  console.error('');
  console.error('🔧 To fix this:');
  console.error('1. Create a .env file in your project root');
  console.error('2. Add your Supabase credentials:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co');
  console.error('   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here');
  console.error('3. Restart your development server: npx expo start --clear');
  console.error('');
  throw new Error('Missing Supabase environment variables. Please check the console for setup instructions.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    debug: __DEV__,
  },
  global: {
    headers: {
      'X-Client-Info': 'famora-mobile',
    },
  },
  db: {
    schema: 'public',
  },
  // Handle web/native differences
  ...(Platform.OS === 'web' ? {} : {
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
    },
  }),
});

export default supabase;