import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  name: string;
  birth_date?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<Profile, 'name' | 'birth_date' | 'avatar_url'>>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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

  const createProfile = async (user: User, fullName: string) => {
    try {
      console.log('createProfile called with fullName:', fullName);
      const profileName = fullName && fullName.trim() ? fullName.trim() : 'Family Member';
      
      console.log('Creating profile for user:', user.id, 'with name:', profileName);

      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            name: profileName,
            avatar_url: null,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      } else {
        console.log('Profile created successfully:', data);
        await loadProfile(user.id);
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

  const signUp = async (email: string, password: string, fullName: string) => {
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
      try {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!existingProfile) {
          await createProfile(data.user, fullName);
        } else {
          console.log('Profile already exists for user:', data.user.id);
        }
      } catch (profileError) {
        console.error('Profile creation failed:', profileError);
        
        // Show the actual error to help debug
        const errorMessage = profileError instanceof Error ? profileError.message : 'Unknown error';
        console.error('Detailed error:', errorMessage);
        
        try {
          await supabase.auth.signOut();
        } catch (cleanupError) {
          console.error('Failed to cleanup after profile creation failure:', cleanupError);
        }
        throw new Error(`Profile creation failed: ${errorMessage}. Please try again or contact support.`);
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
      setTimeout(() => reject(new Error('Anmeldung dauert zu lange. Bitte überprüfen Sie Ihre Internetverbindung.')), 15000);
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

  const updateProfile = async (updates: Partial<Pick<Profile, 'name' | 'birth_date' | 'avatar_url'>>) => {
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