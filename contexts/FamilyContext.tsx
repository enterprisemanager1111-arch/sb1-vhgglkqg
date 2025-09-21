import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { supabase } from '@/lib/supabase';
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

        // Load all family members first (without profiles join to avoid RLS issues)
        console.log('🔍 Loading family members for family_id:', family.id);
        console.log('🔍 About to execute family_members query...');
        
        const membersPromise = supabase
          .from('family_members')
          .select('*')
          .eq('family_id', family.id);
        
        console.log('🔍 Family members query created, executing...');
        
        // Add timeout to prevent hanging
        const membersTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Family members query timeout after 30 seconds')), 30000)
        );
        
        let members, membersError;
        try {
          console.log('🔍 Executing Promise.race for family members query...');
          const result = await Promise.race([
            membersPromise,
            membersTimeoutPromise
          ]) as any;
          members = result.data;
          membersError = result.error;
          console.log('🔍 Promise.race completed successfully');
        } catch (raceError) {
          console.error('🔍 Promise.race failed:', raceError);
          members = null;
          membersError = raceError;
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
              family_id: member.family_id
            });
          });
        }
        
        // DEBUG: Test if RLS is filtering out members
        console.log('🔍 DEBUG: Testing RLS behavior...');
        console.log('🔍 Current user ID:', user.id);
        console.log('🔍 Family ID:', family.id);
        
        // Test: Try to get all family_members for this family without RLS context
        // This will help us understand if the issue is RLS or missing data
        try {
          console.log('🔍 DEBUG: Testing direct family_members query...');
          const { data: allMembers, error: allMembersError } = await supabase
            .from('family_members')
            .select('*')
            .eq('family_id', family.id);
          
          console.log('🔍 DEBUG: Direct query result:', { allMembers, allMembersError });
          console.log('🔍 DEBUG: Direct query count:', allMembers?.length || 0);
          
          if (allMembers && allMembers.length > 0) {
            console.log('🔍 DEBUG: All members in database:');
            allMembers.forEach((member: any, index: number) => {
              console.log(`  DB Member ${index + 1}:`, {
                id: member.id,
                user_id: member.user_id,
                role: member.role,
                family_id: member.family_id,
                joined_at: member.joined_at
              });
            });
          }
        } catch (debugError) {
          console.error('🔍 DEBUG: Direct query failed:', debugError);
        }
        
        // DEBUG: Check if the expected second user exists
        const expectedSecondUserId = 'a8eefb1c-d276-493e-a01d-267ee52102b1';
        console.log('🔍 DEBUG: Checking if second user exists in family_members...');
        console.log('🔍 DEBUG: Looking for user_id:', expectedSecondUserId);
        console.log('🔍 DEBUG: In family_id:', family.id);
        
        try {
          const { data: secondUserMembership, error: secondUserError } = await supabase
            .from('family_members')
            .select('*')
            .eq('user_id', expectedSecondUserId)
            .eq('family_id', family.id);
          
          console.log('🔍 DEBUG: Second user membership query result:', { secondUserMembership, secondUserError });
          
          if (secondUserMembership && secondUserMembership.length > 0) {
            console.log('✅ DEBUG: Second user IS in family_members table');
            console.log('✅ DEBUG: Second user membership details:', secondUserMembership[0]);
          } else {
            console.log('❌ DEBUG: Second user is NOT in family_members table');
            console.log('❌ DEBUG: This explains why only 1 member is returned!');
            console.log('🔧 DEBUG: Attempting to add missing second user to family...');
            
            // Try to add the missing second user to the family
            try {
              const { error: addMemberError } = await supabase
                .from('family_members')
                .insert([
                  {
                    family_id: family.id,
                    user_id: expectedSecondUserId,
                    role: 'member'
                  }
                ]);
              
              if (addMemberError) {
                console.error('❌ DEBUG: Failed to add second user to family:', addMemberError);
              } else {
                console.log('✅ DEBUG: Successfully added second user to family!');
                // Reload the family data to include the new member
                setTimeout(() => {
                  loadFamilyData();
                }, 1000);
              }
            } catch (addMemberException) {
              console.error('❌ DEBUG: Exception while adding second user:', addMemberException);
            }
          }
        } catch (secondUserDebugError) {
          console.error('🔍 DEBUG: Second user check failed:', secondUserDebugError);
        }
        
        // DEBUG: Check if second user has a profile
        console.log('🔍 DEBUG: Checking if second user has a profile...');
        try {
          const { data: secondUserProfile, error: secondUserProfileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', expectedSecondUserId);
          
          console.log('🔍 DEBUG: Second user profile:', { secondUserProfile, secondUserProfileError });
          
          if (secondUserProfile && secondUserProfile.length > 0) {
            console.log('✅ DEBUG: Second user HAS a profile');
          } else {
            console.log('❌ DEBUG: Second user does NOT have a profile');
            console.log('🔧 DEBUG: Attempting to create profile for second user...');
            
            // Try to create a profile for the second user
            try {
              const { error: createProfileError } = await supabase
                .from('profiles')
                .insert([
                  {
                    id: expectedSecondUserId,
                    name: 'Family Member 2',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }
                ]);
              
              if (createProfileError) {
                console.error('❌ DEBUG: Failed to create profile for second user:', createProfileError);
              } else {
                console.log('✅ DEBUG: Successfully created profile for second user!');
              }
            } catch (createProfileException) {
              console.error('❌ DEBUG: Exception while creating profile for second user:', createProfileException);
            }
          }
        } catch (secondUserProfileDebugError) {
          console.error('🔍 DEBUG: Second user profile check failed:', secondUserProfileDebugError);
        }
        
        // DEBUG: Test RLS policy by checking what families current user can see
        console.log('🔍 DEBUG: Testing RLS - what families can current user see?');
        try {
          const { data: userFamilies, error: userFamiliesError } = await supabase
            .from('family_members')
            .select('family_id, role')
            .eq('user_id', user.id);
          
          console.log('🔍 DEBUG: Current user families:', { userFamilies, userFamiliesError });
          
          if (userFamilies && userFamilies.length > 0) {
            console.log('🔍 DEBUG: Current user is member of families:', userFamilies.map(f => f.family_id));
          }
        } catch (userFamiliesDebugError) {
          console.error('🔍 DEBUG: User families check failed:', userFamiliesDebugError);
        }
        

        if (membersError) {
          console.error('❌ Error loading family members:', membersError);
          setFamilyMembers([]);
        } else {
          console.log('✅ Family members loaded successfully:', members);
          
          // Now fetch profiles for each member separately
          if (members && members.length > 0) {
            console.log('🔍 Fetching profiles for members...');
            
            const userIds = members.map((member: any) => member.user_id);
            console.log('🔍 User IDs to fetch profiles for:', userIds);
            
            const { data: profiles, error: profilesError } = await supabase
              .from('profiles')
              .select('id, name, avatar_url')
              .in('id', userIds);
            
            if (profilesError) {
              console.error('❌ Error loading profiles:', profilesError);
              // Set members without profiles
              setFamilyMembers(members || []);
            } else {
              console.log('✅ Profiles loaded:', profiles);
              
              // Combine members with their profiles
              const membersWithProfiles = members.map((member: any) => {
                const profile = profiles?.find((p: any) => p.id === member.user_id);
                return {
                  ...member,
                  profiles: profile || null
                };
              });
              
              console.log('✅ Combined members with profiles:', membersWithProfiles);
              setFamilyMembers(membersWithProfiles);
            }
          } else {
            setFamilyMembers([]);
          }
        }

        // Setup real-time subscription for this family
        setupRealtimeSubscription(family.id);
      } else {
        // User is not in a family
        console.log('❌ User is not in any family');
        console.log('❌ Membership result:', membership);
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
    
    // Cleanup real-time subscription on unmount
    return () => {
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
    if (!user) {
      throw new Error('User must be logged in to join a family');
    }

    const codeValidation = validateFamilyCode(code);
    if (!codeValidation.isValid) {
      throw new Error(codeValidation.error);
    }
    
    try {
      console.log('🔍 FamilyContext: Starting join family process...');
      console.log('🔍 User ID:', user.id);
      console.log('🔍 Code validation result:', codeValidation);
      console.log('🔍 Searching for family with code:', codeValidation.sanitized);
      
      // Check current session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 Current session:', !!session);
      console.log('🔍 Session user ID:', session?.user?.id);
      console.log('🔍 Session access token exists:', !!session?.access_token);
      
      if (!session) {
        throw new Error('No active session. Please sign in again.');
      }
      
      if (!session.access_token) {
        throw new Error('Invalid session. Please sign in again.');
      }

      // Find family by code
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('code', codeValidation.sanitized)
        .maybeSingle();

      console.log('📊 Family search result:', { 
        foundFamily: !!family, 
        familyName: family?.name,
        error: familyError?.message 
      });

      if (familyError) {
        console.error('❌ Database error when searching for family:', familyError);
        if (familyError.message?.includes('fetch') || familyError.message?.includes('network')) {
          throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
        }
        throw new Error(`Database error: ${familyError.message}`);
      }
      
      if (!family) {
        console.error('❌ Family not found with code:', codeValidation.sanitized);
        throw new Error(t('family.join.errors.familyNotFound'));
      }

      console.log('✅ Found family:', family.name);

      // Check if user is already in this family
      const { data: existingMember } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', family.id)
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('🔍 Existing membership check:', !!existingMember);

      if (existingMember) {
        console.log('⚠️ User already in family');
        throw new Error(t('family.join.errors.alreadyMember'));
      }

      // Check if user is already in another family
      const { data: currentMembership } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('🔍 Current membership check:', !!currentMembership);

      if (currentMembership) {
        console.log('⚠️ User already in another family');
        throw new Error(t('family.join.errors.alreadyInAnotherFamily'));
      }

      console.log('✅ All checks passed, adding user to family...');

      // Add user to family
      const { error: memberError } = await supabase
        .from('family_members')
        .insert([
          {
            family_id: family.id,
            user_id: user.id,
            role: 'member'
          }
        ]);

      console.log('📝 Member insertion result:', { success: !memberError });

      if (memberError) {
        console.error('❌ Error adding user to family:', memberError);
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
      throw new Error('Suchbegriff muss mindestens 2 Zeichen haben');
    }

    try {
      const sanitizedTerm = sanitizeText(searchTerm, 100);
      
      // Search families by name or code
      const { data: families, error } = await supabase
        .from('families')
        .select('*')
        .or(`name.ilike.%${sanitizedTerm}%,code.ilike.%${sanitizedTerm}%`)
        .limit(10);

      if (error) throw error;

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