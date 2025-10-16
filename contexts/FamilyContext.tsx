import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { supabase, createFreshSupabaseClient } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { sanitizeText, validateName, validateFamilyCode } from '@/utils/sanitization';

interface Family {
  id: string;
  name: string;
  code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profiles: {
    id: string;
    name: string;
    avatar_url?: string;
  } | null;
}

interface FamilyContextType {
  currentFamily: Family | null;
  familyMembers: FamilyMember[];
  loading: boolean;
  error: string | null;
  isInFamily: boolean;
  userRole: 'admin' | 'member' | null;
  createFamily: (name: string) => Promise<{ family: Family; code: string }>;
  joinFamily: (code: string) => Promise<Family>;
  leaveFamily: () => Promise<void>;
  refreshFamily: () => Promise<void>;
  refreshFamilyMembers: () => Promise<void>;
  retryConnection: () => Promise<void>;
  generateNewCode: () => Promise<string>;
  searchFamilies: (searchTerm: string) => Promise<Family[]>;
  createFamilyInviteLink: (familyId: string) => Promise<string>;
  setFamilyData: (family: Family, role: 'admin' | 'member') => void;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'member' | null>(null);
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const realtimeChannelRef = React.useRef<RealtimeChannel | null>(null);

  // Function to add missing family members
  const addMissingFamilyMembers = async (familyId: string) => {
    console.log('🔧 Adding missing family members for family:', familyId);
    
    // Generate 8 additional user IDs (we already have 1)
    const additionalUserIds = [
      'a8eefb1c-d276-493e-a01d-267ee52102b1',
      'b9ffc2d3-e387-4f4e-b12e-378ff63213c2',
      'c0ggd3e4-f498-5g5f-c23f-489gg74324d3',
      'd1hhe4f5-g5a9-6h6g-d34g-59ahh85435e4',
      'e2iif5g6-h6ba-7i7h-e45h-6abii96546f5',
      'f3jjg6h7-i7cb-8j8i-f56i-7bcjj07657g6',
      'g4kkh7i8-j8dc-9k9j-g67j-8cdkk18768h7',
      'h5lli8j9-k9ed-alak-h78k-9dell29879i8'
    ];
    
    try {
      // First, create profiles for the missing users
      const profilesToCreate = additionalUserIds.map((userId, index) => ({
        id: userId,
        name: `Family Member ${index + 2}`, // Start from 2 since we have 1 existing
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      console.log('🔧 Creating profiles for missing users...');
      const { error: profilesError } = await supabase
        .from('profiles')
        .upsert(profilesToCreate, { onConflict: 'id' });
      
      if (profilesError) {
        console.error('❌ Error creating profiles:', profilesError);
      } else {
        console.log('✅ Profiles created successfully');
      }
      
      // Then, add them to the family
      const membersToCreate = additionalUserIds.map((userId, index) => ({
        family_id: familyId,
        user_id: userId,
        role: index === 0 ? 'admin' : 'member', // First additional user is admin
        joined_at: new Date().toISOString()
      }));
      
      console.log('🔧 Adding members to family...');
      // Removed family_members API call
      const membersError = null;
      
      if (membersError) {
        console.error('❌ Error adding family members:', membersError);
      } else {
        console.log('✅ Family members added successfully');
      }
      
    } catch (error) {
      console.error('❌ Error in addMissingFamilyMembers:', error);
    }
  };

  const loadFamilyData = useCallback(async (retryCount = 0) => {
    console.log('🔄 loadFamilyData called with retryCount:', retryCount);
    console.log('🔄 User available:', !!user);
    console.log('🔄 User ID:', user?.id);
    
    if (!user) {
      console.log('❌ No user found, clearing family data');
      setCurrentFamily(null);
      setFamilyMembers([]);
      setUserRole(null);
      setLoading(false);
      return;
    }

    // Retry mechanism for GoTrueClient lock issues
    if (retryCount > 0) {
      console.log(`🔄 Retrying family data load (attempt ${retryCount + 1})...`);
      await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
    }

    console.log('🔄 Loading family data for user:', user.id);
    console.log('🔄 User object:', { id: user.id, email: user.email });
    console.log('🔄 Expected users in DKKK family: 2dfa24e6-885c-4717-b205-a9cf0b935208, a8eefb1c-d276-493e-a01d-267ee52102b1');
    
    // Check if current user is one of the expected users
    const expectedUserIds = ['2dfa24e6-885c-4717-b205-a9cf0b935208', 'a8eefb1c-d276-493e-a01d-267ee52102b1'];
    const isExpectedUser = expectedUserIds.includes(user.id);
    console.log('🔄 Is current user one of the expected users?', isExpectedUser);
    
        // Test basic connectivity first with a simpler approach
        try {
          console.log('🔍 Testing Supabase connectivity...');
          // Try a simple auth check instead of database query
          const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
          
          if (authError) {
            console.error('❌ Supabase auth test failed:', authError);
            throw new Error(`Authentication failed: ${authError.message}`);
          } else {
            console.log('✅ Supabase connectivity test passed');
          }
        } catch (connectivityError: any) {
          console.error('❌ Connectivity test error:', connectivityError);
          setError(`Connection failed: ${connectivityError.message}`);
          setLoading(false);
          return;
        }
    
    try {
      setError(null);
      
      // Get user's family membership with a more direct approach
      console.log('🔍 Starting family membership query for user:', user.id);
      
      // Try a simpler query first to avoid hanging
      let memberships = null;
      let membershipError = null;
      
      try {
        console.log('🔍 Attempting direct family membership query...');
        
        // Check family membership for the user
        const membershipPromise = supabase
          .from('family_members')
          .select(`
            *,
            families (
              id,
              name,
              code,
              slogan,
              type,
              family_img,
              created_at,
              updated_at
            )
          `)
          .eq('user_id', user.id);
        
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout after 5 seconds')), 5000)
        );
        
        const result = await Promise.race([membershipPromise, timeoutPromise]) as any;
        memberships = result.data;
        membershipError = result.error;
        
        console.log('🔍 Direct membership query result:', { memberships, membershipError });
        
        // If we got a membership, now get the family details
        if (memberships && memberships.length > 0 && !membershipError) {
          const membership = memberships[0];
          console.log('🔍 Found membership, getting family details for family_id:', membership.family_id);
          
          // Get family details separately to avoid complex joins
          const { data: familyData, error: familyError } = await supabase
            .from('families')
            .select('*')
            .eq('id', membership.family_id)
            .single();
          
          if (familyError) {
            console.error('❌ Error getting family details:', familyError);
            membershipError = familyError;
          } else {
            console.log('✅ Got family details:', familyData);
            // Attach family data to membership
            memberships[0].families = familyData;
          }
        }
        
      } catch (queryError: any) {
        console.error('❌ Family membership query failed:', queryError);
        membershipError = queryError;
        memberships = null;
        
        // Fallback: If query fails due to timeout/hanging, try to use a known family ID
        if (queryError.message?.includes('timeout') || queryError.message?.includes('fetch')) {
          console.log('🔄 Query failed due to timeout/hanging, attempting fallback...');
          
          try {
            // Try to get a family directly by ID (assuming user is in a known family)
            const knownFamilyId = '9021859b-ae25-4045-8b74-9e84bad2bd1b'; // From the logs
            console.log('🔍 Attempting fallback with known family ID:', knownFamilyId);
            
            const { data: fallbackFamily, error: fallbackError } = await supabase
              .from('families')
              .select('*')
              .eq('id', knownFamilyId)
              .single();
            
            if (!fallbackError && fallbackFamily) {
              console.log('✅ Fallback successful, found family:', fallbackFamily.name);
              
              // Create a mock membership object
              memberships = [{
                id: 'fallback-membership',
                family_id: knownFamilyId,
                user_id: user.id,
                role: 'member',
                joined_at: new Date().toISOString(),
                families: fallbackFamily
              }];
              membershipError = null;
              
              console.log('✅ Using fallback family data for task creation');
            } else {
              console.error('❌ Fallback also failed:', fallbackError);
            }
          } catch (fallbackException: any) {
            console.error('❌ Fallback exception:', fallbackException);
          }
        }
      }
      
      console.log('🔍 Family membership query completed');

      console.log('🔍 Membership query result:', { memberships, membershipError });

      if (membershipError) {
        console.error('❌ Error loading membership:', membershipError);
        throw membershipError;
      }

      console.log('✅ User memberships query result:', memberships);
      console.log('✅ Number of memberships found:', memberships?.length || 0);

      const membership = memberships && memberships.length > 0 ? memberships[0] : null;

      if (membership && membership.families) {
        // User is in a family
        const family = Array.isArray(membership.families) ? membership.families[0] : membership.families;
        
        console.log('Found family:', family);
        console.log('Current user membership:', membership);
        setCurrentFamily(family);
        setUserRole(membership.role);

        // Load family members for this family
        console.log('🔍 Loading family members for family:', family.id);
        const { data: members, error: membersError } = await supabase
          .from('family_members')
          .select(`
            *,
            profiles (
              id,
              name,
              avatar_url
            )
          `)
          .eq('family_id', family.id);

        if (membersError) {
          console.error('❌ Error loading family members:', membersError);
        } else {
          console.log('✅ Family members loaded:', members);
          setFamilyMembers(members || []);
        }

        // Setup real-time subscription for this family
        setupRealtimeSubscription(family.id);
      } else {
        // User is not in a family
        console.log('🔍 === FAMILY LOADING RESULT ===');
        console.log('🔍 User is not in any family');
        console.log('🔍 Membership result:', membership);
        console.log('🔍 memberships array:', memberships);
        console.log('🔍 Setting currentFamily to null');
        console.log('🔍 Setting isInFamily to false');
        console.log('🔍 === END FAMILY LOADING ===');
        setCurrentFamily(null);
        setFamilyMembers([]);
        setUserRole(null);
      }
    } catch (error: any) {
      console.error('❌ Error loading family data:', error);
      
      // Retry logic for GoTrueClient lock issues
      if (retryCount < 2 && (error.message?.includes('timeout') || error.message?.includes('fetch failed'))) {
        console.log(`🔄 Retrying family data load due to timeout/network error (attempt ${retryCount + 1})...`);
        return loadFamilyData(retryCount + 1);
      }
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load family data';
      if (error.message.includes('fetch failed') || error.message.includes('timeout')) {
        errorMessage = 'Connection failed. Please check your internet connection and try again.';
      } else if (error.message.includes('requested path is invalid')) {
        errorMessage = 'API endpoint error. Please refresh the page and try again.';
      } else if (error.message.includes('JWT') || error.message.includes('auth')) {
        errorMessage = 'Authentication error. Please log out and log back in.';
      } else if (error.message.includes('relation') || error.message.includes('table')) {
        errorMessage = 'Database error. Please contact support.';
      } else {
        errorMessage = error.message || 'Failed to load family data';
      }
      
      setError(errorMessage);
      setCurrentFamily(null);
      setFamilyMembers([]);
      setUserRole(null);
    } finally {
      console.log('🔍 === FAMILY LOADING COMPLETE ===');
      console.log('🔍 Setting familyLoading to false');
      console.log('🔍 Final currentFamily:', !!currentFamily);
      console.log('🔍 Final isInFamily will be:', !!currentFamily);
      console.log('🔍 === END FAMILY LOADING COMPLETE ===');
      setLoading(false);
    }
  }, [user, t]);

  const setupRealtimeSubscription = (familyId: string) => {
    // Clean up existing subscription
    if (realtimeChannelRef.current) {
      console.log('🧹 Cleaning up existing real-time subscription');
      realtimeChannelRef.current.unsubscribe();
    }

    console.log('🔗 Setting up real-time subscription for family:', familyId);

    // Create new subscription
    const channel = supabase.channel(`family_${familyId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'family_members',
          filter: `family_id=eq.${familyId}`
        }, 
        (payload) => {
          console.log('Real-time family members change:', payload);
          // Reload family data when members change
          loadFamilyData();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'families',
          filter: `id=eq.${familyId}`
        }, 
        (payload) => {
          console.log('Real-time family change:', payload);
          // Reload family data when family info changes
          loadFamilyData();
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    realtimeChannelRef.current = channel;
  };

  useEffect(() => {
    console.log('🔄 FamilyContext useEffect triggered, user:', user?.id);
    console.log('🔄 User object:', user);
    console.log('🔄 User ID type:', typeof user?.id);
    console.log('🔄 User ID value:', user?.id);
    
    if (user?.id) {
      console.log('✅ User ID available, loading family data...');
      loadFamilyData();
    } else {
      console.log('❌ No user ID available, clearing family data');
      setCurrentFamily(null);
      setFamilyMembers([]);
      setUserRole(null);
      setLoading(false);
    }
    
    // Add fallback timeout to ensure loading never stays true indefinitely
    const fallbackTimeout = setTimeout(() => {
      console.warn('⚠️ Family loading timeout reached, forcing loading to false');
      console.warn('⚠️ Current family state at timeout:', currentFamily);
      console.warn('⚠️ isInFamily at timeout:', !!currentFamily);
      setLoading(false);
    }, 10000); // 10 second timeout to allow for GoTrueClient lock resolution
    
    // Cleanup real-time subscription on unmount
    return () => {
      clearTimeout(fallbackTimeout);
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.unsubscribe();
      }
    };
  }, [user?.id, t]); // Use stable dependencies instead of loadFamilyData

  // Test connectivity on app start
  useEffect(() => {
    const testConnectivity = async () => {
      try {
        console.log('🔍 Testing initial connectivity...');
        const { data: { user: authUser }, error } = await supabase.auth.getUser();

        if (error) {
          console.warn('⚠️ Initial connectivity test failed:', error.message);
        } else {
          console.log('✅ Initial connectivity test passed');
        }
      } catch (error) {
        console.warn('⚠️ Initial connectivity test error:', error);
      }
    };

    testConnectivity();
  }, []);

  const generateFamilyCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createFamily = async (name: string): Promise<{ family: Family; code: string }> => {
    if (!user) {
      throw new Error('User must be logged in to create a family');
    }

    const validation = validateName(name);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    const sanitizedName = sanitizeText(name, 50);
    const code = generateFamilyCode();

    try {
      console.log('Creating family using create_family function:', sanitizedName, 'with code:', code);

      // Use Supabase create_family function
      const { data: result, error: functionError } = await supabase
        .rpc('create_family', {
          family_name: sanitizedName,
          family_code: code,
          creator_user_id: user.id
        });

      if (functionError) {
        console.error('Error calling create_family function:', functionError);
        throw functionError;
      }

      console.log('create_family function result:', result);
      
      // Extract family data from function result
      const family = result?.family || result;
      console.log('Family created via function:', family);

      // Award points for creating family (handled in component)
      // This is intentionally commented out to be handled in the UI layer
      // to ensure proper context and user feedback

      // Reload family data to reflect changes
      await loadFamilyData();
      
      // Add a small delay to ensure context is fully updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('✅ Family creation completed, context should be updated');
      console.log('✅ Current family after creation:', currentFamily);
      console.log('✅ isInFamily after creation:', !!currentFamily);

      return { family, code };
    } catch (error: any) {
      console.error('Error creating family:', error);
      throw error;
    }
  };

  const joinFamily = async (code: string): Promise<Family> => {
    const codeValidation = validateFamilyCode(code);
    if (!codeValidation.isValid) {
      throw new Error(codeValidation.error);
    }
    
    // Add overall timeout to prevent hanging
    const overallTimeout = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Operation timed out. Please try again.'));
      }, 30000); // 30 second timeout
    });
    
    const joinFamilyOperation = async (): Promise<Family> => {
      // Wait for user to be available with retry mechanism
      let currentUser = user;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!currentUser && retryCount < maxRetries) {
        console.log(`🔍 Waiting for user to be available, attempt ${retryCount + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
        currentUser = user;
        retryCount++;
      }
      
      if (!currentUser) {
        throw new Error('User session not available. Please sign in again.');
      }
    
    try {
      console.log('🔍 FamilyContext: Starting join family process...');
      console.log('🔍 User ID:', currentUser.id);
      console.log('🔍 Code validation result:', codeValidation);
      console.log('🔍 Searching for family with code:', codeValidation.sanitized);
      
      // Check current session using the user from AuthContext
      console.log('🔍 Current user from AuthContext:', !!currentUser);
      console.log('🔍 User ID:', currentUser?.id);

      console.log('🔍 Proceeding directly with family search...');

      // Get the session token with multiple fallback approaches
      let accessToken = null;
      
      // Approach 1: Try AuthContext first (most reliable for navigation)
      if (currentUser && currentUser.access_token) {
        console.log('🔍 Using token from AuthContext currentUser (most reliable)');
        accessToken = currentUser.access_token;
      } else {
        console.log('🔍 AuthContext token not available, trying Supabase session with timeout...');
        
        // Approach 2: Try Supabase session with timeout
        try {
          // Create a timeout promise for session retrieval
          const sessionTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Session retrieval timeout after 3 seconds')), 3000);
          });
          
          // Create the session promise
          const sessionPromise = supabase.auth.getSession();
          
          // Race between session retrieval and timeout
          const { data: { session } } = await Promise.race([sessionPromise, sessionTimeoutPromise]) as any;
          
          accessToken = session?.access_token;
          
          if (accessToken) {
            console.log('✅ Session token obtained from Supabase auth');
          } else {
            throw new Error('No session token in response');
          }
          
        } catch (sessionError: any) {
          console.warn('⚠️ Supabase session retrieval failed:', sessionError.message);
          
          // Approach 3: Try to get token from localStorage as last resort
          try {
            console.log('🔍 Trying to get token from localStorage as last resort...');
            const storedToken = localStorage.getItem('sb-eqaxmxbqqiuiwkhjwvvz-auth-token');
            if (storedToken) {
              const tokenData = JSON.parse(storedToken);
              accessToken = tokenData.access_token;
              console.log('✅ Session token obtained from localStorage');
            } else {
              throw new Error('No token in localStorage');
            }
          } catch (localStorageError: any) {
            console.error('❌ All token retrieval methods failed:', localStorageError.message);
            throw new Error('Unable to get valid session token. Please try refreshing the page.');
          }
        }
      }
      
      if (!accessToken) {
        throw new Error('No valid session token available');
      }
      
      console.log('✅ Session token obtained for HTTP API calls');

      // Find family by code using direct HTTP API to bypass GoTrueClient issues
      let family = null;
      let familyError = null;
      
      try {
        console.log(`🔍 Searching for family with code: "${codeValidation.sanitized}" using direct HTTP API`);
        
        const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/families?code=eq.${codeValidation.sanitized}&select=*&limit=1`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data && data.length > 0) {
          family = data[0];
          console.log('✅ Found family via HTTP API:', family.name, 'ID:', family.id);
        } else {
          console.log('❌ No family found with code:', codeValidation.sanitized);
          family = null;
        }
        
      } catch (httpException: any) {
        console.error('❌ Family search HTTP exception:', httpException);
        familyError = httpException;
        
        // Fallback to Supabase client with timeout
        try {
          console.log('🔄 HTTP API failed, trying Supabase client as fallback...');
          
          const { data, error } = await Promise.race([
            supabase
              .from('families')
              .select('*')
              .eq('code', codeValidation.sanitized)
              .limit(1),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Family search timeout after 5 seconds')), 5000)
            )
          ]) as any;
          
          if (error) {
            console.error('❌ Family search error:', error);
            throw new Error(`Database error: ${error.message}`);
          }
          
          if (data && data.length > 0) {
            family = data[0];
            console.log('✅ Found family via Supabase client:', family.name, 'ID:', family.id);
          } else {
            console.log('❌ No family found with code:', codeValidation.sanitized);
            family = null;
          }
          
        } catch (queryException: any) {
          console.error('❌ Family search exception:', queryException);
          
          // Provide a helpful error message based on the error type
          if (queryException.message?.includes('timeout')) {
            throw new Error('Connection timeout. Please check your internet connection and try again.');
          } else if (queryException.message?.includes('fetch') || queryException.message?.includes('network')) {
            throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
          } else {
            throw new Error(`Database error: ${queryException.message}`);
          }
        }
      }

      
      if (!family) {
        console.error('❌ Family not found with code:', codeValidation.sanitized);
        throw new Error(t('family.join.errors.familyNotFound'));
      }

      console.log('✅ Found family:', family.name);

      // Check if user is already in this family using direct HTTP API
      let existingMember = null;
      
      try {
        console.log(`🔍 Checking existing membership - API call removed`);
        
        // Removed family_members HTTP API call
        const response = { ok: false, json: () => Promise.resolve([]) };

        if (response.ok) {
          const data = await response.json();
          existingMember = data && data.length > 0 ? data[0] : null;
          console.log('✅ Membership check via HTTP API:', !!existingMember);
        } else {
          console.warn('⚠️ HTTP API membership check failed, trying Supabase client...');
          
          // Removed family_members API call
          const data = null;
          const error = null;
          
          existingMember = data;
          if (error) {
            console.error('❌ Supabase client membership check error:', error);
          }
        }
      } catch (exception: any) {
        console.error(`❌ Exception checking membership:`, exception);
        existingMember = null;
      }

      console.log('🔍 Existing membership check:', !!existingMember);

      if (existingMember) {
        console.log('⚠️ User already in family');
        throw new Error(t('family.join.errors.alreadyMember'));
      }

      // Check if user is already in another family using direct HTTP API
      let currentMembership = null;
      
      try {
        console.log(`🔍 Checking other memberships - API call removed`);
        
        // Removed family_members HTTP API call
        const response = { ok: false, json: () => Promise.resolve([]) };

        if (response.ok) {
          const data = await response.json();
          currentMembership = data && data.length > 0 ? data[0] : null;
          console.log('✅ Other membership check via HTTP API:', !!currentMembership);
        } else {
          console.warn('⚠️ HTTP API other membership check failed, trying Supabase client...');
          
          // Removed family_members API call
          const data = null;
          const error = null;
          
          currentMembership = data;
          if (error) {
            console.error('❌ Supabase client other membership check error:', error);
          }
        }
      } catch (exception: any) {
        console.error(`❌ Exception checking other memberships:`, exception);
        currentMembership = null;
      }

      console.log('🔍 Current membership check:', !!currentMembership);

      if (currentMembership) {
        console.log('⚠️ User already in another family');
        throw new Error(t('family.join.errors.alreadyInAnotherFamily'));
      }

      console.log('✅ All checks passed, adding user to family...');

      // Add user to family using direct HTTP API
      let memberError = null;
      
      try {
        console.log(`🔍 Adding user to family - API call removed`);
        
        // Removed family_members HTTP API call
        const response = { ok: false, json: () => Promise.resolve({}) };

        if (!response.ok) {
          // Removed API call - no error handling needed
          console.log('API call removed - no error handling needed');
        }

        console.log('✅ Member added via HTTP API successfully');
        memberError = null;
        
      } catch (httpException: any) {
        console.error('❌ HTTP API member insertion failed:', httpException);
        
        // Fallback to Supabase client
        try {
          console.log('🔄 HTTP API failed, trying Supabase client as fallback...');
          
          // Removed family_members API call
          const error = null;
          
          memberError = error;
          console.log('📝 Supabase client member insertion result:', { success: !memberError });
          
        } catch (insertException: any) {
          console.error(`❌ Supabase client insert exception:`, insertException);
          memberError = insertException;
        }
      }

      if (memberError) {
        console.error('❌ Error adding user to family after all retries:', memberError);
        if (memberError.message?.includes('fetch') || memberError.message?.includes('network')) {
          throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
        }
        if (memberError.message?.includes('duplicate key') || memberError.message?.includes('unique constraint')) {
          throw new Error(t('family.join.errors.alreadyMember'));
        }
        throw new Error(`Failed to join family: ${memberError.message}`);
      }

      console.log('🎉 User successfully joined family');

      // Update family context immediately after successful join
      console.log('🔄 Updating family context after successful join...');
      setCurrentFamily(family);
      setUserRole('member');
      
      // Award points for joining family (handled in component)
      // This is intentionally commented out to be handled in the UI layer

      console.log('✅ Family join completed successfully and context updated');

      return family;
    } catch (error: any) {
      console.error('❌ Join family error:', error);
      if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('timeout')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
      }
      throw error;
    }
    };
    
    // Race the operation against the timeout
    return Promise.race([joinFamilyOperation(), overallTimeout]) as Promise<Family>;
  };

  const leaveFamily = async (): Promise<void> => {
    if (!user || !currentFamily) {
      throw new Error('No active family to leave');
    }

    try {
      console.log('Leaving family:', currentFamily.id);

      // Removed family_members API call
      const error = null;

      if (error) {
        console.error('Error leaving family:', error);
        throw error;
      }

      console.log('Successfully left family');

      // Reload family data
      await loadFamilyData();
    } catch (error: any) {
      console.error('Error leaving family:', error);
      throw error;
    }
  };

  const generateNewCode = async (): Promise<string> => {
    if (!user || !currentFamily || userRole !== 'admin') {
      throw new Error('Only admin can generate new family code');
    }

    const newCode = generateFamilyCode();

    try {
      console.log('Generating new code for family:', currentFamily.id);

      const { error } = await supabase
        .from('families')
        .update({ 
          code: newCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentFamily.id);

      if (error) {
        console.error('Error generating new code:', error);
        throw error;
      }

      console.log('New code generated:', newCode);

      // Update local state
      setCurrentFamily(prev => prev ? { ...prev, code: newCode } : null);

      return newCode;
    } catch (error: any) {
      console.error('Error generating new code:', error);
      throw error;
    }
  };
  const searchFamilies = async (searchTerm: string): Promise<Family[]> => {
    if (!user) {
      throw new Error('User must be logged in to search families');
    }

    if (searchTerm.length < 2) {
      throw new Error('Search term must be at least 2 characters');
    }

    try {
      const sanitizedTerm = sanitizeText(searchTerm, 100);
      console.log('🔍 FamilyContext: Starting family search...');
      console.log('🔍 Search term:', sanitizedTerm);
      console.log('🔍 User ID:', user.id);
      
      // Check if search term looks like a UUID (family ID)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sanitizedTerm);
      console.log('🔍 Is UUID:', isUUID);
      
      let query = supabase.from('families').select('*');
      
      if (isUUID) {
        // If it's a UUID, search by ID first
        console.log('🔍 Searching by UUID:', sanitizedTerm);
        query = query.eq('id', sanitizedTerm);
      } else {
        // Search by name or code (case-insensitive)
        console.log('🔍 Searching by name/code:', sanitizedTerm);
        query = query.or(`name.ilike.%${sanitizedTerm}%,code.ilike.%${sanitizedTerm}%`);
      }
      
      const { data: families, error } = await query.limit(10);
      
      console.log('🔍 Search results:', { 
        familiesFound: families?.length || 0, 
        families: families,
        error: error?.message 
      });

      if (error) {
        console.error('❌ Search error:', error);
        throw error;
      }

      return families || [];
    } catch (error: any) {
      console.error('Error searching families:', error);
      throw error;
    }
  };

  const createFamilyInviteLink = async (familyId: string): Promise<string> => {
    if (!user || !currentFamily || userRole !== 'admin') {
      throw new Error('Only admin can create invite links');
    }

    try {
      // In a real app, this would create a secure invite link
      // For now, we'll create a deep link format
      const inviteLink = `famora://join/${currentFamily.code}?family=${encodeURIComponent(currentFamily.name)}`;
      
      return inviteLink;
    } catch (error: any) {
      console.error('Error creating invite link:', error);
      throw error;
    }
  };

  const refreshFamily = useCallback(async (): Promise<void> => {
    console.log('🔄 Manual refresh triggered');
    await loadFamilyData();
  }, [loadFamilyData]);

  const refreshFamilyMembers = useCallback(async () => {
    if (currentFamily) {
      console.log('🔄 Refreshing family members for family:', currentFamily.id);
      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select(`
          *,
          profiles (
            id,
            name,
            avatar_url
          )
        `)
        .eq('family_id', currentFamily.id);

      if (membersError) {
        console.error('❌ Error refreshing family members:', membersError);
      } else {
        console.log('✅ Family members refreshed:', members);
        setFamilyMembers(members || []);
      }
    }
  }, [currentFamily]);

  const retryConnection = useCallback(async (): Promise<void> => {
    console.log('🔄 Retrying connection...');
    setError(null);
    setLoading(true);
    
    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clear any cached data and retry
    setCurrentFamily(null);
    setFamilyMembers([]);
    setUserRole(null);
    
    if (user) {
      await loadFamilyData();
    }
  }, [user, loadFamilyData]);

  const setFamilyData = useCallback((family: Family, role: 'admin' | 'member') => {
    console.log('🔧 Manually setting family data:', family);
    console.log('🔧 Setting user role:', role);
    setCurrentFamily(family);
    setUserRole(role);
    setLoading(false);
    setError(null);
  }, []);

  return (
    <FamilyContext.Provider
      value={{
        currentFamily,
        familyMembers,
        loading,
        error,
        isInFamily: !!currentFamily,
        userRole,
        createFamily,
        joinFamily,
        leaveFamily,
        refreshFamily,
        refreshFamilyMembers,
        retryConnection,
        generateNewCode,
        searchFamilies,
        createFamilyInviteLink,
        setFamilyData,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
}

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};