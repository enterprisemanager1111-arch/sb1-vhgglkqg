import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSegments } from 'expo-router';

interface Profile {
  id: string;
  name: string;
  birth_date?: string;
  avatar_url?: string;
  role?: string;
  interests?: string[];
  company_ID?: string;
  phone_num?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, birthDate?: string, role?: string, interests?: string[], companyID?: string, phoneNum?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<Profile, 'name' | 'birth_date' | 'avatar_url' | 'role' | 'interests' | 'company_ID' | 'phone_num'>>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const segments = useSegments();
  
  // Track if we're on a protected page where tokens should NOT be deleted
  const isOnProtectedPage = () => {
    const currentPath = segments.join('/');
    return currentPath.includes('newFamily') || 
           currentPath.includes('workProfileEmpty') || 
           currentPath.includes('resetPwd') || 
           currentPath.includes('myProfile/edit') ||
           currentPath.includes('final');
  };
  
  // Smart token protection - only protect valid tokens
  const protectedAsyncStorage = {
    removeItem: async (key: string) => {
      if (key === 'sb-eqaxmxbqqiuiwkhjwvvz-auth-token' && isOnProtectedPage()) {
        // Check if we have a valid session - if not, the token is likely corrupted/expired
        if (session && user) {
          console.log('🛡️ BLOCKED: Protecting valid auth token on protected page:', segments.join('/'));
          return; // Don't delete valid tokens
        } else {
          console.log('🧹 ALLOWING: Removing expired/corrupted auth token even on protected page');
        }
      }
      return AsyncStorage.removeItem(key);
    },
    multiRemove: async (keys: string[]) => {
      const authTokenKey = 'sb-eqaxmxbqqiuiwkhjwvvz-auth-token';
      if (keys.includes(authTokenKey) && isOnProtectedPage()) {
        // Check if we have a valid session - if not, allow cleanup
        if (session && user) {
          console.log('🛡️ BLOCKED: Protecting valid auth token (multiRemove) on protected page:', segments.join('/'));
          // Remove the auth token from the keys to delete
          const filteredKeys = keys.filter(key => key !== authTokenKey);
          if (filteredKeys.length > 0) {
            return AsyncStorage.multiRemove(filteredKeys);
          }
          return;
        } else {
          console.log('🧹 ALLOWING: Removing expired/corrupted auth tokens (multiRemove) even on protected page');
        }
      }
      return AsyncStorage.multiRemove(keys);
    },
    clear: async () => {
      if (isOnProtectedPage()) {
        // Only block clear if we have a valid session
        if (session && user) {
          console.log('🛡️ BLOCKED: Preventing AsyncStorage clear on protected page with valid session:', segments.join('/'));
          return; // Don't clear storage if session is valid
        } else {
          console.log('🧹 ALLOWING: AsyncStorage clear on protected page - no valid session');
        }
      }
      return AsyncStorage.clear();
    }
  };

  // Check network connectivity to Supabase
  const checkConnectivity = async (): Promise<boolean> => {
    try {
      // Simple connectivity test
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      console.log('🌐 Connectivity check failed:', error);
      return false;
    }
  };

  // Clean up corrupted or expired auth tokens
  const cleanupAuthTokens = async (bypassRouteCheck = false) => {
    console.log('🧹 Cleaning up auth tokens...');
    
    // Smart safety check: Only protect if we have valid session AND on protected page
    if (!bypassRouteCheck && isOnProtectedPage()) {
      if (session && user) {
        console.log('🛡️ Preventing token cleanup - user has valid session on protected page:', segments.join('/'));
        if (segments.join('/').includes('newFamily')) {
          console.log('🔐 Specifically protecting newFamily page with valid session from token deletion');
        }
        return;
      } else {
        console.log('🧹 Allowing token cleanup on protected page - no valid session to protect');
      }
    }
    
    try {
      // Remove the main auth token (with smart protection)
      await protectedAsyncStorage.removeItem('sb-eqaxmxbqqiuiwkhjwvvz-auth-token');
      
      // Also remove any other potential auth-related keys
      const keys = await AsyncStorage.getAllKeys();
      const authKeys = keys.filter(key => 
        key.includes('supabase') || 
        key.includes('auth') || 
        key.includes('sb-') ||
        key.includes('eqaxmxbqqiuiwkhjwvvz')
      );
      
      if (authKeys.length > 0) {
        await protectedAsyncStorage.multiRemove(authKeys);
        console.log('🧹 Removed auth keys:', authKeys);
      }
      
      // Clear auth state
      setSession(null);
      setUser(null);
      setProfile(null);
      
    } catch (error) {
      console.error('Error cleaning up auth tokens:', error);
    }
  };

