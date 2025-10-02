import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image as RNImage,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { User, Calendar, Briefcase, Upload, ChevronLeft, ChevronDown, RefreshCw, Edit3, RotateCw, Check, X, Crop, RotateCcw } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useCustomAlert } from '@/contexts/CustomAlertContext';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function EditProfile() {
  const { profile, updateProfile, user, session, loading: authLoading } = useAuth();
  const { loading: familyLoading } = useFamily();
  const { showError } = useCustomAlert();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [position, setPosition] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editingImageUri, setEditingImageUri] = useState<string | null>(null);
  const [imageRotation, setImageRotation] = useState(0);
  const [cropMode, setCropMode] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 300, height: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
    cropX: 0,
    cropY: 0,
    cropWidth: 0,
    cropHeight: 0
  });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);
  const [isCreatingCrop, setIsCreatingCrop] = useState(false);
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 });
  const [isUpdateConfirmationVisible, setUpdateConfirmationVisible] = useState(false);
  const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [isProfileDataLoaded, setIsProfileDataLoaded] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);



  // Load interests from localStorage
  const loadInterestsFromStorage = async () => {
    try {
      const STORAGE_KEY = '@famora_onboarding_data';
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);

      if (storedData) {
        const parsedData = JSON.parse(storedData);
        const interestsData = parsedData.personalInfo?.interests || [];
        setInterests(interestsData);
        console.log('✅ Loaded interests from localStorage:', interestsData);
      } else {
        console.log('❌ No interests data found in localStorage');
        setInterests([]);
      }
    } catch (error) {
      console.error('❌ Error loading interests from localStorage:', error);
      setInterests([]);
    }
  };

  useEffect(() => {
    console.log('🔄 Profile edit page useEffect triggered');
    console.log('🔄 Auth loading:', authLoading);
    console.log('🔄 Family loading:', familyLoading);
    console.log('🔄 Profile value:', profile);
    console.log('🔄 Profile type:', typeof profile);
    console.log('🔄 Profile is null:', profile === null);
    console.log('🔄 Profile is undefined:', profile === undefined);
    console.log('🔄 User available:', !!user);
    console.log('🔄 Session available:', !!session);

    // Don't process if AuthContext or FamilyContext is still loading
    if (authLoading || familyLoading) {
      console.log('🔄 AuthContext or FamilyContext still loading, waiting...');
      return;
    }

    // Wait for profile data to be loaded (even if it's null, we need to know it's been checked)
    // This prevents the page from rendering with empty data when navigating from signup
    if (profile === undefined) {
      console.log('🔄 Profile data not yet loaded, waiting...');
      return;
    }

    // Ensure user and session are available before proceeding
    if (!user || !session) {
      console.log('🔄 User or session not available, waiting...');
      return;
    }

    if (profile) {
      console.log('📋 Current profile data:', profile);
      console.log('📋 Profile fields:', Object.keys(profile));

      // Split the name into first and last name
      const nameParts = profile.name ? profile.name.split(' ') : ['', ''];
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setDateOfBirth(profile.birth_date || '');
      setPosition(profile.role || '');
      setAvatarUri(profile.avatar_url || null);
      setAvatarUrl(profile.avatar_url || null);

      // Set selectedDate if birth_date exists
      if (profile.birth_date) {
        setSelectedDate(new Date(profile.birth_date));
      }
    } else {
      console.log('📋 No profile data available, setting empty values');
      // Set empty values when no profile
      setFirstName('');
      setLastName('');
      setDateOfBirth('');
      setPosition('');
      setAvatarUri(null);
      setAvatarUrl(null);
    }

    // Only mark as loaded when we have user, session, and profile data (even if null)
    console.log('🔄 Setting isLoadingUserData to false');
    setIsLoadingUserData(false);
    setIsProfileDataLoaded(true);

    // Load interests from localStorage
    loadInterestsFromStorage();
  }, [profile, authLoading, familyLoading, user, session]);

  // Fallback timeout to ensure loading state is cleared
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoadingUserData) {
        console.log('⚠️ Loading timeout reached, forcing loading state to false');
        setIsLoadingUserData(false);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeoutId);
  }, [isLoadingUserData]);

  // Debug useEffect to monitor loading states
  useEffect(() => {
    console.log('🔍 isLoadingUserData changed to:', isLoadingUserData);
  }, [isLoadingUserData]);

  useEffect(() => {
    console.log('🔍 isProfileDataLoaded changed to:', isProfileDataLoaded);
  }, [isProfileDataLoaded]);

  // Monitor avatar URI changes
  useEffect(() => {
  }, [avatarUri]);



  const handleDatePickerOpen = () => {
    setShowDatePicker(true);
  };

  const handleDatePickerClose = () => {
    setShowDatePicker(false);
  };

  // Request permissions for camera and photo library
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted') {
      showError('Permission Required', 'Camera permission is required to take photos.');
      return false;
    }

    if (libraryStatus !== 'granted') {
      showError('Permission Required', 'Photo library permission is required to select photos.');
      return false;
    }

    return true;
  };

  // Pick image from camera
  const pickImageFromCamera = async () => {
    // Camera not available on web
    if (Platform.OS === 'web') {
      showError('Not Available', 'Camera is not available on web. Please use Photo Library instead.');
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setIsUploadingAvatar(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image from camera:', error);
      showError('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Pick image from photo library
  const pickImageFromLibrary = async () => {
    console.log('🖼️ Starting image picker...');
    console.log('Platform:', Platform.OS);

    // For web, we don't need to request permissions
    if (Platform.OS !== 'web') {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;
    }

    try {
      setIsUploadingAvatar(true);
      console.log('📱 Launching image library...');

      // For web, use a simpler approach without editing
      // For mobile, try with editing first
      const pickerOptions = Platform.OS === 'web'
        ? {
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false, // Disable editing on web
          quality: 0.8,
        }
        : {
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true, // Enable editing on mobile
          aspect: [1, 1] as [number, number],
          quality: 0.8,
        };

      console.log('📱 Picker options:', pickerOptions);

      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

      console.log('📸 Image picker result:', result);
      console.log('Canceled:', result.canceled);
      console.log('Assets:', result.assets);

      if (!result.canceled && result.assets[0]) {
        console.log('✅ Image selected successfully:', result.assets[0].uri);
        setAvatarUri(result.assets[0].uri);
      } else {
        console.log('❌ Image selection canceled or no assets');
      }
    } catch (error) {
      console.error('❌ Error picking image from library:', error);
      showError('Error', 'Failed to select photo. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle refresh button click (clear image)
  const handleRefreshClick = () => {
    console.log('🔄 Refresh button clicked - clearing image');
    setAvatarUri(null);
  };


  // Image editing functions
  const handleRotateImage = () => {
    setImageRotation(prev => (prev + 90) % 360);
  };


  const handleToggleCropMode = () => {
    setCropMode(prev => !prev);
    if (!cropMode) {
      // Start with centered square crop area when entering crop mode
      const squareSize = 150;
      const centerX = (300 - squareSize) / 2;
      const centerY = (300 - squareSize) / 2;
      setCropArea({
        x: Math.max(0, centerX),
        y: Math.max(0, centerY),
        width: squareSize,
        height: squareSize
      });
    }
  };

  const handleResetCrop = () => {
    // Reset to centered square crop area
    const squareSize = 150;
    const centerX = (300 - squareSize) / 2;
    const centerY = (300 - squareSize) / 2;
    setCropArea({
      x: Math.max(0, centerX),
      y: Math.max(0, centerY),
      width: squareSize,
      height: squareSize
    });
    setImageRotation(0);
  };


  const handleCropAreaPress = (event: any) => {
    if (!cropMode) return;
    setIsDragging(true);
    const touch = event.nativeEvent.touches ? event.nativeEvent.touches[0] : event.nativeEvent;
    const clientX = touch.clientX || touch.pageX;
    const clientY = touch.clientY || touch.pageY;
    setDragStart({
      x: clientX,
      y: clientY,
      cropX: cropArea.x,
      cropY: cropArea.y,
      cropWidth: cropArea.width,
      cropHeight: cropArea.height
    });
  };

  const handleOverlayPress = (event: any) => {
    if (!cropMode) return;
    setIsCreatingCrop(true);
    const touch = event.nativeEvent.touches ? event.nativeEvent.touches[0] : event.nativeEvent;
    const clientX = touch.clientX || touch.pageX;
    const clientY = touch.clientY || touch.pageY;
    setCropStart({
      x: clientX,
      y: clientY
    });
  };

  const handleOverlayMove = (event: any) => {
    if (!isCreatingCrop || !cropMode) return;

    const touch = event.nativeEvent.touches ? event.nativeEvent.touches[0] : event.nativeEvent;
    const clientX = touch.clientX || touch.pageX;
    const clientY = touch.clientY || touch.pageY;

    const newX = Math.min(cropStart.x, clientX);
    const newY = Math.min(cropStart.y, clientY);
    const newWidth = Math.abs(clientX - cropStart.x);
    const newHeight = Math.abs(clientY - cropStart.y);

    // Make it square by using the larger dimension
    const squareSize = Math.max(newWidth, newHeight);

    // Ensure minimum size and stay within image boundaries
    if (squareSize > 50) {
      const constrainedX = Math.max(0, Math.min(300 - squareSize, newX));
      const constrainedY = Math.max(0, Math.min(300 - squareSize, newY));
      const constrainedSize = Math.min(300 - Math.max(constrainedX, constrainedY), squareSize);

      setCropArea({
        x: constrainedX,
        y: constrainedY,
        width: constrainedSize,
        height: constrainedSize
      });
    }
  };

  const handleOverlayRelease = () => {
    setIsCreatingCrop(false);
  };

  const handleCropAreaMove = (event: any) => {
    if (!isDragging || !cropMode) return;

    const touch = event.nativeEvent.touches ? event.nativeEvent.touches[0] : event.nativeEvent;
    const clientX = touch.clientX || touch.pageX;
    const clientY = touch.clientY || touch.pageY;

    // Calculate delta from initial position
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;

    // Calculate new position based on initial crop area + delta
    const newX = Math.max(0, Math.min(300 - dragStart.cropWidth, dragStart.cropX + deltaX));
    const newY = Math.max(0, Math.min(300 - dragStart.cropHeight, dragStart.cropY + deltaY));


    setCropArea({
      x: newX,
      y: newY,
      width: dragStart.cropWidth,
      height: dragStart.cropHeight
    });
  };

  const handleCropAreaRelease = () => {
    setIsDragging(false);
    setIsResizing(false);
    setIsCreatingCrop(false);
    setResizeCorner(null);
  };

  const handleCornerPress = (corner: string, event: any) => {
    if (!cropMode) return;
    setIsResizing(true);
    setResizeCorner(corner);

    // Get the touch position
    const touch = event.nativeEvent.touches ? event.nativeEvent.touches[0] : event.nativeEvent;
    const clientX = touch.clientX || touch.pageX;
    const clientY = touch.clientY || touch.pageY;

    // Store the initial crop area state for delta calculations
    setDragStart({
      x: clientX,
      y: clientY,
      cropX: cropArea.x,
      cropY: cropArea.y,
      cropWidth: cropArea.width,
      cropHeight: cropArea.height
    });
  };

  const handleCornerMove = (event: any) => {
    if (!isResizing || !cropMode || !resizeCorner) return;

    // Get the touch position from responder event
    const touch = event.nativeEvent.touches ? event.nativeEvent.touches[0] : event.nativeEvent;
    const clientX = touch.clientX || touch.pageX;
    const clientY = touch.clientY || touch.pageY;


    const minSize = 50;
    const maxSize = 300;

    // Calculate delta from initial position
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;


    let newX = dragStart.cropX;
    let newY = dragStart.cropY;
    let newWidth = dragStart.cropWidth;
    let newHeight = dragStart.cropHeight;

    switch (resizeCorner) {
      case 'topLeft':
        // Calculate new position based on delta movement from initial state
        const newTopLeftX = Math.max(0, Math.min(dragStart.cropX + dragStart.cropWidth - minSize, dragStart.cropX + deltaX));
        const newTopLeftY = Math.max(0, Math.min(dragStart.cropY + dragStart.cropHeight - minSize, dragStart.cropY + deltaY));

        // Calculate new size maintaining square aspect ratio
        const newWidthFromTopLeft = dragStart.cropX + dragStart.cropWidth - newTopLeftX;
        const newHeightFromTopLeft = dragStart.cropY + dragStart.cropHeight - newTopLeftY;
        const newSizeFromTopLeft = Math.min(newWidthFromTopLeft, newHeightFromTopLeft);

        newWidth = Math.max(minSize, Math.min(maxSize, newSizeFromTopLeft));
        newHeight = newWidth;

        // Adjust position to maintain square
        newX = dragStart.cropX + dragStart.cropWidth - newWidth;
        newY = dragStart.cropY + dragStart.cropHeight - newHeight;
        break;

      case 'topRight':
        const newTopRightY = Math.max(0, Math.min(dragStart.cropY + dragStart.cropHeight - minSize, dragStart.cropY + deltaY));

        const newWidthFromTopRight = dragStart.cropWidth + deltaX;
        const newHeightFromTopRight = dragStart.cropY + dragStart.cropHeight - newTopRightY;
        const newSizeFromTopRight = Math.min(newWidthFromTopRight, newHeightFromTopRight);

        newWidth = Math.max(minSize, Math.min(maxSize, newSizeFromTopRight));
        newHeight = newWidth;

        newX = dragStart.cropX;
        newY = dragStart.cropY + dragStart.cropHeight - newHeight;
        break;

      case 'bottomLeft':
        const newBottomLeftX = Math.max(0, Math.min(dragStart.cropX + dragStart.cropWidth - minSize, dragStart.cropX + deltaX));

        const newWidthFromBottomLeft = dragStart.cropX + dragStart.cropWidth - newBottomLeftX;
        const newHeightFromBottomLeft = dragStart.cropHeight + deltaY;
        const newSizeFromBottomLeft = Math.min(newWidthFromBottomLeft, newHeightFromBottomLeft);

        newWidth = Math.max(minSize, Math.min(maxSize, newSizeFromBottomLeft));
        newHeight = newWidth;

        newX = dragStart.cropX + dragStart.cropWidth - newWidth;
        newY = dragStart.cropY;
        break;

      case 'bottomRight':
        const newWidthFromBottomRight = dragStart.cropWidth + deltaX;
        const newHeightFromBottomRight = dragStart.cropHeight + deltaY;
        const newSizeFromBottomRight = Math.min(newWidthFromBottomRight, newHeightFromBottomRight);

        newWidth = Math.max(minSize, Math.min(maxSize, newSizeFromBottomRight));
        newHeight = newWidth;

        newX = dragStart.cropX;
        newY = dragStart.cropY;
        break;
    }

    // Ensure the crop area stays within bounds
    newX = Math.max(0, Math.min(maxSize - newWidth, newX));
    newY = Math.max(0, Math.min(maxSize - newHeight, newY));


    setCropArea({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    });
  };

  const handleSaveEditedImage = async () => {
    if (editingImageUri) {
      try {

        // Validate crop area
        if (cropArea.width <= 0 || cropArea.height <= 0) {
          showError('Error', 'Invalid crop area. Please select a valid area to crop.');
          return;
        }

        if (cropArea.x < 0 || cropArea.y < 0 ||
          cropArea.x + cropArea.width > 300 ||
          cropArea.y + cropArea.height > 300) {
          showError('Error', 'Crop area is outside image bounds. Please adjust your selection.');
          return;
        }

        // Create a canvas to apply crop and rotation
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        // Convert blob URL to data URL to avoid CORS issues
        const response = await fetch(editingImageUri);
        const blob = await response.blob();
        const reader = new FileReader();

        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        img.onload = () => {

          // Set canvas size to crop area
          canvas.width = cropArea.width;
          canvas.height = cropArea.height;

          if (ctx) {

            // Apply rotation
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((imageRotation * Math.PI) / 180);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);

            // Calculate scaled crop coordinates based on actual image dimensions
            const scaleX = img.width / 300; // 300 is the display container width
            const scaleY = img.height / 300; // 300 is the display container height

            const scaledCropX = cropArea.x * scaleX;
            const scaledCropY = cropArea.y * scaleY;
            const scaledCropWidth = cropArea.width * scaleX;
            const scaledCropHeight = cropArea.height * scaleY;


            // Clear canvas first
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw cropped and rotated image
            ctx.drawImage(
              img,
              scaledCropX, scaledCropY, scaledCropWidth, scaledCropHeight,
              0, 0, cropArea.width, cropArea.height
            );


            // Create a preview to verify the crop
            const previewCanvas = document.createElement('canvas');
            const previewCtx = previewCanvas.getContext('2d');
            previewCanvas.width = 100;
            previewCanvas.height = 100;
            if (previewCtx) {
              previewCtx.drawImage(canvas, 0, 0, 100, 100);
            }

            // Convert to blob and create new URI
            canvas.toBlob((blob) => {
              if (blob) {
                const newUri = URL.createObjectURL(blob);

                // Test if the blob URL is accessible
                const testImg = new Image();
                testImg.onload = () => {
                  setAvatarUri(newUri);
                };
                testImg.onerror = () => {
                  console.error('🔧 Blob URL test failed - image could not load');
                  // Still try to set the URI
                  setAvatarUri(newUri);
                };
                testImg.src = newUri;
                setShowImageEditor(false);
                setCropMode(false);
              } else {
                console.error('🔧 Failed to create blob');
                showError('Error', 'Failed to create image blob. Please try again.');
              }
            }, 'image/png', 0.9);
          }
        };

        img.onerror = () => {
          console.error('🔧 Failed to load image');
          showError('Error', 'Failed to load image. Please try again.');
        };

        img.src = dataUrl;
      } catch (error) {
        console.error('Error processing image:', error);
        // Fallback: save original image
        setAvatarUri(editingImageUri);
        setShowImageEditor(false);
        setCropMode(false);
      }
    }
  };

  const handleCancelEdit = () => {
    setShowImageEditor(false);
    setEditingImageUri(null);
    setImageRotation(0);
    setCropMode(false);
    setCropArea({ x: 0, y: 0, width: 300, height: 300 });
    setIsDragging(false);
    setIsResizing(false);
    setIsCreatingCrop(false);
    setResizeCorner(null);
  };

  // Avatar selection handlers
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

  // Position picker handlers
  const handlePositionPickerOpen = () => {
    setShowPositionPicker(true);
  };

  const handlePositionPickerClose = () => {
    setShowPositionPicker(false);
  };

  const handlePositionSelect = (selectedPosition: string) => {
    console.log('🎯 Position selected:', selectedPosition);
    setPosition(selectedPosition);
    handlePositionPickerClose();
  };

  // Format position for display (capitalize first letter)
  const formatPositionDisplay = (pos: string) => {
    return pos.charAt(0).toUpperCase() + pos.slice(1);
  };

  // Valid role values that work with the database constraint
  // Based on the createProfile function in AuthContext, these are the allowed values
  const validRoles = ['parent', 'child', 'teenager', 'grandparent', 'other'];

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      console.log('📅 Date selected:', date);
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      console.log('📅 Formatted date:', formattedDate);
      setDateOfBirth(formattedDate);
    }
    // Only close modal for native date picker (mobile), not for web
    if (Platform.OS !== 'web') {
      setShowDatePicker(false);
    }
  };

  // Success modal handlers
  const handleContinueToProfile = () => {
    hideSuccessModal();
    router.replace('/(tabs)');
  };

  const handleExploreApp = () => {
    hideSuccessModal();
  };

  // Upload avatar to Supabase Storage
  const uploadAvatarToSupabase = async (avatarUri: string): Promise<string> => {
    try {
      console.log('📤 Starting avatar upload to Supabase Storage...');

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Ensure we have a valid session before attempting upload
      let currentSession = session;
      if (!currentSession?.access_token) {
        console.log('🔄 No valid session found, attempting to refresh...');
        try {
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            throw new Error(`Session refresh failed: ${refreshError.message}`);
          }
          if (!refreshedSession?.access_token) {
            throw new Error('No valid session found even after refresh');
          }
          currentSession = refreshedSession;
          console.log('✅ Session refreshed successfully');
        } catch (refreshError) {
          throw new Error(`Session refresh failed: ${refreshError}`);
        }
      }

      // Convert blob URL to file
      console.log('📤 Fetching avatar from URI...');
      const response = await fetch(avatarUri);

      if (!response.ok) {
        throw new Error(`Failed to fetch avatar: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('📤 Blob created, size:', blob.size, 'bytes');

      if (blob.size === 0) {
        throw new Error('Avatar file is empty');
      }

      // Create a file from the blob
      const file = new File([blob], 'avatar.png', { type: 'image/png' });

      // Generate unique filename with user ID in path
      const timestamp = Date.now();
      const filename = `${user.id}/avatar-${timestamp}.png`;

      // Try uploading to different buckets in order of preference
      const buckets = ['avatar'];

      // for (const "avatar" of buckets) {
      try {
        console.log(`📤 Attempting upload to bucket: ${"avatar"}`);
        console.log('📤 "avatar":', "avatar");
        console.log('📤 filename:', filename);
        console.log('📤 file size:', file.size, 'bytes');
        console.log('📤 user ID:', user.id);
        console.log('📤 session available:', !!currentSession);
        console.log('📤 access token length:', currentSession?.access_token?.length || 0);

        // Add timeout to prevent hanging
        const { data, error } = await supabase.storage
          .from("avatar")
          .upload(filename, file);

        // const timeoutPromise = new Promise((_, reject) =>
        //   setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
        // );

        // const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any;

        console.log('📤 Upload response received');
        console.log('📤 data:', data);
        console.log('📤 error:', error);

        if (error) {
          console.log(`❌ Upload to ${"avatar"} failed:`, error.message);
          // continue; // Try next bucket
        }

        console.log(`✅ Upload successful to bucket: ${"avatar"}`);

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("avatar")
          .getPublicUrl(filename);

        if (!urlData?.publicUrl) {
          console.log(`❌ Failed to get public URL from ${"avatar"}`);
          // continue; // Try next bucket
        }

        console.log('✅ Avatar public URL:', urlData.publicUrl);
        return urlData.publicUrl;

      } catch (bucketError) {
        console.log(`❌ Bucket ${"avatar"} error:`, bucketError);
        console.log(`❌ Error type:`, typeof bucketError);
        console.log(`❌ Error message:`, bucketError);
        // continue; // Try next bucket
      }
      // }

      // If all buckets fail
      throw new Error('Failed to upload avatar to any available storage bucket');

    } catch (error: any) {
      console.error('❌ Avatar upload failed:', error);

      // Check if it's a bucket not found error
      if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
        throw new Error('Storage bucket not configured. Please contact support to set up storage buckets.');
      }

      // Check if it's an authentication error
      if (error.message?.includes('JWT') || error.message?.includes('auth')) {
        throw new Error('Authentication failed. Please log in again.');
      }

      throw new Error(`Avatar upload failed: ${error.message}`);
    }
  };

  const handleUpdateProfile = () => {
    console.log('🚀 handleUpdateProfile called!');
    console.log('🚀 firstName:', firstName);
    console.log('🚀 lastName:', lastName);
    console.log('🚀 isUpdatingProfile:', isUpdatingProfile);
    console.log('🚀 isLoadingUserData:', isLoadingUserData);

    if (!firstName.trim() || !lastName.trim()) {
      console.log('❌ Validation failed - missing first or last name');
      showError('Validation Error', 'Please fill in both first name and last name.');
      return;
    }

    console.log('✅ Validation passed - showing confirmation modal');
    // Show confirmation modal with animation
    showConfirmationModal();
  };

  // Confirmation modal handlers
  const showConfirmationModal = () => {
    setUpdateConfirmationVisible(true);
  };

  const hideConfirmationModal = () => {
    setUpdateConfirmationVisible(false);
  };

  // Success modal handlers
  const showSuccessModal = () => {
    setSuccessModalVisible(true);
  };

  const hideSuccessModal = () => {
    setSuccessModalVisible(false);
  };


  const handleConfirmUpdate = async () => {
    console.log('🚀 handleConfirmUpdate called!');
    console.log('🚀 About to start profile update process...');
    console.log('🚀 Current user:', user);
    console.log('🚀 Current session:', session);
    console.log('🚀 updateProfile function available:', typeof updateProfile);

    hideConfirmationModal();

    // Start loading for profile update
    setIsUpdatingProfile(true);

    // Add timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log('⚠️ Profile update timeout reached, stopping loading state');
      setIsUpdatingProfile(false);
      showError('Update Timeout', 'Profile update is taking longer than expected. Please check your internet connection and try again.');
    }, 30000); // 30 second timeout
    try {
      // Critical validation checks for navigation from signup
      if (!user || !session) {
        throw new Error('Authentication required. Please sign in again.');
      }

      if (!session.access_token) {
        console.log('🔄 No valid session found, attempting to refresh...');
        try {
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            throw new Error(`Session refresh failed: ${refreshError.message}`);
          }
          if (!refreshedSession?.access_token) {
            throw new Error('No valid session found even after refresh - please sign in again');
          }
          console.log('✅ Session refreshed successfully');
        } catch (refreshError) {
          throw new Error(`Session refresh failed: ${refreshError.message}`);
        }
      }
      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      // Prepare update data with validation

      // Ensure name is not empty
      if (!fullName || fullName.trim() === '') {
        throw new Error('Name cannot be empty. Please enter both first and last name.');
      }

      console.log('🔍 Debug - Current state values:');
      console.log('🔍 firstName:', firstName, '(type:', typeof firstName, ')');
      console.log('🔍 lastName:', lastName, '(type:', typeof lastName, ')');
      console.log('🔍 fullName:', fullName, '(type:', typeof fullName, ')');
      console.log('🔍 dateOfBirth:', dateOfBirth, '(type:', typeof dateOfBirth, ')');
      console.log('🔍 position:', position, '(type:', typeof position, ')');
      console.log('🔍 avatarUri:', avatarUri, '(type:', typeof avatarUri, ')');
      console.log('🔍 avatarUri length:', avatarUri?.length);
      console.log('🔍 avatarUrl (state):', avatarUrl, '(type:', typeof avatarUrl, ')');
      console.log('🔍 interests (from localStorage):', interests, '(type:', typeof interests, ')');

      console.log('🔍 Field processing starting...');

      // Initialize finalAvatarUrl with current state
      let finalAvatarUrl = avatarUrl; // Start with existing avatarUrl state

      // Always add birth_date (even if empty, let user clear it)
      // updateData.birth_date = dateOfBirth && dateOfBirth.trim() ? dateOfBirth.trim() : null;
      // console.log('✅ Added birth_date (Date of Birth from picker):', updateData.birth_date);
      console.log('✅ This will be saved to profiles.birth_date in Supabase');

      // Always add role (even if empty, let user clear it)
      const roleValue = position && position.trim() ? position.trim() : null;

      // Validate role against database constraint only if it has a value
      if (roleValue && !validRoles.includes(roleValue)) {
        console.error('❌ Invalid role value:', roleValue);
        console.error('❌ Allowed roles:', validRoles);
        throw new Error(`Invalid role selected. Please choose from: ${validRoles.join(', ')}`);
      }

      // updateData.role = roleValue;
      // console.log('✅ Added role (from position field):', updateData.role);

      // Add interests field (empty array for now - can be enhanced later)
      // updateData.interests = [];
      // console.log('✅ Added interests:', updateData.interests);

      // Log current updateData state
      // console.log('📊 Current updateData after field processing:', updateData);

      // Process avatar if available - upload to Supabase Storage

      if (avatarUri && avatarUri.trim()) {
        try {
          console.log('📤 Uploading avatar to Supabase Storage...');
          console.log('📤 avatarUri:', avatarUri);
          console.log('📤 avatarUri type:', typeof avatarUri);
          console.log('📤 avatarUri length:', avatarUri.length);
          console.log('📤 About to call uploadAvatarToSupabase function...');
          console.log('📤 uploadAvatarToSupabase function type:', typeof uploadAvatarToSupabase);

          // Validate uploadAvatarToSupabase function exists
          if (typeof uploadAvatarToSupabase !== 'function') {
            throw new Error('uploadAvatarToSupabase function is not available');
          }

          // Try upload with retry mechanism
          let uploadedAvatarUrl;
          let uploadAttempts = 0;
          const maxAttempts = 3;

          while (uploadAttempts < maxAttempts) {
            try {
              uploadAttempts++;
              console.log(`📤 Upload attempt ${uploadAttempts}/${maxAttempts}`);

              uploadedAvatarUrl = await uploadAvatarToSupabase(avatarUri);
              console.log('📤 uploadAvatarToSupabase returned:', uploadedAvatarUrl);

              if (uploadedAvatarUrl && uploadedAvatarUrl.trim()) {
                console.log('✅ Upload successful on attempt', uploadAttempts);
                break;
              } else {
                throw new Error('Upload returned empty URL');
              }
            } catch (attemptError: any) {
              console.error(`❌ Upload attempt ${uploadAttempts} failed:`, attemptError);

              if (uploadAttempts >= maxAttempts) {
                throw attemptError; // Re-throw the last error
              }

              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
            }
          }

          setAvatarUrl(uploadedAvatarUrl || '');
          finalAvatarUrl = uploadedAvatarUrl || ''; // Use the uploaded URL directly
          console.log('✅ Avatar uploaded to Supabase Storage!');
          console.log('✅ Supabase Storage URL saved as avatar_url:', uploadedAvatarUrl);
          console.log('✅ This URL will be saved to profiles.avatar_url in database');
        } catch (uploadError: any) {
          console.error('❌ Avatar upload failed:', uploadError);

          // Fallback: Convert to data URL and store in database
          try {
            console.log('🔄 Falling back to data URL storage...');
            const response = await fetch(avatarUri);
            const blob = await response.blob();

            // Compress if too large
            if (blob.size > 500000) {
              console.log('🔄 Compressing large avatar...');
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const img = new Image();

              // Convert blob URL to data URL to avoid CORS issues
              const response = await fetch(avatarUri);
              const blob = await response.blob();
              const reader = new FileReader();

              const dataUrl = await new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });

              const compressedDataUrl = await new Promise<string>((resolve, reject) => {
                img.onload = () => {
                  const maxSize = 200;
                  const ratio = Math.min(maxSize / img.width, maxSize / img.height);
                  canvas.width = img.width * ratio;
                  canvas.height = img.height * ratio;

                  ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                  resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.onerror = reject;
                img.src = dataUrl;
              });

              setAvatarUrl(compressedDataUrl);
              finalAvatarUrl = compressedDataUrl; // Use the compressed data URL directly
              console.log('✅ Avatar stored as compressed data URL');
            } else {
              const reader = new FileReader();
              const dataUrl = await new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });

              setAvatarUrl(dataUrl);
              finalAvatarUrl = dataUrl; // Use the data URL directly
              console.log('✅ Avatar stored as data URL');
            }
          } catch (fallbackError) {
            console.error('❌ Data URL fallback also failed:', fallbackError);
            console.log('⚠️ Continuing without avatar...');
          }
        }
      } else {
        console.log('❌ No avatarUri to add');
      }

      console.log('🔍 finalAvatarUrl (final value):', finalAvatarUrl, '(type:', typeof finalAvatarUrl, ')');

      const updateData: any = {
        name: fullName,
        birth_date: dateOfBirth,
        role: roleValue,
        avatar_url: finalAvatarUrl,
        interests: interests,
      };
      // Log final updateData state after all processing
      console.log('📊 Final updateData after all processing:', updateData);
      console.log('📝 Final update data being sent:', updateData);
      console.log('📝 Field mappings to profiles table:');
      console.log('📝 - name (firstName + lastName):', updateData.name);
      console.log('📝 - birth_date (dateOfBirth):', updateData.birth_date);
      console.log('📝 - role (position):', updateData.role);
      console.log('📝 - avatar_url (Supabase Storage URL):', updateData.avatar_url ? 'Present' : 'Not present');
      console.log('📝 - interests (from localStorage):', updateData.interests);

      // Verify all required fields are present
      console.log('🔍 Field verification:');
      console.log('🔍 - name field:', updateData.name ? '✅ Present' : '❌ Missing');
      console.log('🔍 - birth_date field:', updateData.birth_date ? '✅ Present' : '⚠️ Empty/Null');
      console.log('🔍 - role field (position):', updateData.role ? '✅ Present' : '⚠️ Empty/Null');
      console.log('🔍 - avatar_url field (Supabase Storage URL):', updateData.avatar_url ? '✅ Present' : '⚠️ Empty/Null');
      console.log('🔍 - interests field:', updateData.interests ? '✅ Present' : '⚠️ Empty/Null');

      // Final validation before sending
      if (!updateData.name || updateData.name.trim() === '') {
        throw new Error('Name is required and cannot be empty');
      }

      console.log('✅ All validations passed, sending update to database...');

      try {
        console.log('🚀 About to call updateProfile function...');
        console.log('🚀 updateData being sent:', updateData);
        console.log('🚀 updateProfile function type:', typeof updateProfile);
        console.log('🚀 updateProfile function:', updateProfile);

        if (typeof updateProfile !== 'function') {
          throw new Error('updateProfile is not a function');
        }

        // Add a small delay to ensure session is fully established when navigating from signup
        await new Promise(resolve => setTimeout(resolve, 500));

        const result = await updateProfile(updateData);
        console.log('✅ Profile update successful!');
        console.log('✅ Profile update result:', result);
        console.log('✅ Data saved to profiles table:');
        console.log('✅ - name:', updateData.name);
        console.log('✅ - birth_date:', updateData.birth_date);
        console.log('✅ - role:', updateData.role);
        console.log('✅ - avatar_url:', updateData.avatar_url);

        // Confirm all fields were saved
        console.log('🎉 All fields successfully saved to profiles table!');
        console.log('🎉 - Name (firstName + lastName):', updateData.name);
        console.log('🎉 - Birth Date (birth_date):', updateData.birth_date || 'Not set');
        console.log('🎉 - Position/Role (role):', updateData.role || 'Not set');
        console.log('🎉 - Avatar URL (avatar_url - Supabase Storage):', updateData.avatar_url || 'Not set');
        console.log('🎉 - Interests (from localStorage):', updateData.interests || 'Not set');
        // Show success modal instead of alert
        showSuccessModal();
      } catch (updateError: any) {
        console.error('❌ Profile update failed, trying fallback approach:', updateError);

        // Try updating without avatar first (avatar might be too large)
        if (updateData.avatar_url) {
          console.log('🔄 Trying update without avatar...');
          const updateDataWithoutAvatar = { ...updateData };
          delete updateDataWithoutAvatar.avatar_url;

          try {
            await updateProfile(updateDataWithoutAvatar);
            showError('Partial Update', 'Profile updated successfully, but avatar could not be saved. Please try uploading a smaller image.');
            router.replace('/(tabs)');
            return;
          } catch (fallbackError) {
            console.error('❌ Fallback update also failed:', fallbackError);
          }
        }

        // Try updating with minimal data (just name)
        console.log('🔄 Trying update with minimal data...');
        const minimalUpdateData = {
          name: updateData.name,
          updated_at: new Date().toISOString(),
        };

        try {
          await updateProfile(minimalUpdateData);
          showError('Partial Update', 'Only name was updated. Please try again for other fields.');
          router.replace('/(tabs)');
          return;
        } catch (minimalError) {
          console.error('❌ Minimal update also failed:', minimalError);
          throw updateError; // Re-throw original error
        }
      }
    } catch (error: any) {
      console.error('❌ Profile update error in edit page:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      });

      let errorMessage = 'Failed to update profile. Please try again.';

      if (error.message?.includes('role_check') || error.message?.includes('profiles_role_check') || error.message?.includes('violates check constraint')) {
        errorMessage = `Invalid position selected. Please choose from: ${validRoles.join(', ')}`;
      } else if (error.message?.includes('avatar')) {
        errorMessage = 'Failed to update avatar. Please try again.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes('No user logged in')) {
        errorMessage = 'You are not logged in. Please sign in again.';
      } else if (error.message?.includes('No valid session found')) {
        errorMessage = 'Your session has expired. Please sign in again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      showError('Update Failed', errorMessage);
    } finally {
      // Clear timeout and stop loading animations
      clearTimeout(loadingTimeout);
      setIsUpdatingProfile(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Loading Interface for User Data */}
      {(isLoadingUserData || !isProfileDataLoaded || authLoading || familyLoading) && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <View style={styles.loadingSpinner}>
              <View style={styles.spinnerCircle} />
            </View>
            <Text style={styles.loadingText}>Loading your profile...</Text>
            <View style={styles.loadingDots}>
              <View style={styles.loadingDot} />
              <View style={styles.loadingDot} />
              <View style={styles.loadingDot} />
            </View>
          </View>
        </View>
      )}

      {/* Loading Interface for Profile Update */}
      {isUpdatingProfile && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <View style={styles.loadingSpinner}>
              <View style={styles.spinnerCircle} />
            </View>
            <Text style={styles.loadingText}>Updating your profile...</Text>
            <View style={styles.loadingDots}>
              <View style={styles.loadingDot} />
              <View style={styles.loadingDot} />
              <View style={styles.loadingDot} />
            </View>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <ChevronLeft size={24} color="#17f196" />
        </Pressable>
        <Text style={styles.headerTitle}>My Work Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Main Content Card */}
        <View style={styles.contentCard}>
          {/* Section Title */}
          <Text style={styles.sectionTitle}>Personal Data Information</Text>
          <Text style={styles.sectionSubtitle}>Your personal data information</Text>

          {/* Profile Photo Upload Section */}
          <View style={styles.photoUploadSection}>

            <View style={styles.photoPlaceholder}>
              <Pressable
                style={styles.avatarMainArea}
                onPress={handleAvatarPress}
                disabled={isUploadingAvatar}
              >
                {avatarUri ? (
                  <RNImage
                    key={avatarUri} // Force re-render when URI changes
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

              {/* Refresh Button (Top Right) */}
              <Pressable
                style={[styles.uploadButton, isUploadingAvatar && styles.uploadButtonLoading]}
                onPress={avatarUri ? handleRefreshClick : handleAvatarPress}
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
          <View style={styles.inputFieldsContainer}>
            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <View style={styles.inputContainer}>
                <RNImage
                  source={require('@/assets/images/icon/user_input.png')}
                  style={styles.inputIconImage}
                  resizeMode="contain"
                />
                <TextInput
                  style={styles.textInput}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First Name"
                  placeholderTextColor="#888888"
                />
              </View>
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <View style={styles.inputContainer}>
                <RNImage
                  source={require('@/assets/images/icon/user_input.png')}
                  style={styles.inputIconImage}
                  resizeMode="contain"
                />
                <TextInput
                  style={styles.textInput}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last Name"
                  placeholderTextColor="#888888"
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <Pressable
                style={styles.inputContainer}
                onPress={handleDatePickerOpen}
              >
                <RNImage
                  source={require('@/assets/images/icon/calendar.png')}
                  style={styles.inputIcon}
                  resizeMode="contain"
                />
                <Text style={[styles.textInput, !dateOfBirth && styles.placeholderText]}>
                  {dateOfBirth || 'Date of Birth'}
                </Text>
                <ChevronDown size={20} color="#17f196" style={styles.inputChevron} />
              </Pressable>
            </View>

            {/* Position */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Position</Text>
              <Pressable
                style={styles.inputContainer}
                onPress={handlePositionPickerOpen}
              >
                <RNImage
                  source={require('@/assets/images/icon/keyboard.png')}
                  style={styles.inputIcon}
                  resizeMode="contain"
                />
                <Text style={[styles.textInput, !position && styles.placeholderText]}>
                  {position ? formatPositionDisplay(position) : 'Select Position'}
                </Text>
                <ChevronDown size={20} color="#17f196" style={styles.inputChevron} />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Update Profile Button */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.updateButton, (isUpdatingProfile || isLoadingUserData || !isProfileDataLoaded || authLoading || familyLoading) && styles.updateButtonDisabled]}
          onPress={() => {
            console.log('🔘 Update Profile button pressed!');
            console.log('🔘 isUpdatingProfile:', isUpdatingProfile);
            console.log('🔘 isLoadingUserData:', isLoadingUserData);
            console.log('🔘 isProfileDataLoaded:', isProfileDataLoaded);
            console.log('🔘 authLoading:', authLoading);
            console.log('🔘 familyLoading:', familyLoading);
            console.log('🔘 Button disabled:', isUpdatingProfile || isLoadingUserData || !isProfileDataLoaded || authLoading || familyLoading);
            if (!isUpdatingProfile && !isLoadingUserData && isProfileDataLoaded && !authLoading && !familyLoading) {
              handleUpdateProfile();
            } else {
              console.log('❌ Button is disabled, cannot call handleUpdateProfile');
            }
          }}
          disabled={isUpdatingProfile || isLoadingUserData || !isProfileDataLoaded || authLoading || familyLoading}
        >
          <Text style={styles.updateButtonText}>
            {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
          </Text>
        </Pressable>

        {/* Debug button to force enable */}
        {(isLoadingUserData || !isProfileDataLoaded || authLoading || familyLoading) && (
          <Pressable
            style={[styles.updateButton, { backgroundColor: '#ff6b6b', marginTop: 10 }]}
            onPress={() => {
              console.log('🔧 Force enabling button by setting loading states to false');
              setIsLoadingUserData(false);
              setIsProfileDataLoaded(true);
            }}
          >
            <Text style={styles.updateButtonText}>Force Enable (Debug)</Text>
          </Pressable>
        )}
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="none"
        onRequestClose={handleDatePickerClose}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <Pressable
                onPress={handleDatePickerClose}
                style={styles.datePickerCancelButton}
              >
                <Text style={styles.datePickerCancelText}>Cancel</Text>
              </Pressable>
              <Text style={styles.datePickerTitle}>Select Date of Birth</Text>
              <Pressable
                onPress={handleDatePickerClose}
                style={styles.datePickerDoneButton}
              >
                <Text style={styles.datePickerDoneText}>Done</Text>
              </Pressable>
            </View>
            <View style={styles.datePickerContent}>
              {Platform.OS === 'web' ? (
                <View style={styles.webDatePicker}>
                  <View style={styles.datePickerRow}>
                    <View style={styles.datePickerColumn}>
                      <Text style={styles.datePickerLabel}>Year</Text>
                      <ScrollView style={styles.yearScrollView} showsVerticalScrollIndicator={true}>
                        {Array.from({ length: 125 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                          <Pressable
                            key={year}
                            style={[
                              styles.datePickerOption,
                              selectedDate.getFullYear() === year && styles.datePickerOptionSelected
                            ]}
                            onPress={() => {
                              const newDate = new Date(selectedDate);
                              newDate.setFullYear(year);
                              handleDateChange(null, newDate);
                            }}
                          >
                            <Text style={[
                              styles.datePickerOptionText,
                              selectedDate.getFullYear() === year && styles.datePickerOptionTextSelected
                            ]}>
                              {year}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>

                    <View style={styles.datePickerColumn}>
                      <Text style={styles.datePickerLabel}>Month</Text>
                      <ScrollView style={styles.monthScrollView} showsVerticalScrollIndicator={true}>
                        {[
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((month, index) => (
                          <Pressable
                            key={month}
                            style={[
                              styles.datePickerOption,
                              selectedDate.getMonth() === index && styles.datePickerOptionSelected
                            ]}
                            onPress={() => {
                              const newDate = new Date(selectedDate);
                              newDate.setMonth(index);
                              handleDateChange(null, newDate);
                            }}
                          >
                            <Text style={[
                              styles.datePickerOptionText,
                              selectedDate.getMonth() === index && styles.datePickerOptionTextSelected
                            ]}>
                              {month}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>

                    <View style={styles.datePickerColumn}>
                      <Text style={styles.datePickerLabel}>Day</Text>
                      <ScrollView style={styles.dayScrollView} showsVerticalScrollIndicator={true}>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <Pressable
                            key={day}
                            style={[
                              styles.datePickerOption,
                              selectedDate.getDate() === day && styles.datePickerOptionSelected
                            ]}
                            onPress={() => {
                              const newDate = new Date(selectedDate);
                              newDate.setDate(day);
                              handleDateChange(null, newDate);
                            }}
                          >
                            <Text style={[
                              styles.datePickerOptionText,
                              selectedDate.getDate() === day && styles.datePickerOptionTextSelected
                            ]}>
                              {day}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.nativeDatePicker}>
                  <Text style={styles.datePickerNote}>
                    Native date picker would be implemented here for mobile platforms
                  </Text>
                  <Text style={styles.datePickerNote}>
                    Selected: {selectedDate.toDateString()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Position Picker Modal */}
      <Modal
        visible={showPositionPicker}
        transparent={true}
        animationType="none"
        onRequestClose={handlePositionPickerClose}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <Pressable
                onPress={handlePositionPickerClose}
                style={styles.datePickerCancelButton}
              >
                <Text style={styles.datePickerCancelText}>Cancel</Text>
              </Pressable>
              <Text style={styles.datePickerTitle}>Select Position</Text>
              <Pressable
                onPress={handlePositionPickerClose}
                style={styles.datePickerDoneButton}
              >
                <Text style={styles.datePickerDoneText}>Done</Text>
              </Pressable>
            </View>
            <View style={styles.datePickerContent}>
              <View style={styles.positionPickerContainer}>
                {validRoles.map((positionOption) => (
                  <Pressable
                    key={positionOption}
                    style={[
                      styles.positionOption,
                      position === positionOption && styles.positionOptionSelected
                    ]}
                    onPress={() => handlePositionSelect(positionOption)}
                  >
                    <Text style={[
                      styles.positionOptionText,
                      position === positionOption && styles.positionOptionTextSelected
                    ]}>
                      {formatPositionDisplay(positionOption)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Editing Modal */}
      <Modal
        visible={showImageEditor}
        transparent={true}
        animationType="none"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.imageEditorOverlay}>
          <View style={styles.imageEditorContainer}>
            {/* Header */}
            <View style={styles.imageEditorHeader}>
              <Pressable
                onPress={handleCancelEdit}
                style={styles.imageEditorCancelButton}
              >
                <X size={24} color="#666666" />
              </Pressable>
              <Text style={styles.imageEditorTitle}>Edit Image</Text>
              <Pressable
                onPress={handleSaveEditedImage}
                style={styles.imageEditorSaveButton}
              >
                <Check size={24} color="#17f196" />
              </Pressable>
            </View>

            {/* Image Display Area */}
            <View style={styles.imageEditorContent}>
              {editingImageUri && (
                <View style={styles.imageEditorImageWrapper}>
                  <View
                    style={[
                      styles.imageEditorImageContainer,
                      {
                        transform: [
                          { rotate: `${imageRotation}deg` },
                          { scale: 1 }
                        ]
                      }
                    ]}
                  >
                    <RNImage
                      source={{ uri: editingImageUri }}
                      style={styles.imageEditorImage}
                      resizeMode="contain"
                    />
                  </View>

                  {/* Crop Overlay */}
                  {cropMode && (
                    <View style={styles.cropOverlay}>
                      {/* Dark overlay parts */}
                      <View style={[styles.cropOverlayTop, { height: cropArea.y }]} />
                      <View style={[styles.cropOverlayBottom, {
                        top: cropArea.y + cropArea.height,
                        height: 300 - cropArea.y - cropArea.height
                      }]} />
                      <View style={[styles.cropOverlayLeft, {
                        top: cropArea.y,
                        width: cropArea.x,
                        height: cropArea.height
                      }]} />
                      <View style={[styles.cropOverlayRight, {
                        left: cropArea.x + cropArea.width,
                        top: cropArea.y,
                        width: 300 - cropArea.x - cropArea.width,
                        height: cropArea.height
                      }]} />

                      {/* Bright selected area */}
                      <View
                        style={[
                          styles.cropArea,
                          {
                            left: cropArea.x,
                            top: cropArea.y,
                            width: cropArea.width,
                            height: cropArea.height,
                          }
                        ]}
                        onTouchStart={handleCropAreaPress}
                        onTouchMove={handleCropAreaMove}
                        onTouchEnd={handleCropAreaRelease}
                      />

                      {/* Corner handles - outside of crop area to avoid event conflicts */}
                      <View
                        style={[styles.cropCorner, {
                          left: cropArea.x - 14,
                          top: cropArea.y - 14,
                        }]}
                        onTouchStart={(event) => {
                          handleCornerPress('topLeft', event);
                          event.stopPropagation();
                        }}
                        onTouchMove={handleCornerMove}
                        onTouchEnd={handleCropAreaRelease}
                      />
                      <View
                        style={[styles.cropCorner, styles.cropCornerTopRight, {
                          left: cropArea.x + cropArea.width - 14,
                          top: cropArea.y - 14,
                        }]}
                        onTouchStart={(event) => {
                          handleCornerPress('topRight', event);
                          event.stopPropagation();
                        }}
                        onTouchMove={handleCornerMove}
                        onTouchEnd={handleCropAreaRelease}
                      />
                      <View
                        style={[styles.cropCorner, styles.cropCornerBottomLeft, {
                          left: cropArea.x - 14,
                          top: cropArea.y + cropArea.height - 14,
                        }]}
                        onTouchStart={(event) => {
                          handleCornerPress('bottomLeft', event);
                          event.stopPropagation();
                        }}
                        onTouchMove={handleCornerMove}
                        onTouchEnd={handleCropAreaRelease}
                      />
                      <View
                        style={[styles.cropCorner, styles.cropCornerBottomRight, {
                          left: cropArea.x + cropArea.width - 14,
                          top: cropArea.y + cropArea.height - 14,
                        }]}
                        onTouchStart={(event) => {
                          handleCornerPress('bottomRight', event);
                          event.stopPropagation();
                        }}
                        onTouchMove={handleCornerMove}
                        onTouchEnd={handleCropAreaRelease}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Control Buttons */}
            <View style={styles.imageEditorControls}>
              <Pressable
                style={[styles.imageEditorControlButton, cropMode && styles.imageEditorControlButtonActive]}
                onPress={handleToggleCropMode}
              >
                <Crop size={24} color={cropMode ? "#FFFFFF" : "#17f196"} />
                <Text style={[styles.imageEditorControlText, cropMode && styles.imageEditorControlTextActive]}>
                  {cropMode ? 'Exit Crop' : 'Crop'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.imageEditorControlButton}
                onPress={handleRotateImage}
              >
                <RotateCw size={24} color="#17f196" />
                <Text style={styles.imageEditorControlText}>Rotate</Text>
              </Pressable>

              <Pressable
                style={styles.imageEditorControlButton}
                onPress={handleResetCrop}
              >
                <RotateCcw size={24} color="#17f196" />
                <Text style={styles.imageEditorControlText}>Reset</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Update Profile Confirmation Modal */}
      {isUpdateConfirmationVisible && (
        <View style={styles.confirmationModalOverlay}>
          <BlurView
            style={styles.blurOverlay}
            intensity={80}
            tint="dark"
          />
          <View style={styles.confirmationModalContainer}>
            {/* Icon */}
            <View style={styles.confirmationIconContainer}>
              <View style={styles.confirmationIcon}>
                <RNImage
                  source={require('@/assets/images/icon/user.png')}
                  style={styles.confirmationIconImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.confirmationTitle}>Update Profile</Text>

            {/* Message */}
            <Text style={styles.confirmationMessage}>
              Are you sure you want to update your profile? This will help us improve your experience and provide personalized features.
            </Text>

            {/* Buttons */}
            <View style={styles.confirmationButtons}>
              <Pressable
                style={[styles.confirmationButton, styles.confirmButton]}
                onPress={handleConfirmUpdate}
              >
                <Text style={styles.confirmButtonText}>Yes, Update Profile</Text>
              </Pressable>

              <Pressable
                style={[styles.confirmationButton, styles.cancelButton]}
                onPress={hideConfirmationModal}
              >
                <Text style={styles.cancelButtonText}>No, Let me check</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Success Modal */}
      {isSuccessModalVisible && (
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
            <Text style={styles.successTitle}>Profile Updated!</Text>

            {/* Description */}
            <Text style={styles.successDescription}>
              Your profile has been successfully updated. We're excited to see you take this step!
            </Text>

            {/* Button */}
            <View style={styles.successButtonContainer}>
              <Pressable
                style={[styles.successPrimaryButton]}
                onPress={handleContinueToProfile}
              >
                <Text style={styles.successPrimaryButtonText}>Visit My Profile</Text>
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
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'Arial',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'Semi Bold',
    color: '#000000',
    marginBottom: 8,
    fontFamily: 'Arial',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontStyle: 'regular',
    fontWeight: '400',
    color: '#667085',
    marginBottom: 32,
    fontFamily: 'Arial',
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
    fontStyle: 'medium',
    color: '#475467',
    marginBottom: 8,
    fontFamily: 'Arial',
  },
  uploadGuidelines: {
    fontSize: 10,
    fontWeight: '400',
    fontStyle: 'regular',
    color: '#667085',
    textAlign: 'center',
    lineHeight: 16,
    width: 190,
    fontFamily: 'Arial',
  },
  inputFieldsContainer: {
    gap: 20,
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
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#98a2b3',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputIconImage: {
    width: 20,
    height: 20,
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
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#161618',
    fontFamily: 'Helvetica',
  },
  placeholderText: {
    color: '#CCCCCC',
  },
  inputChevron: {
    marginLeft: 12,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  updateButton: {
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
  updateButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  updateButtonText: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  // Date Picker Modal Styles
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  datePickerCancelButton: {
    padding: 8,
  },
  datePickerCancelText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Arial',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'Arial',
  },
  datePickerDoneButton: {
    padding: 8,
  },
  datePickerDoneText: {
    fontSize: 16,
    color: '#17f196',
    fontWeight: '600',
    fontFamily: 'Arial',
  },
  datePickerContent: {
    padding: 20,
    alignItems: 'center',
  },
  datePicker: {
    width: '100%',
    height: 200,
  },
  webDatePicker: {
    width: '100%',
    height: 300,
  },
  datePickerRow: {
    flexDirection: 'row',
    height: '100%',
    justifyContent: 'space-between',
  },
  datePickerColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  datePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Arial',
  },
  yearScrollView: {
    height: 250,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  monthScrollView: {
    height: 250,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  dayScrollView: {
    height: 250,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  datePickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  datePickerOptionSelected: {
    backgroundColor: '#17f196',
  },
  datePickerOptionText: {
    fontSize: 14,
    color: '#333333',
    fontFamily: 'Arial',
  },
  datePickerOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  nativeDatePicker: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  datePickerNote: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Arial',
  },
  // Position Picker Styles
  positionPickerContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  positionOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  positionOptionSelected: {
    backgroundColor: '#17f196',
    borderColor: '#17f196',
  },
  positionOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Arial',
  },
  positionOptionTextSelected: {
    color: '#FFFFFF',
  },
  // Image Editor Modal Styles
  imageEditorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageEditorContainer: {
    width: '90%',
    height: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageEditorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  imageEditorCancelButton: {
    padding: 8,
  },
  imageEditorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'Arial',
  },
  imageEditorSaveButton: {
    padding: 8,
  },
  imageEditorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  imageEditorImageContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageEditorImage: {
    width: '100%',
    height: '100%',
  },
  imageEditorControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  imageEditorControlButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    minWidth: 80,
  },
  imageEditorControlText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#17f196',
    marginTop: 4,
    fontFamily: 'Arial',
  },
  imageEditorControlButtonActive: {
    backgroundColor: '#17f196',
  },
  imageEditorControlTextActive: {
    color: '#FFFFFF',
  },
  imageEditorImageWrapper: {
    position: 'relative',
    width: 300,
    height: 300,
  },
  cropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cropOverlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  cropOverlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  cropOverlayLeft: {
    position: 'absolute',
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  cropOverlayRight: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  cropArea: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#17f196',
    backgroundColor: 'rgba(23, 241, 150, 0.1)',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cropCorner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderWidth: 3,
    borderColor: '#17f196',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    top: -14,
    left: -14,
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 10,
  },
  cropCornerTopRight: {
    top: -14,
    right: -14,
    left: 'auto',
  },
  cropCornerBottomLeft: {
    bottom: -14,
    top: 'auto',
    left: -14,
  },
  cropCornerBottomRight: {
    bottom: -14,
    right: -14,
    top: 'auto',
    left: 'auto',
  },
  // Confirmation Modal Styles (matching signup verification modal)
  confirmationModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 2000,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confirmationModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginHorizontal: 0,
    height: '40%',
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
  confirmationIconContainer: {
    alignItems: 'center',
    marginTop: -70,
    marginBottom: 30,
  },
  confirmationIcon: {
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
  confirmationIconImage: {
    width: 48,
    height: 48,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontStyle: 'Semi Bold',
    color: '#101828',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Helvetica',
  },
  confirmationMessage: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'Medium',
    color: '#393b41',
    textAlign: 'left',
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 14,
    fontFamily: 'Helvetica',
  },
  confirmationButtons: {
    gap: 16,
    marginTop: 'auto',
    paddingBottom: 20,
  },
  confirmationButton: {
    borderRadius: 25,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
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
  confirmButtonText: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  cancelButton: {
    width: '100%',
    height: 50,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#17f196',
    fontFamily: 'Helvetica',
  },

  // Success Modal Styles
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
    fontStyle: 'Semi Bold',
    color: '#101828',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Helvetica',
  },
  successDescription: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'Medium',
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
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },

  // Loading Interface Styles
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4000,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    marginBottom: 20,
  },
  spinnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#E5E5E5',
    borderTopColor: '#17f196',
    borderRightColor: '#17f196',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Arial',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#17f196',
  },
  successSecondaryButton: {
    width: '100%',
    height: 50,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successSecondaryButtonText: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#17f196',
    fontFamily: 'Helvetica',
  },
});
