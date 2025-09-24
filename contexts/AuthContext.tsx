import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Load user profile
  const loadProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      setProfile(profileData || null);
    } catch (error) {
      console.error('Error loading profile:', error);
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
          const fallbackProfileData = {
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
          const fallbackProfileData = {
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
          if (companyId && companyId.trim()) {
            fallbackProfileData.company_id = companyId.trim();
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
    
    const loadInitialData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error loading initial auth data:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('🔄 Auth state change:', event, 'User ID:', session?.user?.id);
      console.log('Session exists:', !!session);
      console.log('User exists:', !!session?.user);
      
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        console.log('👤 User logged in, checking email verification...');
        
        // Check if we're in the middle of signup verification
        const isVerifyingSignup = await AsyncStorage.getItem('is_verifying_signup');
        if (isVerifyingSignup === 'true') {
          console.log('🔄 Signup verification in progress, skipping profile loading...');
          return; // Exit early, don't proceed with profile loading
        }
        
        // CRITICAL SECURITY CHECK: Block unverified users
        if (!session.user.email_confirmed_at) {
          console.log('❌ SECURITY: Unverified user detected in auth state change');
          console.log('🚪 Signing out unverified user immediately...');
          await supabase.auth.signOut();
          return; // Exit early, don't proceed with profile loading
        }
        
        console.log('✅ User email is verified, proceeding with profile loading...');
        await loadProfile(session.user.id);
        
        // If no profile exists and user is verified, create one
        if (!profile && session.user.email_confirmed_at) {
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
          } catch (profileError) {
            console.error('❌ Failed to create default profile:', profileError);
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
    } catch (error: any) {
      console.error('❌ SignIn failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('🚪 Starting signOut process...');
    console.log('Current user before signout:', user?.id);
    console.log('Current session before signout:', session?.access_token ? 'exists' : 'null');
    
    try {
      // Try Supabase sign out first
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Supabase SignOut error:', error);
        // Don't throw error immediately, try to clear local state anyway
      } else {
        console.log('✅ Successfully signed out from Supabase');
      }
      
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
      
      // Force clear AsyncStorage
      try {
        const keys = await AsyncStorage.getAllKeys();
        const authKeys = keys.filter(key => key.includes('supabase') || key.includes('auth'));
        if (authKeys.length > 0) {
          await AsyncStorage.multiRemove(authKeys);
          console.log('✅ AsyncStorage auth keys cleared:', authKeys);
        }
      } catch (storageError) {
        console.warn('⚠️ Could not clear AsyncStorage:', storageError);
      }
      
      console.log('✅ Sign out process completed');
      
    } catch (localError) {
      console.error('❌ Local cleanup failed:', localError);
      throw localError;
    }
  };

  const updateProfile = async (updates: Partial<Pick<Profile, 'name' | 'birth_date' | 'avatar_url' | 'role' | 'interests'>>) => {
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) throw error;

    await loadProfile(user.id);
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