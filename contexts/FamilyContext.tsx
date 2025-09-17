import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
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
  
  const realtimeChannelRef = React.useRef<RealtimeChannel | null>(null);

  const loadFamilyData = async () => {
    if (!user) {
      setCurrentFamily(null);
      setFamilyMembers([]);
      setUserRole(null);
      setLoading(false);
      return;
    }

    console.log('Loading family data for user:', user.id);
    
    try {
      setError(null);
      
      // Get user's family membership
      const { data: memberships, error: membershipError } = await supabase
        .from('family_members')
        .select(`
          *,
          families (*)
        `)
        .eq('user_id', user.id);

      if (membershipError) {
        console.error('Error loading membership:', membershipError);
        throw membershipError;
      }

      console.log('User memberships:', memberships);

      const membership = memberships && memberships.length > 0 ? memberships[0] : null;

      if (membership && membership.families) {
        // User is in a family
        const family = Array.isArray(membership.families) ? membership.families[0] : membership.families;
        
        console.log('Found family:', family);
        setCurrentFamily(family);
        setUserRole(membership.role);

        // Load all family members with their profiles
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
          console.error('Error loading family members:', membersError);
        } else {
          console.log('Family members loaded:', members);
          setFamilyMembers(members || []);
        }

        // Setup real-time subscription for this family
        setupRealtimeSubscription(family.id);
      } else {
        // User is not in a family
        console.log('User is not in any family');
        setCurrentFamily(null);
        setFamilyMembers([]);
        setUserRole(null);
        
        // Clean up real-time subscription
        if (realtimeChannelRef.current) {
          realtimeChannelRef.current.unsubscribe();
          realtimeChannelRef.current = null;
        }
      }
    } catch (error: any) {
      console.error('Error loading family data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = (familyId: string) => {
    // Clean up existing subscription
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.unsubscribe();
    }

    console.log('Setting up real-time subscription for family:', familyId);

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
    loadFamilyData();
    
    // Cleanup real-time subscription on unmount
    return () => {
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.unsubscribe();
      }
    };
  }, [user]);

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
      console.log('🔍 FamilyContext: Searching for family with code:', codeValidation.sanitized);

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

      if (familyError || !family) {
        console.error('❌ Family not found');
        throw new Error('Familie nicht gefunden. Überprüfen Sie den Code.');
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
        throw new Error('Sie sind bereits Mitglied dieser Familie.');
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
        throw new Error('Sie sind bereits Mitglied einer anderen Familie. Verlassen Sie diese zuerst.');
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
        throw memberError;
      }

      console.log('🎉 User successfully joined family');

      // Award points for joining family (handled in component)
      // This is intentionally commented out to be handled in the UI layer

      // Reload family data to reflect changes
      await loadFamilyData();

      return family;
    } catch (error: any) {
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

  const refreshFamily = async (): Promise<void> => {
    console.log('Refreshing family data...');
    await loadFamilyData();
  };

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