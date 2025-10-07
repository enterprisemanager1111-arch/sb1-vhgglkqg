import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  SafeAreaView,
  StatusBar,
  Image as RNImage,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronDown, Upload, ArrowLeft, RefreshCw } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';

export default function WorkProfileEmpty() {
  const [familyName, setFamilyName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [familyType, setFamilyType] = useState('Private');
  const [familyCode, setFamilyCode] = useState('In progress...');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, width: 0 });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdFamilyName, setCreatedFamilyName] = useState('');
  const [isCreatingFamily, setIsCreatingFamily] = useState(false);
  const typeFieldRef = useRef<View>(null);

  // Get user's family status
  const { isInFamily, currentFamily, refreshFamily, setFamilyData } = useFamily();
  const { user, session, refreshProfile } = useAuth();
  
  // Debug: Log family context values
  useEffect(() => {
    console.log('🔍 Family context values:', { isInFamily, currentFamily, setFamilyData: !!setFamilyData });
  }, [isInFamily, currentFamily, setFamilyData]);
  
  // Store the created family data to update context
  const [createdFamilyData, setCreatedFamilyData] = useState(null);
  
  // Debug: Log when createdFamilyData changes
  useEffect(() => {
    console.log('🔍 createdFamilyData state changed:', createdFamilyData);
  }, [createdFamilyData]);

  // Debug: Log avatarUri state changes
  useEffect(() => {
    console.log('🔍 avatarUri state changed:', avatarUri);
    console.log('🔍 avatarUri type:', typeof avatarUri);
    console.log('🔍 avatarUri length:', avatarUri?.length);
  }, [avatarUri]);

  // Generate 6-letter family code
  const generateFamilyCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return code;
  };

  // Check if family code exists in database
  const checkFamilyCodeExists = async (code: string): Promise<boolean> => {
    try {
      // Add timeout to prevent hanging (reduced to 2 seconds for faster fallback)
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 2000);
      });
      
      const queryPromise = supabase
        .from('families')
        .select('code')
        .eq('code', code)
        .maybeSingle();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        return false; // Assume it doesn't exist if there's an error
      }

      return !!data; // Return true if code exists, false if not
    } catch (error) {
      return false;
    }
  };

  // Generate unique family code with automatic retry
  const generateUniqueFamilyCode = async (): Promise<string> => {
    // For faster generation, try database check only once, then fallback immediately
    const code = generateFamilyCode();
    
    try {
      const exists = await checkFamilyCodeExists(code);
      
      if (!exists) {
        return code;
      }
      
      // If code exists, use timestamp approach immediately
      const timestampCode = code + Date.now().toString().slice(-3);
      return timestampCode;
    } catch (error) {
      // If database check fails, use a more unique code with timestamp
      const fallbackCode = code + Date.now().toString().slice(-3);
      return fallbackCode;
    }
  };

  // Generate family code when component mounts
  useEffect(() => {
    // Only generate if we haven't already generated a code
    if (familyCode !== 'In progress...' && familyCode !== 'Generating unique code...') {
      return;
    }
    
    // Prevent multiple generations
    if (isGeneratingCode) {
      return;
    }
    
    const generateCode = async () => {
      try {
        setIsGeneratingCode(true);
        setFamilyCode('Generating unique code...');
        
        const uniqueCode = await generateUniqueFamilyCode();
        setFamilyCode(uniqueCode);
      } catch (error) {
        // Fallback to a simple generated code with timestamp to make it more unique
        const fallbackCode = generateFamilyCode() + Date.now().toString().slice(-3);
        setFamilyCode(fallbackCode);
        Alert.alert(
          'Code Generation', 
          'Using a fallback code. The generated code should be unique.'
        );
      } finally {
        setIsGeneratingCode(false);
      }
    };

    // Add a small delay to prevent race conditions
    const timeoutId = setTimeout(() => {
      generateCode();
    }, 100);
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      setIsGeneratingCode(false);
    };
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(onboarding)/newFamily');
    }
  };


  const handleStartFamily = async () => {
    console.log('🚀 handleStartFamily called!');
    console.log('🔍 User family status:', { isInFamily, currentFamily: currentFamily?.name });
    
    // Check if user already has a family
    if (isInFamily && currentFamily) {
      console.log('❌ User already has family, showing alert');
      Alert.alert(
        'Already in Family', 
        `You are already a member of "${currentFamily.name}". You cannot create another family.`,
        [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]
      );
      return;
    }
    
    console.log('✅ User can create family, proceeding with validation...');
    console.log('🔍 Current form state:', {
      familyName,
      familyCode,
      familyType,
      slogan,
      avatarUri: !!avatarUri
    });
    
    try {
      // Validate required fields
      console.log('🔍 Validating family name:', familyName);
      if (!familyName.trim()) {
        console.log('❌ Family name validation failed');
        Alert.alert('Error', 'Please enter a family name.');
        return;
      }

      console.log('🔍 Validating family code:', familyCode);
      if (!familyCode || familyCode === 'In progress...' || familyCode === 'Generating unique code...') {
        console.log('❌ Family code validation failed');
        Alert.alert('Error', 'Please wait for the family code to be generated.');
        return;
      }
      
      console.log('✅ Validation passed, starting family creation...');

      // Show loading state
      console.log('🔄 Setting loading state...');
      setIsCreatingFamily(true);
      setIsUploadingAvatar(true);

      let familyImageUrl = null;

      // Upload family image if one is selected
      console.log('🔍 Checking for avatar:', avatarUri);
      console.log('🔍 Avatar URI type:', typeof avatarUri);
      console.log('🔍 Avatar URI length:', avatarUri?.length);
      console.log('🔍 Avatar URI truthy check:', !!avatarUri);
      console.log('🔍 Avatar URI null check:', avatarUri !== null);
      console.log('🔍 Avatar URI condition result:', avatarUri && avatarUri !== null);
      
      // Upload avatar if one is selected
      if (avatarUri && avatarUri !== null) {
        console.log('📤 Avatar found, starting upload...');
        try {
          // Add timeout for avatar upload to prevent hanging
          const uploadPromise = async () => {
            // Create a unique filename for the family image
            let fileExt = 'jpg'; // default
            if (avatarUri && avatarUri.includes('data:image/')) {
              // Handle data URLs
              fileExt = avatarUri.split(';')[0].split('/')[1] || 'jpg';
            } else if (avatarUri && avatarUri.includes('.')) {
              // Handle file URIs and other URLs with extensions
              fileExt = avatarUri.split('.').pop()?.toLowerCase() || 'jpg';
            }
            // For blob URLs and other cases, use default 'jpg'
            const fileName = `family-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            console.log('📁 Uploading file:', fileName);
            
            let blob: Blob;
            
            // Handle different URI types
            if (avatarUri && avatarUri.startsWith('data:')) {
              // Handle data URL (base64)
              console.log('🔄 Converting base64 to blob...');
              const response = await fetch(avatarUri);
              blob = await response.blob();
              console.log('✅ Blob created, size:', blob.size);
            } else if (avatarUri && (avatarUri.startsWith('file://') || avatarUri.startsWith('content://'))) {
              // Handle file URI (mobile)
              console.log('🔄 Converting file URI to blob...');
              const response = await fetch(avatarUri);
              blob = await response.blob();
              console.log('✅ Blob created, size:', blob.size);
            } else if (avatarUri) {
              // Handle web blob URL or other formats
              console.log('🔄 Converting URI to blob...');
              const response = await fetch(avatarUri);
              blob = await response.blob();
              console.log('✅ Blob created, size:', blob.size);
            } else {
              throw new Error('Invalid avatar URI');
            }
            
            // Upload to Supabase storage using direct REST API
            console.log('☁️ Uploading to Supabase storage via REST API...');
            console.log('☁️ Upload details:', {
              fileName,
              blobSize: blob.size,
              blobType: blob.type,
              fileExt
            });
            
            // Use direct REST API call to avoid Supabase client issues
            const uploadResponse = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/family_img/${fileName}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session?.access_token}`,
                'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
                'Content-Type': blob.type || `image/${fileExt}`,
                'x-upsert': 'false'
              },
              body: blob
            });

            if (!uploadResponse.ok) {
              const errorText = await uploadResponse.text();
              console.log('❌ Upload error details:', uploadResponse.status, errorText);
              throw new Error(`Failed to upload image: ${uploadResponse.status} ${errorText}`);
            }

            const uploadData = await uploadResponse.json();
            console.log('✅ Upload successful:', uploadData);

            // Get the public URL
            familyImageUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/family_img/${fileName}`;
            console.log('🔗 Public URL:', familyImageUrl);
          };

          // Add 30-second timeout for avatar upload
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Avatar upload timeout after 30 seconds')), 30000);
          });

          await Promise.race([uploadPromise(), timeoutPromise]);
          
        } catch (uploadError) {
          console.log('❌ Avatar upload failed:', uploadError);
          // Don't fail the entire process for avatar upload issues
          console.log('⚠️ Continuing without avatar...');
          familyImageUrl = null;
        }
      } else {
        console.log('ℹ️ No avatar selected, skipping upload');
        console.log('🔍 Avatar URI was:', avatarUri);
        console.log('🔍 Avatar URI type was:', typeof avatarUri);
      }

      // Use the user from the auth context instead of calling supabase.auth.getUser()
      console.log('🔐 Using user from auth context...');
      if (!user || !session) {
        console.log('❌ No user or session available');
        Alert.alert('Error', 'Please log in to create a family.');
        setIsUploadingAvatar(false);
        return;
      }
      
      console.log('✅ User authenticated:', user.id);
      
      // Check if session token is valid and refresh if needed
      console.log('🔍 Checking session token validity...');
      console.log('🔍 Session exists:', !!session);
      console.log('🔍 Access token exists:', !!session?.access_token);
      let validSession = session;
      
      if (!session || !session.access_token) {
        console.log('❌ No valid session found');
        Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') }
        ]);
        setIsUploadingAvatar(false);
        return;
      }
      
      // Try to refresh the session if it might be expired (optional)
      console.log('🔄 Attempting to refresh session (optional)...');
      try {
        // Add timeout to session refresh to prevent hanging
        const refreshPromise = supabase.auth.refreshSession();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session refresh timeout')), 3000); // Reduced to 3 seconds
        });
        
        const result = await Promise.race([refreshPromise, timeoutPromise]) as any;
        const { data: { session: refreshedSession }, error: refreshError } = result;
        
        if (refreshError) {
          console.log('⚠️ Session refresh failed:', refreshError);
          console.log('ℹ️ Continuing with existing session - refresh is optional');
          // Continue with existing session - refresh failure doesn't mean session is invalid
        } else if (refreshedSession) {
          console.log('✅ Session refreshed successfully');
          validSession = refreshedSession;
        } else {
          console.log('⚠️ No refreshed session returned, continuing with existing session');
        }
      } catch (refreshError) {
        console.log('⚠️ Session refresh error:', refreshError);
        console.log('ℹ️ Continuing with existing session - refresh is optional');
        // Continue with existing session - refresh failure doesn't mean session is invalid
      }
      
      // Use direct REST API calls to avoid Supabase client issues
      console.log('🔗 Using direct REST API calls with refreshed session...');
      
      // Insert family data into database
      console.log('💾 Preparing family data for database...');
      console.log('🔍 Family image URL:', familyImageUrl);
      const familyInsertData = {
        name: familyName.trim(),
        code: familyCode,
        slogan: slogan.trim() || null,
        type: familyType,
        family_img: familyImageUrl,
        created_by: user.id
      };
      
      console.log('📋 Family data to insert:', familyInsertData);
      console.log('🔄 Inserting family into database via REST API...');
      
      // Add timeout for database operations
      const databasePromise = async () => {
        // Use the session we already validated
        console.log('🔑 Using validated session for API call:', validSession?.access_token?.substring(0, 20) + '...');
        
        if (!validSession?.access_token) {
          throw new Error('No valid session available for API call');
        }
        
        const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/families`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validSession.access_token}`,
            'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(familyInsertData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log('❌ Family creation failed:', response.status, errorText);
          
          // Check for JWT expired error specifically
          if (response.status === 401 && errorText.includes('JWT expired')) {
            Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
              { text: 'OK', onPress: () => router.replace('/(auth)/login') }
            ]);
            setIsUploadingAvatar(false);
            return;
          }
          
          throw new Error(`Failed to create family: ${response.status} ${errorText}`);
        }
        
        const familyData = await response.json();
        console.log('✅ Family created successfully:', familyData);
        return familyData[0]; // REST API returns array, we want the first item
      };

      // Add 15-second timeout for database operations
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database operation timeout after 15 seconds')), 15000);
      });

      const familyData = await Promise.race([databasePromise(), timeoutPromise]);

      // Add the creator as an admin member of the family
      console.log('👥 Adding creator as admin member...');
      
      try {
        const memberPromise = async () => {
          // Use the same validated session for member creation
          const memberResponse = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/family_members`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${validSession?.access_token}`,
              'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              family_id: familyData.id,
              user_id: user.id,
              role: 'admin'
            })
          });

          if (!memberResponse.ok) {
            const errorText = await memberResponse.text();
            console.log('⚠️ Failed to add creator as member:', memberResponse.status, errorText);
            throw new Error(`Failed to add member: ${memberResponse.status} ${errorText}`);
          } else {
            console.log('✅ Creator added as admin member successfully');
          }
        };

         // Add 5-second timeout for member creation
         const memberTimeoutPromise = new Promise((_, reject) => {
           setTimeout(() => reject(new Error('Member creation timeout after 5 seconds')), 5000);
         });

        await Promise.race([memberPromise(), memberTimeoutPromise]);
      } catch (memberError) {
        console.log('⚠️ Member creation failed, but continuing:', memberError);
        // Don't fail the whole process, just continue
      }

      // Success! Show modal
      console.log('🎉 Family creation completed successfully!');
      console.log('🔍 Family data to store:', familyData);
      setCreatedFamilyName(familyName);
      setCreatedFamilyData(familyData); // Store the created family data
      console.log('✅ Family data stored in state');
      
      // Show the success modal first, then update context when navigating
      console.log('🎉 Showing Family Created modal...');
      setShowSuccessModal(true);

    } catch (error) {
      console.log('❌ Family creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create family. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      console.log('🔄 Cleaning up loading state...');
      setIsCreatingFamily(false);
      setIsUploadingAvatar(false);
    }
  };

  // Image picker functions
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload photos.');
        return false;
      }
    }
    return true;
  };

  const handleAvatarPress = () => {
    if (isUploadingAvatar) {
      return;
    }

    // Directly open file picker for all platforms
    pickImageFromLibrary();
  };

  const pickImageFromCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setIsUploadingAvatar(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1] as [number, number],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('📷 Image taken from camera:', result.assets[0].uri);
        setAvatarUri(result.assets[0].uri);
        console.log('📷 Avatar URI set to:', result.assets[0].uri);
      } else {
        console.log('📷 Camera capture canceled or no assets');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const pickImageFromLibrary = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setIsUploadingAvatar(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1] as [number, number],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('📸 Image selected from library:', result.assets[0].uri);
        setAvatarUri(result.assets[0].uri);
        console.log('📸 Avatar URI set to:', result.assets[0].uri);
      } else {
        console.log('📸 Image selection canceled or no assets');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRefreshClick = () => {
    console.log('🔄 Refreshing avatar - clearing avatar URI');
    setAvatarUri(null);
  };

  const handleUploadButtonPress = () => {
    if (avatarUri) {
      handleRefreshClick();
    } else {
      Alert.alert(
        'Select Photo',
        'Choose how you want to add a photo',
        [
          { text: 'Camera', onPress: pickImageFromCamera },
          { text: 'Photo Library', onPress: pickImageFromLibrary },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };


  const handleTypePress = () => {
    if (!isTypeDropdownOpen) {
      // Measure the position of the type field
      typeFieldRef.current?.measure((x, y, width, height, pageX, pageY) => {
        setDropdownPosition({
          x: pageX,
          y: pageY + height,
          width: width
        });
      });
    }
    setIsTypeDropdownOpen(!isTypeDropdownOpen);
  };

  const handleTypeSelect = (type: string) => {
    setFamilyType(type);
    setIsTypeDropdownOpen(false);
  };

  const handleOutsidePress = () => {
    if (isTypeDropdownOpen) {
      setIsTypeDropdownOpen(false);
    }
  };

  const handleGoToHomePage = async () => {
    console.log('🚀 handleGoToHomePage called!');
    console.log('🔍 createdFamilyData:', createdFamilyData);
    setShowSuccessModal(false);
    
    // Update the family context with the created family data before navigating
    if (createdFamilyData && setFamilyData) {
      console.log('🔧 Updating family context before navigation...');
      setFamilyData(createdFamilyData, 'admin');
      console.log('✅ Family context updated before navigation');
    }
    
    // Refresh user profile and family context before navigating
    console.log('🔄 Refreshing contexts before navigation...');
    try {
      // Use direct REST API calls to refresh profile data with timeout protection
      const refreshProfilePromise = async () => {
        if (!user || !session?.access_token) {
          console.log('⚠️ No user or session for profile refresh');
          return;
        }
        
        console.log('🔄 Refreshing profile via REST API...');
        const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const profileData = await response.json();
          console.log('✅ Profile refreshed via REST API:', profileData);
          
          // The profile data is now fresh in the database
          // The AuthContext will pick it up on the next render cycle
          // We don't need to call refreshProfile() as it might hang
        } else {
          console.log('⚠️ Profile refresh failed:', response.status);
        }
      };
      
      // Refresh family context with direct REST API calls
      const refreshFamilyPromise = async () => {
        if (!user || !session?.access_token) {
          console.log('⚠️ No user or session for family refresh');
          return;
        }
        
        try {
          console.log('🔄 Refreshing family context via REST API...');
          
          // If we have the created family data, use it directly
          if (createdFamilyData) {
            console.log('✅ Using created family data for context update:', createdFamilyData);
            // Manually update the family context with the created family data
            console.log('🔧 Calling setFamilyData with:', createdFamilyData, 'admin');
            setFamilyData(createdFamilyData, 'admin');
            console.log('✅ Family context updated with created family data');
            return;
          } else {
            console.log('❌ No createdFamilyData available for context update');
          }
          
          // Otherwise, get user's family membership from database
          const memberResponse = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/family_members?user_id=eq.${user.id}&select=*,families(*)`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
              'Accept': 'application/json'
            }
          });
          
          if (memberResponse.ok) {
            const memberData = await memberResponse.json();
            console.log('✅ Family membership data refreshed via REST API:', memberData);
            
            if (memberData && memberData.length > 0) {
              const familyData = memberData[0].families;
              console.log('✅ Family data found:', familyData);
              // The family context will be updated when the component re-renders
            } else {
              console.log('ℹ️ No family membership found');
            }
          } else {
            console.log('⚠️ Family membership refresh failed:', memberResponse.status);
          }
        } catch (error) {
          console.log('⚠️ Family context refresh failed:', error);
        }
      };
      
      // Refresh both contexts in parallel with timeout
      const refreshPromise = Promise.all([
        refreshProfilePromise(),
        refreshFamilyPromise()
      ]);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Context refresh timeout')), 5000);
      });
      
      await Promise.race([refreshPromise, timeoutPromise]);
      console.log('✅ Contexts refreshed successfully');
    } catch (error) {
      console.log('⚠️ Context refresh failed or timed out, but continuing:', error);
      // Continue with navigation even if refresh fails
    }
    
    // Navigate to home page with a small delay to ensure context refresh
    console.log('🏠 Navigating to home page...');
    
    // Add a small delay to ensure the family context has time to refresh
    setTimeout(() => {
      router.replace('/(tabs)');
      console.log('✅ Navigation command sent');
    }, 500);
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={20} color="#17f196" />
        </Pressable>
        <Text style={styles.headerTitle}>Your Family</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <Pressable style={styles.content} onPress={handleOutsidePress}>
        {/* Family Data Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Family Data Information</Text>
            <Text style={styles.cardSubtitle}>Your family data information</Text>
          </View>

          {/* Photo Upload Area */}
          <View style={styles.photoUploadSection}>
            <View style={styles.photoPlaceholder}>
              <Pressable 
                style={styles.avatarMainArea}
                onPress={handleAvatarPress}
                disabled={isUploadingAvatar}
              >
                {avatarUri ? (
                  <RNImage 
                    key={avatarUri}
                    source={{ uri: avatarUri }} 
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.photoIcon}>
                    <RNImage 
                      source={require('@/assets/images/icon/image.png')}
                      style={styles.placeholderIcon}
                      resizeMode="contain"
                    />
                  </View>
                )}
              </Pressable>
              
              {/* Upload/Refresh Button */}
              <Pressable 
                style={[styles.uploadButton, isUploadingAvatar && styles.uploadButtonLoading]}
                onPress={handleUploadButtonPress}
                disabled={isUploadingAvatar}
              >
                {avatarUri ? (
                  <RefreshCw size={16} color={isUploadingAvatar ? "#CCCCCC" : "#FFFFFF"} />
                ) : (
                  <RNImage 
                    source={require('@/assets/images/icon/upload.png')}
                    style={[styles.uploadIcon, isUploadingAvatar && styles.uploadIconDisabled]}
                    resizeMode="contain"
                  />
                )}
              </Pressable>
            </View>
            <Text style={styles.uploadLabel}>
              {avatarUri ? 'Change Photo' : 'Upload Photo'}
            </Text>
            <Text style={styles.uploadGuidelines}>
              Format should be in .jpeg .png atleast 800×800px and less than 5MB
            </Text>
          </View>

          {/* Input Fields */}
          <View style={styles.inputSection}>
            {/* Family Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Family Name</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <RNImage
                    source={require('@/assets/images/icon/user_input.png')}
                    style={styles.inputIconImage}
                    resizeMode="contain"
                  />
                </View>
                <TextInput
                  style={styles.textInput}
                  value={familyName}
                  onChangeText={setFamilyName}
                  placeholder="Drump"
                  placeholderTextColor="#98a2b3"
                />
              </View>
            </View>

            {/* Slogan */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Slogan</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <RNImage
                    source={require('@/assets/images/icon/user_input.png')}
                    style={styles.inputIconImage}
                    resizeMode="contain"
                  />
                </View>
                <TextInput
                  style={styles.textInput}
                  value={slogan}
                  onChangeText={setSlogan}
                  placeholder="Best Family in the World!"
                  placeholderTextColor="#98a2b3"
                />
              </View>
            </View>

            {/* Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.dropdownContainer} ref={typeFieldRef}>
                <Pressable 
                  style={({ pressed }) => [
                    styles.inputContainer,
                    pressed && styles.inputContainerPressed
                  ]} 
                  onPress={handleTypePress}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <View style={styles.inputIcon}>
                    <RNImage
                      source={require('@/assets/images/icon/keyboard.png')}
                      style={styles.inputIconImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.dropdownText}>{familyType}</Text>
                  <ChevronDown 
                    size={20} 
                    color="#17f196" 
                    style={[
                      styles.chevronIcon,
                      isTypeDropdownOpen && styles.chevronIconRotated
                    ]}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Family Code Creating Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Family Code Creating</Text>
            <Text style={styles.cardSubtitle}>Your family code, share this code for other Users</Text>
            
            {/* Debug: Show family status */}
            {isInFamily && currentFamily && (
              <View style={styles.warningContainer}>
                <Text style={styles.warningText}>
                  ⚠️ You are already in "{currentFamily.name}" family
                </Text>
              </View>
            )}
          </View>

          {/* Family Code Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Family Code</Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <RNImage
                  source={require('@/assets/images/icon/user_input.png')}
                  style={styles.inputIconImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.familyCodeText}>{familyCode}</Text>
            </View>
          </View>
        </View>
      </Pressable>

      {/* Bottom Button */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={[
            styles.nextButton,
            isUploadingAvatar && styles.disabledButton
          ]} 
          onPress={handleStartFamily}
          disabled={isUploadingAvatar}
        >
          <Text style={[
            styles.nextButtonText,
            isUploadingAvatar && styles.disabledText
          ]}>
            {isUploadingAvatar ? 'Creating Family...' : 'Start Family'}
          </Text>
        </Pressable>
      </View>

      {/* Dropdown Overlay */}
      {isTypeDropdownOpen && (
        <View style={styles.overlay}>
          <Pressable style={styles.overlayBackground} onPress={handleOutsidePress} />
          <View style={[
            styles.dropdownOverlay,
            {
              left: dropdownPosition.x,
              top: dropdownPosition.y,
              width: dropdownPosition.width,
            }
          ]}>
            <Pressable 
              style={styles.dropdownOption}
              onPress={() => handleTypeSelect('Private')}
            >
              <Text style={[
                styles.dropdownOptionText,
                familyType === 'Private' && styles.dropdownOptionTextSelected
              ]}>
                Private
              </Text>
            </Pressable>
            <View style={styles.dropdownSeparator} />
            <Pressable 
              style={styles.dropdownOption}
              onPress={() => handleTypeSelect('Public')}
            >
              <Text style={[
                styles.dropdownOptionText,
                familyType === 'Public' && styles.dropdownOptionTextSelected
              ]}>
                Public
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Simple Loading Modal */}
      {isCreatingFamily && (
        <View style={styles.loadingModalOverlay}>
          <View style={styles.loadingModalContainer}>
            {/* Simple Loading Spinner */}
            <ActivityIndicator size="large" color="#17f196" />
            
            {/* Simple Title */}
            <Text style={styles.loadingTitle}>Creating Family...</Text>
            
            {/* Simple Description */}
            <Text style={styles.loadingDescription}>
              Please wait while we set up your family.
            </Text>
          </View>
        </View>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <View style={styles.successModalOverlay}>
          <BlurView
            style={styles.blurOverlay}
            intensity={80}
            tint="dark"
          />
          <View style={styles.successModalContainer}>
            {/* Icon */}
            <View style={styles.successIconContainer}>
              <View style={styles.successIcon}>
                <RNImage 
                  source={require('@/assets/images/icon/user.png')}
                  style={styles.successIconImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.successTitle}>Family Created!</Text>

            {/* Description */}
            <Text style={styles.successDescription}>
              Your family has been successfully created. We wish you every success with the Famora app.
            </Text>

            {/* Button */}
            <View style={styles.successButtonContainer}>
              <Pressable
                style={[styles.successPrimaryButton]}
                onPress={handleGoToHomePage}
              >
                <Text style={styles.successPrimaryButtonText}>Go To Home Page</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9fff6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d2d2d',
    fontFamily: 'Helvetica',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 1,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d2d2d',
    marginBottom: 4,
    fontFamily: 'Helvetica',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#98a2b3',
    fontFamily: 'Helvetica',
  },
  photoUploadSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#fafaff',
    borderWidth: 2,
    borderColor: '#bdb4fe',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  photoIcon: {
    opacity: 0.6,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  uploadButton: {
    position: 'absolute',
    top: -18,
    right: -18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#17f196',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17f196',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  uploadButtonLoading: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  avatarMainArea: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475467',
    marginBottom: 8,
    fontFamily: 'Arial',
  },
  uploadGuidelines: {
    fontSize: 10,
    fontWeight: '400',
    color: '#667085',
    textAlign: 'center',
    lineHeight: 16,
    width: 190,
    fontFamily: 'Arial',
  },
  uploadIcon: {
    width: 16,
    height: 16,
  },
  uploadIconDisabled: {
    opacity: 0.5,
  },
  placeholderIcon: {
    width: 40,
    height: 40,
  },
  inputSection: {
    gap: 10,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#475467',
    fontFamily: 'Helvetica',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  inputContainerPressed: {
    backgroundColor: '#f0f0f0',
    borderColor: '#17f196',
  },
  dropdownContainer: {
    position: 'relative',
  },
  chevronIcon: {
    transform: [{ rotate: '0deg' }],
  },
  chevronIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownOptionText: {
    textAlign: 'center',
    paddingVertical: 6,
    fontSize: 14,
    color: '#2d2d2d',
    fontFamily: 'Helvetica',
  },
  dropdownOptionTextSelected: {
    color: '#17f196',
    fontWeight: '600',
  },
  dropdownSeparator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  dropdownOverlay: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 15,
    zIndex: 100000,
  },
  inputIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inputIconImage: {
    width: 20,
    height: 20,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#2d2d2d',
    fontFamily: 'Helvetica',
  },
  dropdownText: {
    flex: 1,
    fontSize: 14,
    color: '#2d2d2d',
    fontFamily: 'Helvetica',
  },
  familyCodeText: {
    flex: 1,
    fontSize: 14,
    color: '#98a2b3',
    fontFamily: 'Helvetica',
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  warningText: {
    color: '#856404',
    fontSize: 12,
    fontFamily: 'Helvetica',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 16,
  },
  nextButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  disabledText: {
    color: '#999999',
  },
  // Success Modal Styles (matching myProfile/edit.tsx)
  successModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 3000,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  successModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginHorizontal: 0,
    height: '30%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    paddingHorizontal: 32,
    paddingTop: 18,
    paddingBottom: 18,
  },
  successIconContainer: {
    alignItems: 'center',
    marginTop: -70,
    marginBottom: 30,
  },
  successIcon: {
    width: 100,
    height: 100,
    backgroundColor: '#17f196',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 9,
    elevation: 10,
  },
  successIconImage: {
    width: 48,
    height: 48,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#101828',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Helvetica',
  },
  successDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: '#393b41',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 14,
    fontFamily: 'Helvetica',
  },
  successButtonContainer: {
    gap: 16,
    marginTop: 'auto',
    paddingBottom: 20,
  },
  successPrimaryButton: {
    backgroundColor: '#17f196',
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  successPrimaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  
  // Simple Loading Modal Styles
  loadingModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#101828',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Helvetica',
  },
  loadingDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#667085',
    textAlign: 'center',
    fontFamily: 'Helvetica',
  },
});
