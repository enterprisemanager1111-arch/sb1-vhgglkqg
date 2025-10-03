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
  retryConnection: () => Promise<void>;
  generateNewCode: () => Promise<string>;
  searchFamilies: (searchTerm: string) => Promise<Family[]>;
  createFamilyInviteLink: (familyId: string) => Promise<string>;
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
      const { error: membersError } = await supabase
        .from('family_members')
        .upsert(membersToCreate, { onConflict: 'family_id,user_id' });
      
      if (membersError) {
        console.error('❌ Error adding family members:', membersError);
      } else {
        console.log('✅ Family members added successfully');
      }
      
    } catch (error) {
      console.error('❌ Error in addMissingFamilyMembers:', error);
    }
  };

  const loadFamilyData = useCallback(async () => {
    if (!user) {
      console.log('❌ No user found, clearing family data');
      setCurrentFamily(null);
      setFamilyMembers([]);
      setUserRole(null);
      setLoading(false);
      return;
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
      
      // Get user's family membership with timeout
      
      const membershipPromise = supabase
        .from('family_members')
        .select(`
          *,
          families (*)
        `)
        .eq('user_id', user.id);
      
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout after 30 seconds')), 30000)
          );
      
      const { data: memberships, error: membershipError } = await Promise.race([
        membershipPromise,
        timeoutPromise
      ]) as any;

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

        // Load all family members with profiles
        console.log('🔍 Loading family members for family_id:', family.id);
        
        // Use a more direct approach to ensure we get all members
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
          .eq('family_id', family.id)
          .order('joined_at', { ascending: true });
          
        console.log('🔍 Raw members query result:', { members, membersError });
        console.log('🔍 Members count from main query:', members?.length || 0);
            console.log("=============================test=================================")
          const { data: testmembers, error: testmembersError } = await supabase
          .from('family_members')
          .select('*')
          .eq('family_id', "41076860-5430-4610-9fc1-44d23f1453b0")
            console.log("testmembers",testmembers)
            console.log("testmembers length:", testmembers?.length)
          console.log("=============================test=================================")
          
          // Debug: Check if we're getting the correct number of members
          if (testmembers && testmembers.length !== 2) {
            console.log('⚠️ Expected 2 members but got:', testmembers.length);
            console.log('🔍 Current user ID:', user.id);
            console.log('🔍 Test members data:', testmembers);
          } else {
            console.log('✅ Found expected 2 members');
          }

        console.log('🔍 Family members query result:', { members, membersError });
        console.log('🔍 Members count:', members?.length || 0);
        
        if (members && members.length > 0) {
          console.log('🔍 Member details:');
          members.forEach((member: any, index: number) => {
            console.log(`  Member ${index + 1}:`, {
              id: member.id,
              user_id: member.user_id,
              role: member.role,
              family_id: member.family_id,
              profile: member.profiles
            });
          });
        }

        if (membersError) {
          console.error('❌ Error loading family members:', membersError);
          setFamilyMembers([]);
        } else {
          console.log('✅ Family members loaded successfully:', members);
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
    loadFamilyData();
    
    // Add fallback timeout to ensure loading never stays true indefinitely
    const fallbackTimeout = setTimeout(() => {
      console.warn('⚠️ Family loading timeout reached, forcing loading to false');
      setLoading(false);
    }, 8000); // 8 second timeout to prevent blocking navigation
    
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
      console.log('Creating family:', sanitizedName, 'with code:', code);

      // Create family
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert([
          {
            name: sanitizedName,
            code: code,
            created_by: user.id
          }
        ])
        .select()
        .single();

      if (familyError) {
        console.error('Error creating family:', familyError);
        throw familyError;
      }

      console.log('Family created:', family);

      // Add user as admin member
      const { error: memberError } = await supabase
        .from('family_members')
        .insert([
          {
            family_id: family.id,
            user_id: user.id,
            role: 'admin'
          }
        ]);

      if (memberError) {
        console.error('Error adding user to family:', memberError);
        // Clean up: Remove created family if member insertion fails
        await supabase.from('families').delete().eq('id', family.id);
        throw memberError;
      }

      console.log('User added to family as admin');

      // Award points for creating family (handled in component)
      // This is intentionally commented out to be handled in the UI layer
      // to ensure proper context and user feedback

      // Reload family data to reflect changes
      await loadFamilyData();

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

      // Find family by code with forced API call and immediate timeout
      let family = null;
      let familyError = null;
      
      try {
        console.log(`🔍 Searching for family with code: "${codeValidation.sanitized}"`);
        
        // Force a fresh connection by creating a new query with explicit timeout
        const queryPromise = new Promise(async (resolve, reject) => {
          try {
            console.log('🔍 Executing family search query...');
            
            // Try with the original client first
            let client = supabase;
            let { data, error } = await client
              .from('families')
              .select('*')
              .eq('code', codeValidation.sanitized);
            
            // If we get a timeout or hanging, try with a fresh client
            if (error && (error.message?.includes('timeout') || error.message?.includes('fetch'))) {
              console.log('🔄 Original client failed, trying with fresh client...');
              client = createFreshSupabaseClient();
              const freshResult = await client
                .from('families')
                .select('*')
                .eq('code', codeValidation.sanitized);
              data = freshResult.data;
              error = freshResult.error;
            }
            
            if (error) {
              reject(error);
            } else {
              resolve({ data, error: null });
            }
          } catch (err) {
            reject(err);
          }
        });
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Query timeout after 5 seconds')), 5000);
        });
        
        const result = await Promise.race([queryPromise, timeoutPromise]) as any;
        const { data, error } = result;
        
        familyError = error;
        
        if (error) {
          console.error('❌ Family search error:', error);
          throw new Error(`Database error: ${error.message}`);
        }
        
        if (data && data.length > 0) {
          family = data[0];
          console.log('✅ Found family:', family.name, 'ID:', family.id);
        } else {
          console.log('❌ No family found with code:', codeValidation.sanitized);
          family = null;
        }
        
      } catch (queryException: any) {
        console.error('❌ Family search exception:', queryException);
        familyError = queryException;
        
        // If it's a timeout, try with a completely different approach
        if (queryException.message?.includes('timeout')) {
          console.log('🔄 Timeout detected, trying direct HTTP request...');
          
          try {
            // Try with direct HTTP request to Supabase REST API
            console.log('🔄 Attempting direct HTTP request to Supabase...');
            
            const directHttpPromise = new Promise(async (resolve, reject) => {
              try {
                const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
                const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
                
                if (!supabaseUrl || !supabaseAnonKey) {
                  reject(new Error('Missing Supabase configuration'));
                  return;
                }
                
                console.log('🔍 Making direct HTTP request to:', `${supabaseUrl}/rest/v1/families`);
                
                const response = await fetch(`${supabaseUrl}/rest/v1/families?code=eq.${encodeURIComponent(codeValidation.sanitized)}`, {
                  method: 'GET',
                  headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                  },
                  // Add timeout to the fetch request
                  signal: AbortSignal.timeout(10000) // 10 second timeout
                });
                
                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log('✅ Direct HTTP request successful, received data:', data);
                
                if (data && data.length > 0) {
                  resolve({ data: [data[0]], error: null });
                } else {
                  resolve({ data: [], error: null });
                }
                
              } catch (err: any) {
                console.error('❌ Direct HTTP request failed:', err);
                reject(err);
              }
            });
            
            const httpTimeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Direct HTTP request timeout after 10 seconds')), 10000);
            });
            
            const httpResult = await Promise.race([directHttpPromise, httpTimeoutPromise]) as any;
            const { data: httpData, error: httpError } = httpResult;
            
            if (httpError) {
              console.error('❌ Direct HTTP request also failed:', httpError);
              throw new Error(`Network error: ${httpError.message}`);
            }
            
            if (httpData && httpData.length > 0) {
              family = httpData[0];
              console.log('✅ Direct HTTP request successful, found family:', family.name);
            } else {
              console.log('❌ Direct HTTP request found no family');
              family = null;
            }
            
          } catch (httpException: any) {
            console.error('❌ Direct HTTP request exception:', httpException);
            
            // If direct HTTP also fails, try with fresh client as last resort
            try {
              console.log('🔄 Direct HTTP failed, trying fresh client as last resort...');
              
              const freshClient = createFreshSupabaseClient();
              const { data: freshData, error: freshError } = await freshClient
                .from('families')
                .select('*')
                .eq('code', codeValidation.sanitized)
                .limit(1);
              
              if (freshError) {
                throw new Error(`Database error: ${freshError.message}`);
              }
              
              if (freshData && freshData.length > 0) {
                family = freshData[0];
                console.log('✅ Fresh client fallback successful, found family:', family.name);
              } else {
                console.log('❌ Fresh client fallback found no family');
                family = null;
              }
              
            } catch (freshException: any) {
              console.error('❌ Fresh client fallback also failed:', freshException);
              throw new Error('Unable to connect to the server. This might be a temporary issue. Please check your internet connection and try again in a few moments.');
            }
          }
        } else {
          // For other errors, provide a helpful error message
          if (queryException.message?.includes('fetch') || queryException.message?.includes('network')) {
            console.log('🔄 Network issue detected, providing fallback message...');
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

      // Check if user is already in this family with retry
      let existingMember = null;
      let membershipRetryCount = 0;
      const maxMembershipRetries = 2;
      
      while (membershipRetryCount < maxMembershipRetries) {
        try {
          console.log(`🔍 Checking existing membership, attempt ${membershipRetryCount + 1}/${maxMembershipRetries}`);
          
          const { data, error } = await supabase
            .from('family_members')
            .select('*')
            .eq('family_id', family.id)
            .eq('user_id', currentUser.id)
            .maybeSingle();
          
          existingMember = data;
          
          if (error && (error.message?.includes('fetch') || error.message?.includes('network'))) {
            console.log(`⚠️ Network error checking membership, retrying...`);
            membershipRetryCount++;
            if (membershipRetryCount < maxMembershipRetries) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } else {
            break; // Success or non-network error
          }
        } catch (exception: any) {
          console.error(`❌ Exception checking membership:`, exception);
          membershipRetryCount++;
          if (membershipRetryCount < maxMembershipRetries) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }

      console.log('🔍 Existing membership check:', !!existingMember);

      if (existingMember) {
        console.log('⚠️ User already in family');
        throw new Error(t('family.join.errors.alreadyMember'));
      }

      // Check if user is already in another family with retry
      let currentMembership = null;
      let otherMembershipRetryCount = 0;
      const maxOtherMembershipRetries = 2;
      
      while (otherMembershipRetryCount < maxOtherMembershipRetries) {
        try {
          console.log(`🔍 Checking other memberships, attempt ${otherMembershipRetryCount + 1}/${maxOtherMembershipRetries}`);
          
          const { data, error } = await supabase
            .from('family_members')
            .select('*')
            .eq('user_id', currentUser.id)
            .maybeSingle();
          
          currentMembership = data;
          
          if (error && (error.message?.includes('fetch') || error.message?.includes('network'))) {
            console.log(`⚠️ Network error checking other memberships, retrying...`);
            otherMembershipRetryCount++;
            if (otherMembershipRetryCount < maxOtherMembershipRetries) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } else {
            break; // Success or non-network error
          }
        } catch (exception: any) {
          console.error(`❌ Exception checking other memberships:`, exception);
          otherMembershipRetryCount++;
          if (otherMembershipRetryCount < maxOtherMembershipRetries) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }

      console.log('🔍 Current membership check:', !!currentMembership);

      if (currentMembership) {
        console.log('⚠️ User already in another family');
        throw new Error(t('family.join.errors.alreadyInAnotherFamily'));
      }

      console.log('✅ All checks passed, adding user to family...');

      // Add user to family with retry
      let memberError = null;
      let insertRetryCount = 0;
      const maxInsertRetries = 2;
      
      while (insertRetryCount < maxInsertRetries) {
        try {
          console.log(`🔍 Adding user to family, attempt ${insertRetryCount + 1}/${maxInsertRetries}`);
          
          const { error } = await supabase
            .from('family_members')
            .insert([
              {
                family_id: family.id,
                user_id: currentUser.id,
                role: 'member'
              }
            ]);
          
          memberError = error;
          
          console.log('📝 Member insertion result:', { success: !memberError, attempt: insertRetryCount + 1 });
          
          if (!memberError || (memberError && !memberError.message?.includes('fetch') && !memberError.message?.includes('network'))) {
            break; // Success or non-network error
          }
          
          // If it's a network error, retry
          if (memberError && (memberError.message?.includes('fetch') || memberError.message?.includes('network'))) {
            console.log(`⚠️ Network error during insert, retrying...`);
            insertRetryCount++;
            if (insertRetryCount < maxInsertRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } catch (insertException: any) {
          console.error(`❌ Insert exception:`, insertException);
          memberError = insertException;
          insertRetryCount++;
          if (insertRetryCount < maxInsertRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
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

      // Award points for joining family (handled in component)
      // This is intentionally commented out to be handled in the UI layer

      // Reload family data to reflect changes
      console.log('🔄 Reloading family data after joining...');
      await loadFamilyData();
      console.log('✅ Family data reloaded successfully');

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

      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('family_id', currentFamily.id)
        .eq('user_id', user.id);

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
        retryConnection,
        generateNewCode,
        searchFamilies,
        createFamilyInviteLink,
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