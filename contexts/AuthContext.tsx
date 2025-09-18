import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

interface Profile {
  id: string;
  name: string;
  birth_date?: string;
  avatar_url?: string;
  role?: string;
  interests?: string[];
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, birthDate?: string, role?: string, interests?: string[]) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<Profile, 'name' | 'birth_date' | 'avatar_url' | 'role' | 'interests'>>) => Promise<void>;
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

  const createProfile = async (user: User, fullName: string, birthDate?: string, role?: string, interests?: string[]) => {
    try {
      console.log('createProfile called with fullName:', fullName, 'birthDate:', birthDate, 'role:', role, 'interests:', interests);
      const profileName = fullName && fullName.trim() ? fullName.trim() : 'Family Member';
      
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

      console.log('Final profile data to insert:', profileData);

      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        console.error('Error details:', error.message, error.code, error.details);
        throw error;
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
      
      console.log('Auth state change:', event, 'User ID:', session?.user?.id);
      
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
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

  const signUp = async (email: string, password: string, fullName: string, birthDate?: string, role?: string, interests?: string[]) => {
    console.log('SignUp called with:', { email, fullName, birthDate, role, interests });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      console.log('User created successfully:', data.user.id);
      
      // Wait a moment for the database trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check and ensure profile exists (database trigger should have created it)
      try {
        let profile = null;
        let retries = 0;
        const maxRetries = 3;
        
        // Retry logic to wait for profile creation
        while (!profile && retries < maxRetries) {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();
          
          profile = existingProfile;
          
          if (!profile) {
            retries++;
            console.log(`Profile not found, retry ${retries}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (!profile) {
          console.log('Database trigger failed, creating profile manually for user:', data.user.id);
          await createProfile(data.user, fullName, birthDate, role, interests);
        } else {
          console.log('Profile found for user:', data.user.id);
          // Update profile with additional onboarding data if provided
          if (birthDate || role || interests) {
            const updates: any = {};
            if (birthDate) updates.birth_date = birthDate;
            if (role) updates.role = role;
            if (interests && interests.length > 0) updates.interests = interests;
            
            if (Object.keys(updates).length > 0) {
              console.log('Updating profile with onboarding data:', updates);
              await updateProfile(updates);
            }
          }
        }
      } catch (profileError) {
        console.error('Profile handling failed:', profileError);
        
        // Show the actual error to help debug
        const errorMessage = profileError instanceof Error ? profileError.message : 'Unknown error';
        console.error('Detailed error:', errorMessage);
        
        // Don't sign out the user, but throw error to show in UI
        throw new Error(`Profile setup failed: ${errorMessage}. Your account was created, but there was an issue setting up your profile. Please try signing in.`);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    // Enhanced validation with better error messages
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Add timeout for auth operations
    const authPromise = supabase.auth.signInWithPassword({
      email,
      password,
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(t('onboarding.auth.errors.loginTimeout') || 'Login is taking too long. Please check your internet connection.')), 15000);
    });

    const { error } = await Promise.race([authPromise, timeoutPromise]) as any;

    if (error) throw error;
  };

  const signOut = async () => {
    console.log('Starting signOut process...');
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('SignOut error:', error);
      throw error;
    }

    console.log('Successfully signed out from Supabase');
    setProfile(null);
    setSession(null);
    setUser(null);
    console.log('Auth state cleared');
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