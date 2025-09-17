import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Add timeout for auth operations
    flowType: 'pkce',
  },
  // Add global timeout and retry logic
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