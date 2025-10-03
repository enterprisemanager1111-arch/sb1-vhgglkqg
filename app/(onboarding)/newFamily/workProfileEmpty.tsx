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
} from 'react-native';
import { router } from 'expo-router';
import { ChevronDown, Upload, ArrowLeft, RefreshCw } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { supabase } from '@/lib/supabase';

export default function WorkProfileEmpty() {
  const [familyName, setFamilyName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [familyType, setFamilyType] = useState('Private');
  const [familyCode, setFamilyCode] = useState('In progress...');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, width: 0 });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdFamilyName, setCreatedFamilyName] = useState('');
  const typeFieldRef = useRef<View>(null);

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
      const { data, error } = await supabase
        .from('families')
        .select('code')
        .eq('code', code)
        .maybeSingle();

      if (error) {
        console.error('Error checking family code:', error);
        return false; // Assume it doesn't exist if there's an error
      }

      return !!data; // Return true if code exists, false if not
    } catch (error) {
      console.error('Error checking family code:', error);
      return false;
    }
  };

  // Generate unique family code with automatic retry
  const generateUniqueFamilyCode = async (): Promise<string> => {
    let attempts = 0;
    const maxAttempts = 50; // Increased attempts for better success rate

    while (attempts < maxAttempts) {
      const code = generateFamilyCode();
      const exists = await checkFamilyCodeExists(code);
      
      if (!exists) {
        console.log(`✅ Generated unique family code: ${code} (attempt ${attempts + 1})`);
        return code;
      }
      
      attempts++;
      console.log(`🔄 Code ${code} already exists, trying again... (attempt ${attempts})`);
    }

    // If we can't generate a unique code after max attempts, throw an error
    throw new Error('Unable to generate unique family code after multiple attempts. Please refresh the page.');
  };

  // Generate family code when component mounts
  useEffect(() => {
    const generateCode = async () => {
      try {
        setFamilyCode('Generating unique code...');
        const uniqueCode = await generateUniqueFamilyCode();
        setFamilyCode(uniqueCode);
      } catch (error) {
        console.error('Error generating family code:', error);
        // Fallback to a simple generated code with timestamp to make it more unique
        const fallbackCode = generateFamilyCode() + Math.floor(Math.random() * 10);
        setFamilyCode(fallbackCode);
        Alert.alert(
          'Code Generation', 
          'Using a fallback code. The generated code should be unique.'
        );
      }
    };

    generateCode();
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
    console.log('📋 Current state:', {
      familyName: familyName,
      familyCode: familyCode,
      slogan: slogan,
      familyType: familyType,
      avatarUri: avatarUri ? 'Image selected' : 'No image',
      isUploadingAvatar: isUploadingAvatar
    });
    
    // Test Supabase client
    console.log('🔧 Testing Supabase client...');
    console.log('Supabase client:', supabase ? 'Initialized' : 'NOT INITIALIZED');
    
    try {
      // Validate required fields
      if (!familyName.trim()) {
        console.log('❌ Validation failed: No family name');
        Alert.alert('Error', 'Please enter a family name.');
        return;
      }

      if (!familyCode || familyCode === 'In progress...' || familyCode === 'Generating unique code...') {
        console.log('❌ Validation failed: Family code not ready');
        Alert.alert('Error', 'Please wait for the family code to be generated.');
        return;
      }
      
      console.log('✅ Validation passed, proceeding with family creation...');

      // Show loading state
      setIsUploadingAvatar(true);

      let familyImageUrl = null;

      // Upload family image if one is selected
      if (avatarUri) {
        try {
          console.log('📤 Uploading family image...');
          console.log('📋 Avatar URI:', avatarUri);
          
          // Create a unique filename for the family image
          let fileExt = 'jpg'; // default
          if (avatarUri.includes('data:image/')) {
            // Handle data URLs
            fileExt = avatarUri.split(';')[0].split('/')[1] || 'jpg';
          } else if (avatarUri.includes('.')) {
            // Handle file URIs and other URLs with extensions
            fileExt = avatarUri.split('.').pop()?.toLowerCase() || 'jpg';
          }
          // For blob URLs and other cases, use default 'jpg'
          const fileName = `family-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          console.log('📁 Generated filename:', fileName);
          
          let blob: Blob;
          
          // Handle different URI types
          if (avatarUri.startsWith('data:')) {
            // Handle data URL (base64)
            console.log('🔄 Processing data URL...');
            const response = await fetch(avatarUri);
            blob = await response.blob();
          } else if (avatarUri.startsWith('file://') || avatarUri.startsWith('content://')) {
            // Handle file URI (mobile)
            console.log('🔄 Processing file URI...');
            const response = await fetch(avatarUri);
            blob = await response.blob();
          } else {
            // Handle web blob URL or other formats
            console.log('🔄 Processing web URL...');
            const response = await fetch(avatarUri);
            blob = await response.blob();
          }
          
          console.log('📦 Blob created:', { size: blob.size, type: blob.type });
          
          // Upload to Supabase storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('family_img')
            .upload(fileName, blob, {
              contentType: blob.type || `image/${fileExt}`,
              upsert: false
            });

          if (uploadError) {
            console.error('❌ Upload error:', uploadError);
            throw new Error(`Failed to upload image: ${uploadError.message}`);
          }

          console.log('✅ Upload successful:', uploadData);

          // Get the public URL
          const { data: urlData } = supabase.storage
            .from('family_img')
            .getPublicUrl(fileName);

          familyImageUrl = urlData.publicUrl;
          console.log('✅ Family image uploaded successfully:', familyImageUrl);
          
        } catch (uploadError) {
          console.error('❌ Image upload failed:', uploadError);
          Alert.alert('Upload Error', 'Failed to upload family image. Please try again.');
          setIsUploadingAvatar(false);
          return;
        }
      }

      // Get current user
      console.log('🔐 Getting current user...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ User error:', userError);
        Alert.alert('Error', 'Please log in to create a family.');
        setIsUploadingAvatar(false);
        return;
      }
      console.log('✅ User authenticated:', user.id);

      // Insert family data into database
      console.log('💾 Creating family in database...');
      const familyInsertData = {
        name: familyName.trim(),
        code: familyCode,
        slogan: slogan.trim() || null,
        type: familyType,
        family_img: familyImageUrl,
        created_by: user.id
      };
      console.log('📋 Family data to insert:', familyInsertData);
      
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert(familyInsertData)
        .select()
        .single();

      if (familyError) {
        console.error('❌ Family creation error:', familyError);
        console.error('❌ Error details:', {
          message: familyError.message,
          details: familyError.details,
          hint: familyError.hint,
          code: familyError.code
        });
        throw new Error(`Failed to create family: ${familyError.message}`);
      }

      console.log('✅ Family created successfully:', familyData);

      // Add the creator as an admin member of the family
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: familyData.id,
          user_id: user.id,
          role: 'admin'
        });

      if (memberError) {
        console.error('❌ Member creation error:', memberError);
        // Don't fail the whole process, just log the error
        console.warn('⚠️ Family created but failed to add creator as member');
      } else {
        console.log('✅ Creator added as admin member');
      }

      // Success! Show modal
      setCreatedFamilyName(familyName);
      setShowSuccessModal(true);

    } catch (error) {
      console.error('❌ Start Family error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create family. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
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
    console.log('🖼️ Avatar pressed!');
    
    if (isUploadingAvatar) {
      console.log('⏳ Avatar upload in progress, ignoring press');
      return;
    }
    
    // Directly open file picker for all platforms
    console.log('📁 Opening file picker directly...');
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
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
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
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRefreshClick = () => {
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

  const handleGoToHomePage = () => {
    setShowSuccessModal(false);
    router.replace('/(tabs)');
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
          onPress={() => {
            console.log('🔘 Start Family button pressed!');
            handleStartFamily();
          }}
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
                <Text style={styles.successPrimaryButtonText}>Got To Home Page</Text>
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
});
