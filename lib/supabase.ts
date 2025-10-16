// import 'react-native-url-polyfill/auto';
// import { createClient } from '@supabase/supabase-js';
// import { Platform } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
// const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { router } from "expo-router";

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

// const createSupabaseClient = () => {
//   return createClient(supabaseUrl, supabaseAnonKey, {
//     auth: {
//       storage: Platform.OS === 'web' ? undefined : AsyncStorage,
//       autoRefreshToken: true,
//       persistSession: true,
//       detectSessionInUrl: Platform.OS === 'web',
//       flowType: 'pkce',
//       debug: __DEV__,
//     },
//     global: {
//       headers: {
//         'X-Client-Info': 'famora-mobile',
//         'apikey': supabaseAnonKey,
//       },
//     },
//     db: {
//       schema: 'public',
//     },
//     // Handle web/native differences
//     ...(Platform.OS === 'web' ? {} : {
//       realtime: {
//         params: {
//           eventsPerSecond: 2,
//         },
//       },
//     }),
//   });
// };

// export const supabase = createSupabaseClient();

// // Function to create a fresh client instance
// export const createFreshSupabaseClient = () => {
//   console.log('🔄 Creating fresh Supabase client instance...');
//   return createSupabaseClient();
// };

// // Debug logging for Supabase client
// if (__DEV__) {
//   console.log('🔧 Supabase client initialized:');
//   console.log('URL:', supabaseUrl);
//   console.log('Key length:', supabaseAnonKey?.length);
//   console.log('Platform:', Platform.OS);
// }

// export default supabase;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

/**
 * Refreshes the access token using the refresh token stored in local storage.
 *
 * @returns {Promise<void>}
 */
export async function refreshToken(): Promise<void> {
  const refreshToken = localStorage.getItem("refresh_token");

  if (refreshToken) {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (data?.session) {
      localStorage.setItem("access_token", data?.session?.access_token);
      localStorage.setItem("refresh_token", data?.session?.refresh_token);
    } else {
      console.error("Error refreshing token:", error);
      await signOut();
    }
  } else {
    console.error("No refresh token found");
    await signOut();
  }
}

const signOut = async () => {
  AsyncStorage.clear()
  await supabase.auth.signOut()
  router.replace('/(onboarding)')
}