  // Load user profile
  const loadProfile = async (userId: string) => {
    try {
      console.log('🔄 Loading profile for user:', userId);
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error loading profile:', error);
        return;
      }

      console.log('✅ Profile loaded successfully:', profileData);
      setProfile(profileData || null);
    } catch (error) {
      console.error('❌ Error loading profile:', error);
    }
  };

  const createProfile = async (user: User, fullName: string, birthDate?: string, role?: string, interests?: string[], companyID?: string, phoneNum?: string) => {
    try {
      console.log('createProfile called with fullName:', fullName, 'birthDate:', birthDate, 'role:', role, 'interests:', interests, 'companyID:', companyID, 'phoneNum:', phoneNum);
      const profileName = fullName && fullName.trim() ? fullName.trim() : '';
      
      console.log('Creating profile for user:', user.id, 'with name:', profileName, 'birth_date:', birthDate, 'role:', role, 'interests:', interests);

      const profileData: any = {
        id: user.id,
        name: profileName,
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add birth_date if provided
      if (birthDate && birthDate.trim()) {
        profileData.birth_date = birthDate.trim();
      }

      // Add role if provided and valid
      if (role && role.trim()) {
        const validRoles = ['parent', 'child', 'teenager', 'grandparent', 'other'];
        const cleanRole = role.trim().toLowerCase();
        if (validRoles.includes(cleanRole)) {
          profileData.role = cleanRole;
        }
      }

      // Add interests if provided
      if (interests && Array.isArray(interests) && interests.length > 0) {
        profileData.interests = interests.filter(interest => interest && interest.trim());
      }

      // Add company_id if provided
      if (companyID && companyID.trim()) {
        profileData.company_ID = companyID.trim();
        console.log('Adding company_ID to profile:', companyID.trim());
      }

      // Add phone_num if provided
      if (phoneNum && phoneNum.trim()) {
        profileData.phone_num = phoneNum.trim();
        console.log('Adding phone_num to profile:', phoneNum.trim());
      }

      console.log('Final profile data to insert:', profileData);

      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        console.error('Error details:', error.message, error.code, error.details);
        
        // Provide more specific error messages for common database issues
        if (error.message?.includes('column "role" does not exist')) {
          throw new Error('Database schema error: Missing role column. Please run database migrations.');
        } else if (error.message?.includes('column "interests" does not exist')) {
          throw new Error('Database schema error: Missing interests column. Please run database migrations.');
        } else if (error.message?.includes('column "company_ID" does not exist')) {
          console.warn('company_ID column does not exist, creating profile without it');
          // Retry without company_ID and phone_num
          const fallbackProfileData: any = {
            id: user.id,
            name: profileName,
            avatar_url: user.user_metadata?.avatar_url || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          if (birthDate && birthDate.trim()) {
            fallbackProfileData.birth_date = birthDate.trim();
          }
          if (role && role.trim()) {
            const validRoles = ['parent', 'child', 'teenager', 'grandparent', 'other'];
            const cleanRole = role.trim().toLowerCase();
            if (validRoles.includes(cleanRole)) {
              fallbackProfileData.role = cleanRole;
            }
          }
          if (interests && Array.isArray(interests) && interests.length > 0) {
            fallbackProfileData.interests = interests.filter(interest => interest && interest.trim());
          }
          if (companyID && companyID.trim()) {
            fallbackProfileData.company_ID = companyID.trim();
          }
          if (phoneNum && phoneNum.trim()) {
            fallbackProfileData.phone_num = phoneNum.trim();
          }
          
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('profiles')
            .insert([fallbackProfileData])
            .select()
            .single();
            
          if (fallbackError) {
            throw new Error(`Profile creation failed: ${fallbackError.message}`);
          } else {
            console.log('Profile created successfully (fallback):', fallbackData);
            setProfile(fallbackData);
            return fallbackData;
          }
        } else if (error.message?.includes('column "phone_num" does not exist')) {
          console.warn('phone_num column does not exist, creating profile without it');
          // Similar fallback logic for phone_num
          const fallbackProfileData: any = {
            id: user.id,
            name: profileName,
            avatar_url: user.user_metadata?.avatar_url || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          if (birthDate && birthDate.trim()) {
            fallbackProfileData.birth_date = birthDate.trim();
          }
          if (role && role.trim()) {
            const validRoles = ['parent', 'child', 'teenager', 'grandparent', 'other'];
            const cleanRole = role.trim().toLowerCase();
            if (validRoles.includes(cleanRole)) {
              fallbackProfileData.role = cleanRole;
            }
          }
          if (interests && Array.isArray(interests) && interests.length > 0) {
            fallbackProfileData.interests = interests.filter(interest => interest && interest.trim());
          }
          if (companyID && companyID.trim()) {
            fallbackProfileData.company_ID = companyID.trim();
          }
          if (phoneNum && phoneNum.trim()) {
            fallbackProfileData.phone_num = phoneNum.trim();
          }
          
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('profiles')
            .insert([fallbackProfileData])
            .select()
            .single();
            
          if (fallbackError) {
            throw new Error(`Profile creation failed: ${fallbackError.message}`);
          } else {
            console.log('Profile created successfully (fallback):', fallbackData);
            setProfile(fallbackData);
            return fallbackData;
          }
        } else if (error.message?.includes('duplicate key value')) {
          throw new Error('Profile already exists for this user. Please try signing in instead.');
        } else if (error.message?.includes('foreign key constraint')) {
          throw new Error('User account not found. Please try signing up again.');
        } else {
          throw new Error(`Profile creation failed: ${error.message}`);
        }
      } else {
        console.log('Profile created successfully:', data);
        setProfile(data);
        return data;
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;
    let authSuccessful = false; // Track if auth was successful to prevent timeout cleanup
    
    const loadInitialData = async () => {
      try {
        console.log('🔄 Loading initial auth data...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('❌ Error getting session:', error);
          
          // If it's a network error, try to clear any corrupted auth tokens
          if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('ERR_TUNNEL_CONNECTION_FAILED')) {
            console.log('🧹 Network error detected, cleaning up potentially corrupted auth tokens...');
            await cleanupAuthTokens();
          }
          
          // Set states to null and stop loading
          setSession(null);
          setUser(null);
          setProfile(null);
          return;
        }
        
        console.log('✅ Session loaded:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 User found, loading profile...');
          await loadProfile(session.user.id);
        } else {
          console.log('👤 No user found');
        }
      } catch (error: any) {
        console.error('❌ Error loading initial auth data:', error);
        
        // Handle network connectivity issues
        if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('ERR_TUNNEL_CONNECTION_FAILED')) {
          console.log('🌐 Network connectivity issue detected, cleaning up auth state...');
          await cleanupAuthTokens();
        }
        
        // Always clear auth state on error
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        if (mounted) {
          console.log('✅ Auth loading completed');
          setLoading(false);
        }
      }
    };

     // Add fallback timeout to ensure loading never stays true indefinitely
    const fallbackTimeout = setTimeout(async () => {
      if (mounted) {
        console.warn('⚠️ Auth loading timeout reached');
        
        // IMPORTANT: Don't clean up tokens if we have a valid session/user, even if loading is slow
        if (session && user) {
          console.log('✅ Valid session and user found during timeout - just setting loading to false');
          setLoading(false);
          return;
        }
        
        // Also don't clean up if auth was successful at any point
        if (authSuccessful) {
          console.log('✅ Auth was successful during this session - just setting loading to false');
          setLoading(false);
          return;
        }
        
        // Check if there's a stored auth token but no session (network issue scenario)
        // BUT be careful not to clean up tokens during normal navigation/loading
        try {
          const authToken = await AsyncStorage.getItem('sb-eqaxmxbqqiuiwkhjwvvz-auth-token');
          if (authToken && !session && !user) {
             // Only clean up tokens if we're sure it's a network/corruption issue
             // Don't clean up if we might just be in the middle of normal loading/navigation
             console.warn('⚠️ Auth token exists but session failed to load');
             
              // Only preserve tokens if there's a chance of valid auth state
              if (isOnProtectedPage()) {
                // If we're in a retry loop and still no session, it's likely a bad token
                console.log('🔍 On protected page but no session after timeout - likely expired token');
                console.log('🧹 Proceeding with token cleanup for corrupted/expired token');
              }
             
             // Try to test connectivity before cleaning up tokens
             try {
               const connectivityTest = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/`, {
                 method: 'HEAD',
                 signal: AbortSignal.timeout(3000),
               });
               
               if (!connectivityTest.ok) {
                 console.warn('⚠️ Connectivity test failed - clearing potentially corrupted tokens');
                 await cleanupAuthTokens();
               } else {
                 console.log('✅ Connectivity OK - keeping auth token, might just be loading delay');
               }
             } catch (connectivityError) {
               console.warn('⚠️ Connectivity test failed - clearing tokens due to network issue');
               await cleanupAuthTokens();
             }
           }
         } catch (error) {
           console.error('Error checking auth token during timeout:', error);
         }
         
         setLoading(false);
       }
     }, 8000); // 8 second timeout to prevent blocking navigation

     loadInitialData();

     const {
       data: { subscription },
     } = supabase.auth.onAuthStateChange(async (event, session) => {
       if (!mounted) return;
       
       console.log('🔄 Auth state change:', event, 'User ID:', session?.user?.id);
       console.log('Session exists:', !!session);
       console.log('User exists:', !!session?.user);
       
       // Handle TOKEN_REFRESHED and SIGNED_OUT events specially
       if (event === 'TOKEN_REFRESHED') {
         console.log('🔄 Token refreshed successfully');
       } else if (event === 'SIGNED_OUT') {
         console.log('🚪 User signed out');
         setSession(null);
         setUser(null);
         setProfile(null);
         if (mounted) {
           setLoading(false);
         }
         return;
       }
       
      setSession(session);
      setUser(session?.user ?? null);

     if (session?.user) {
       authSuccessful = true; // Mark auth as successful
       console.log('👤 User logged in, checking email verification...');
        
        // Note: Removed AsyncStorage check for is_verifying_signup
        // The signup verification is now handled entirely through React state
        
        // CRITICAL SECURITY CHECK: Block unverified users
        if (!session.user.email_confirmed_at) {
          console.log('❌ SECURITY: Unverified user detected in auth state change');
          console.log('🚪 Signing out unverified user immediately...');
          await supabase.auth.signOut();
          return; // Exit early, don't proceed with profile loading
        }
        
        console.log('✅ User email is verified, proceeding with profile loading...');
        
        // Load profile and check if it exists
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

         if (profileError) {
           console.error('❌ Error loading profile:', profileError);
           // Even if there's a profile error, we should still set loading to false
           // to prevent infinite loading state
           if (mounted) {
             setLoading(false);
           }
           return;
         }

        if (existingProfile) {
          console.log('✅ Existing profile found, setting profile state');
          setProfile(existingProfile);
        } else {
          console.log('📝 No profile found for verified user, creating default profile...');
          try {
            await createProfile(
              session.user, 
              '', // Empty name as requested
              undefined, // No birth date
              undefined, // No role
              [], // No interests
              session.user.user_metadata?.company_id,
              session.user.user_metadata?.phone_number
            );
            console.log('✅ Default profile created for verified user');
          } catch (createError) {
            console.error('❌ Failed to create default profile:', createError);
          }
        }
      } else {
        console.log('🚪 User logged out, clearing profile...');
        setProfile(null);
      }

      if (mounted) {
        setLoading(false);
      }
    });

     return () => {
       mounted = false;
       clearTimeout(fallbackTimeout);
       subscription.unsubscribe();
     };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, birthDate?: string, role?: string, interests?: string[], companyID?: string, phoneNum?: string) => {
    console.log('🚀 SignUp called with:', { email, fullName, birthDate, role, interests, companyID, phoneNum });
    
    // Enhanced validation with better error messages
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    try {
      console.log('🌐 Attempting to connect to Supabase...');
      console.log('📡 Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
      
      // Test connection first
      const { data: testData, error: testError } = await supabase.auth.getSession();
      if (testError && testError.message.includes('fetch')) {
        console.error('❌ Network connection test failed:', testError);
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
      }
      
      console.log('✅ Connection test passed, proceeding with signup...');
      
      // Add timeout for signup operations
      console.log('🔄 Starting Supabase signup process...');
      const signupPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Signup is taking too long. Please check your internet connection and try again.')), 60000); // 60 seconds for signup
      });

      const { data, error } = await Promise.race([signupPromise, timeoutPromise]) as any;
      
      console.log('📊 Supabase signup response:', { 
        hasData: !!data, 
        hasError: !!error, 
        userExists: !!data?.user,
        sessionExists: !!data?.session,
        errorMessage: error?.message 
      });

      if (error) {
        // Provide more specific error messages for signup
        if (error.message?.includes('User already registered') || error.message?.includes('user_already_exists')) {
          throw new Error('This email is already registered. Try signing in instead.');
        } else if (error.message?.includes('Invalid email')) {
          throw new Error('Please enter a valid email address.');
        } else if (error.message?.includes('Password should be at least')) {
          throw new Error('Password must be at least 6 characters.');
        } else if (error.message?.includes('Too many requests')) {
          throw new Error('Too many signup attempts. Please wait a moment and try again.');
        } else {
          throw error;
        }
      }

    if (data.user) {
      console.log('✅ User created successfully:', {
        userId: data.user.id,
        email: data.user.email,
        emailConfirmed: data.user.email_confirmed_at,
        createdAt: data.user.created_at
      });
      
      // Wait briefly for the database trigger to create the profile, then update it
      try {
        // Wait a short moment for the trigger to create the basic profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Retry mechanism for profile check (JWT timing issues)
        let existingProfile = null;
        let profileCheckError = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();
            
          existingProfile = profileData;
          profileCheckError = profileError;
          
          if (!profileError) {
            break; // Success, exit retry loop
          }
          
          if (profileError.message?.includes('user_not_found') || profileError.message?.includes('JWT')) {
            retryCount++;
            console.log(`JWT/User not found error, retrying... (${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
          } else {
            break; // Different error, don't retry
          }
        }
        
        if (profileCheckError) {
          console.error('Error checking for existing profile:', profileCheckError);
          // If there's an error checking the profile, try to create it manually
          console.log('Profile check failed, creating profile manually for user:', data.user.id);
          await createProfile(data.user, fullName, birthDate, role, interests, companyID, phoneNum);
        } else if (!existingProfile) {
          console.log('Database trigger failed, creating profile manually for user:', data.user.id);
          await createProfile(data.user, fullName, birthDate, role, interests, companyID, phoneNum);
        } else {
          console.log('Profile found for user:', data.user.id);
          // Update profile with additional onboarding data if provided
          if (birthDate || role || interests || companyID || phoneNum) {
            const updates: any = {};
            if (birthDate) updates.birth_date = birthDate;
            if (role) updates.role = role;
            if (interests && interests.length > 0) updates.interests = interests;
            if (companyID) updates.company_ID = companyID;
            if (phoneNum) updates.phone_num = phoneNum;
            
            if (Object.keys(updates).length > 0) {
              console.log('Updating profile with onboarding data:', updates);
              await updateProfile(updates);
            }
          }
        }
        
        console.log('✅ Profile setup completed successfully');
      } catch (profileError) {
        console.error('Profile handling failed:', profileError);
        
        // Show the actual error to help debug
        const errorMessage = profileError instanceof Error ? profileError.message : 'Unknown error';
        console.error('Detailed error:', errorMessage);
        
        // Provide specific guidance for common issues
        if (errorMessage.includes('column "role" does not exist') || errorMessage.includes('column "interests" does not exist')) {
          throw new Error('Database schema is outdated. Please contact support or try again later.');
        } else if (errorMessage.includes('duplicate key value')) {
          throw new Error('Account already exists. Please try signing in instead.');
        } else if (errorMessage.includes('user_not_found') || errorMessage.includes('JWT')) {
          // Clear any corrupted session state
          try {
            await supabase.auth.signOut();
            console.log('Cleared session due to JWT error');
          } catch (signOutError) {
            console.error('Error clearing session:', signOutError);
          }
          throw new Error('Authentication error. Please try signing up again.');
        } else {
          // Don't sign out the user, but throw error to show in UI
          throw new Error(`Profile setup failed: ${errorMessage}. Your account was created, but there was an issue setting up your profile. Please try signing in.`);
        }
      }
    }
    } catch (error: any) {
      console.error('❌ SignUp function failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack
      });
      
      // Handle network and other errors
      if (error.message?.includes('Signup is taking too long')) {
        throw new Error('Signup is taking too long. Please check your internet connection and try again.');
      } else if (error.message?.includes('fetch') || error.message?.includes('Network')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
      } else if (error.message?.includes('timeout')) {
        throw new Error('Connection timeout. Please check your internet connection and try again.');
      } else if (error.message?.includes('Invalid email')) {
        throw new Error('Please enter a valid email address.');
      } else if (error.message?.includes('Password should be at least')) {
        throw new Error('Password must be at least 6 characters.');
      } else if (error.message?.includes('User already registered')) {
        throw new Error('This email is already registered. Please try signing in instead.');
      } else {
        throw error;
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🚀 SignIn called with:', { email });
    
    // Enhanced validation with better error messages
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    try {
      console.log('🌐 Attempting to connect to Supabase...');
      console.log('📡 Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
      
      // Test connection first
      const { data: testData, error: testError } = await supabase.auth.getSession();
      if (testError && testError.message.includes('fetch')) {
        console.error('❌ Network connection test failed:', testError);
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
      }
      
      console.log('✅ Connection test passed, proceeding with signin...');
      
      // Add timeout for auth operations
      const authPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(t('onboarding.auth.errors.loginTimeout') || 'Login is taking too long. Please check your internet connection.')), 15000);
      });

      const { data, error } = await Promise.race([authPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ SignIn error:', error);
        
        // Provide more specific error messages
        if (error.message?.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message?.includes('Email not confirmed')) {
          throw new Error('Please verify your email address before signing in. Check your email for a verification link.');
        } else if (error.message?.includes('Too many requests')) {
          throw new Error('Too many login attempts. Please wait a moment and try again.');
        } else {
          throw error;
        }
      }

      // Detailed logging for debugging
      console.log('🔍 SignIn response data:', {
        user: data?.user ? {
          id: data.user.id,
          email: data.user.email,
          email_confirmed_at: data.user.email_confirmed_at,
          created_at: data.user.created_at
        } : null,
        session: data?.session ? 'exists' : 'null'
      });

      // Check if user's email is verified - this is CRITICAL for security
      if (data?.user) {
        if (!data.user.email_confirmed_at) {
          console.log('❌ SECURITY: User email not verified - email_confirmed_at:', data.user.email_confirmed_at);
          console.log('🚪 Signing out unverified user immediately...');
          // Sign out the user since they shouldn't be logged in
          await supabase.auth.signOut();
          throw new Error('Please verify your email address before signing in. Check your email for a verification link.');
        } else {
          console.log('✅ User email is verified - email_confirmed_at:', data.user.email_confirmed_at);
        }
      } else {
        console.log('❌ No user data returned from signin');
        throw new Error('Signin failed: No user data returned');
      }
      
      console.log('✅ SignIn successful!');
      
      // Load user profile to check if name exists
      if (data?.user) {
        console.log('🔄 Loading profile after successful signin...');
        await loadProfile(data.user.id);
      }
      
    } catch (error: any) {
      console.error('❌ SignIn failed:', error);
      throw error;
    }
  };

  // Debug function to check AsyncStorage contents
  const debugAsyncStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      console.log('🔍 DEBUG: All AsyncStorage keys:', keys);
      
      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          console.log(`🔍 DEBUG: ${key} = ${value ? value.substring(0, 100) + '...' : 'null'}`);
        } catch (error) {
          console.log(`🔍 DEBUG: ${key} = [error reading value]`);
        }
      }
    } catch (error) {
      console.error('❌ DEBUG: Error reading AsyncStorage:', error);
    }
  };

  const signOut = async (forceSignOut = false) => {
    console.log('🚪 Starting signOut process...');
    console.log('Current user before signout:', user?.id);
    console.log('Current session before signout:', session?.access_token ? 'exists' : 'null');
    
    // Smart protection - only protect if we have valid session and it's not forced
    if (!forceSignOut && isOnProtectedPage() && session && user) {
      console.log('🛡️ BLOCKED: Preventing signOut on protected page with valid session:', segments.join('/'));
      console.log('🛡️ If this signOut is intentional, call signOut(true)');
      return;
    }
    
    if (!forceSignOut && isOnProtectedPage() && (!session || !user)) {
      console.log('🧹 ALLOWING: SignOut on protected page - no valid session to protect');
    }
    
    // Debug AsyncStorage before cleanup
    console.log('🔍 DEBUG: AsyncStorage before signOut:');
    await debugAsyncStorage();
    
    try {
      // Try Supabase sign out first - this should clear the storage automatically
      console.log('🔄 Calling supabase.auth.signOut()...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Supabase SignOut error:', error);
        // Don't throw error immediately, try to clear local state anyway
      } else {
        console.log('✅ Successfully signed out from Supabase');
      }
      
      // Give Supabase a moment to clear its own storage
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (supabaseError) {
      console.error('❌ Supabase SignOut failed:', supabaseError);
      // Continue with local cleanup even if Supabase fails
    }
    
    // Always clear local state regardless of Supabase result
    try {
      console.log('🧹 Clearing local auth state...');
      setProfile(null);
      setSession(null);
      setUser(null);
      console.log('✅ Auth state cleared locally');
      
      // Force clear AsyncStorage - comprehensive cleanup
      try {
        const keys = await AsyncStorage.getAllKeys();
        console.log('🔍 All AsyncStorage keys before cleanup:', keys);
        
        // Comprehensive list of possible auth-related keys
        const authKeyPatterns = [
          'sb-eqaxmxbqqiuiwkhjwvvz-auth-token', // Specific token mentioned
          'supabase.auth.token', // Standard Supabase token key
          'supabase.auth.refresh_token', // Refresh token
          'supabase.auth.session', // Session data
          'supabase.auth.user', // User data
        ];
        
        // Find all keys that match auth patterns
        const authKeys = keys.filter(key => {
          // Check exact matches first
          if (authKeyPatterns.includes(key)) {
            return true;
          }
          
          // Check pattern matches
          return (
            key.includes('supabase') || 
            key.includes('auth') || 
            key.includes('sb-') ||
            key.includes('eqaxmxbqqiuiwkhjwvvz') ||
            (key.includes('sb-') && key.includes('-auth-token')) ||
            (key.includes('sb-') && key.includes('-refresh-token')) ||
            (key.includes('sb-') && key.includes('-session'))
          );
        });
        
        console.log('🎯 Found auth-related keys to remove:', authKeys);
        
        // Remove all auth-related keys (with protection)
        if (authKeys.length > 0) {
          await protectedAsyncStorage.multiRemove(authKeys);
          console.log('✅ AsyncStorage auth keys cleared:', authKeys);
        }
        
        // Also try to clear the entire AsyncStorage if needed (nuclear option)
        try {
          // Get all remaining keys after cleanup
          const remainingKeys = await AsyncStorage.getAllKeys();
          console.log('🔍 Remaining keys after cleanup:', remainingKeys);
          
          // Check if any auth-related keys still exist
          const stillHasAuthKeys = remainingKeys.some(key => 
            key.includes('supabase') || 
            key.includes('auth') || 
            key.includes('sb-') ||
            key.includes('eqaxmxbqqiuiwkhjwvvz')
          );
          
          if (stillHasAuthKeys) {
            console.warn('⚠️ Auth keys still exist after cleanup, attempting individual removal...');
            
            // Try to remove each remaining auth key individually
            for (const key of remainingKeys) {
              if (key.includes('supabase') || key.includes('auth') || key.includes('sb-') || key.includes('eqaxmxbqqiuiwkhjwvvz')) {
                try {
                  await protectedAsyncStorage.removeItem(key);
                  console.log(`✅ Removed individual key: ${key}`);
                } catch (individualError) {
                  console.error(`❌ Failed to remove individual key ${key}:`, individualError);
                }
              }
            }
          }
          
          // Final verification
          const finalKeys = await AsyncStorage.getAllKeys();
          const finalAuthKeys = finalKeys.filter(key => 
            key.includes('supabase') || 
            key.includes('auth') || 
            key.includes('sb-') ||
            key.includes('eqaxmxbqqiuiwkhjwvvz')
          );
          
          if (finalAuthKeys.length === 0) {
            console.log('✅ All auth tokens successfully removed');
          } else {
            console.warn('⚠️ Some auth keys may still exist:', finalAuthKeys);
            
            // Nuclear option: Clear ALL AsyncStorage if auth keys persist
            console.log('🚨 Auth keys persist, attempting complete AsyncStorage clear...');
            try {
              await protectedAsyncStorage.clear();
              console.log('✅ Complete AsyncStorage cleared');
            } catch (clearError) {
              console.error('❌ Failed to clear AsyncStorage completely:', clearError);
            }
          }
          
        } catch (verificationError) {
          console.error('❌ Error during verification:', verificationError);
        }
        
      } catch (storageError) {
        console.warn('⚠️ Could not clear AsyncStorage:', storageError);
      }
      
      console.log('✅ Sign out process completed');
      
      // Debug AsyncStorage after cleanup
      console.log('🔍 DEBUG: AsyncStorage after signOut:');
      await debugAsyncStorage();
      
    } catch (localError) {
      console.error('❌ Local cleanup failed:', localError);
      throw localError;
    }
  };

  const updateProfile = async (updates: Partial<Pick<Profile, 'name' | 'birth_date' | 'avatar_url' | 'role' | 'interests' | 'company_ID' | 'phone_num'>>) => {
    console.log('🚀 updateProfile function called');
    console.log('🚀 Updates received:', updates);
    
    if (!user) {
      console.error('❌ No user logged in');
      throw new Error('No user logged in');
    }
    if (!session?.access_token) {
      console.error('❌ No valid session found');
      throw new Error('No valid session found');
    }

    console.log('📝 updateProfile called with updates:', updates);
    console.log('📝 User ID:', user.id);
    console.log('📝 Session available:', !!session);
    console.log('📝 Session token length:', session?.access_token?.length || 0);
    console.log('📝 Supabase client available:', !!supabase);

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    console.log('📝 Update data being sent:', updateData);
    console.log('📝 Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
    console.log('📝 Supabase Key available:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

    // Use Supabase client with proper authentication
    try {
      console.log('🚀 Using Supabase client with session authentication...');
      
      // First, check if profile exists
      console.log('🔍 Checking if profile exists for user:', user.id);
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      console.log('🔍 Profile existence check result:');
      console.log('🔍 - existingProfile:', existingProfile);
      console.log('🔍 - checkError:', checkError);
      console.log('🔍 - checkError code:', checkError?.code);
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking profile existence:', checkError);
        throw new Error(`Failed to check profile: ${checkError.message}`);
      }
      
      let data, error;
      
      if (existingProfile) {
        // Profile exists, update it
        console.log('📝 Profile exists, updating...');
        console.log('📝 Update data:', updateData);
        const updateResult = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id)
          .select();
        data = updateResult.data;
        error = updateResult.error;
        console.log('📝 Update result - data:', data);
        console.log('📝 Update result - error:', error);
      } else {
        // Profile doesn't exist, create it
        console.log('📝 Profile doesn\'t exist, creating new profile...');
        const createData = {
          id: user.id,
          ...updateData,
          created_at: new Date().toISOString(),
        };
        console.log('📝 Create data:', createData);
        const createResult = await supabase
          .from('profiles')
          .insert([createData])
          .select();
        data = createResult.data;
        error = createResult.error;
        console.log('📝 Create result - data:', data);
        console.log('📝 Create result - error:', error);
      }

      if (error) {
        console.error('❌ Supabase update error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // Provide specific error messages for common issues
        if (error.message?.includes('fetch failed') || error.message?.includes('TypeError: fetch failed')) {
          throw new Error('Unable to connect to the server. Please check your internet connection and try again. If the problem persists, the server might be temporarily unavailable.');
        } else if (error.message?.includes('JWT') || error.message?.includes('user_not_found')) {
          throw new Error('Authentication error. Please try signing in again.');
        } else if (error.message?.includes('duplicate key')) {
          throw new Error('Profile already exists. Please try refreshing the page.');
        } else {
          throw error;
        }
      }

      console.log('✅ Profile updated successfully:', data);
      console.log('✅ Updated profile data:', JSON.stringify(data, null, 2));
      
      // Reload profile to get updated data
      await loadProfile(user.id);
      return data;
      
    } catch (error: any) {
      console.error('❌ Profile update failed:', error);
      
      // If Supabase client fails, try direct fetch with session token
      try {
        console.log('🔄 Falling back to direct fetch with session token...');
        
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Supabase configuration missing');
        }
        
        const fetchUrl = `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`;
        console.log('🌐 Fetch URL:', fetchUrl);
        
        const response = await fetch(fetchUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': supabaseAnonKey,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(updateData)
        });
        
        console.log('🌐 Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ HTTP Error Response:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: errorText
          });
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ Profile updated successfully via fetch:', data);
        await loadProfile(user.id);
        return data;
        
      } catch (fetchError: any) {
        console.error('❌ Direct fetch fallback also failed:', fetchError);
        
        // Provide specific error messages for connectivity issues
        if (fetchError.message?.includes('fetch failed') || fetchError.message?.includes('TypeError: fetch failed')) {
          throw new Error('Unable to connect to the server. Please check your internet connection and try again. If the problem persists, the server might be temporarily unavailable.');
        } else if (fetchError.message?.includes('Failed to fetch')) {
          throw new Error('Network connection failed. Please check your internet connection and try again.');
        } else {
          throw new Error(`Profile update failed: ${error.message}. Fallback error: ${fetchError.message}`);
        }
      }
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};