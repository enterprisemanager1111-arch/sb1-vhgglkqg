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
import Animated, { 
  useSharedValue, 
  withSpring, 
  withTiming, 
  withSequence,
  withDelay,
  withRepeat,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  runOnJS
} from 'react-native-reanimated';
import { User, Calendar, Briefcase, Upload, ChevronLeft, ChevronDown, RefreshCw, Edit3, RotateCw, Check, X, Crop, RotateCcw } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomAlert } from '@/contexts/CustomAlertContext';
import * as ImagePicker from 'expo-image-picker';

// Create animated components
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedText = Animated.createAnimatedComponent(Text);

export default function EditProfile() {
  const { profile, updateProfile } = useAuth();
  const { showSuccess, showError } = useCustomAlert();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editingImageUri, setEditingImageUri] = useState<string | null>(null);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageScale] = useState(1);
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

  // Animation shared values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-50);
  const contentCardOpacity = useSharedValue(0);
  const contentCardScale = useSharedValue(0.8);
  const contentCardTranslateY = useSharedValue(50);
  const photoUploadScale = useSharedValue(0);
  const photoUploadRotation = useSharedValue(0);
  const inputFieldsOpacity = useSharedValue(0);
  const inputFieldsTranslateY = useSharedValue(30);
  const buttonScale = useSharedValue(1);
  const buttonOpacity = useSharedValue(0);
  const modalOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.8);
  const modalTranslateY = useSharedValue(300);
  const positionModalOpacity = useSharedValue(0);
  const positionModalScale = useSharedValue(0.8);
  const positionModalTranslateY = useSharedValue(300);
  const avatarScale = useSharedValue(1);

  // Entrance animations
  useEffect(() => {
    // Header animation
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withSpring(0, { damping: 12, stiffness: 100 });

    // Content card animation
    contentCardOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    contentCardScale.value = withDelay(200, withSpring(1, { damping: 10, stiffness: 100 }));
    contentCardTranslateY.value = withDelay(200, withSpring(0, { damping: 12, stiffness: 100 }));

    // Photo upload animation
    photoUploadScale.value = withDelay(400, withSpring(1, { damping: 8, stiffness: 120 }));
    photoUploadRotation.value = withDelay(400, withSpring(360, { damping: 10, stiffness: 100 }));

    // Input fields animation
    inputFieldsOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    inputFieldsTranslateY.value = withDelay(600, withSpring(0, { damping: 12, stiffness: 100 }));

    // Button animation
    buttonOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
  }, []);

  useEffect(() => {
    if (profile) {
      // Split the name into first and last name
      const nameParts = profile.name ? profile.name.split(' ') : ['', ''];
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setDateOfBirth(profile.birth_date || '');
      setPosition(profile.role || '');
      setAvatarUri(profile.avatar_url || null);
      
      // Set selectedDate if birth_date exists
      if (profile.birth_date) {
        setSelectedDate(new Date(profile.birth_date));
      }
    }
  }, [profile]);

  // Monitor avatar URI changes
  useEffect(() => {
    console.log('🔧 Avatar URI changed to:', avatarUri);
    console.log('🔧 Avatar URI type:', typeof avatarUri);
    console.log('🔧 Avatar URI length:', avatarUri?.length);
  }, [avatarUri]);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const contentCardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentCardOpacity.value,
    transform: [
      { scale: contentCardScale.value },
      { translateY: contentCardTranslateY.value }
    ],
  }));

  const photoUploadAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: photoUploadScale.value },
      { rotate: `${photoUploadRotation.value}deg` }
    ],
  }));

  const inputFieldsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: inputFieldsOpacity.value,
    transform: [{ translateY: inputFieldsTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [
      { scale: modalScale.value },
      { translateY: modalTranslateY.value }
    ],
  }));

  const positionModalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: positionModalOpacity.value,
    transform: [
      { scale: positionModalScale.value },
      { translateY: positionModalTranslateY.value }
    ],
  }));

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  // Interaction animations
  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handleDatePickerOpen = () => {
    setShowDatePicker(true);
    // Modal entrance animation
    modalOpacity.value = withTiming(1, { duration: 300 });
    modalScale.value = withSpring(1, { damping: 10, stiffness: 100 });
    modalTranslateY.value = withSpring(0, { damping: 12, stiffness: 100 });
  };

  const handleDatePickerClose = () => {
    // Modal exit animation
    modalOpacity.value = withTiming(0, { duration: 200 });
    modalScale.value = withTiming(0.8, { duration: 200 });
    modalTranslateY.value = withTiming(300, { duration: 200 }, () => {
      runOnJS(setShowDatePicker)(false);
    });
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
        showSuccess('Success', 'Avatar updated successfully!');
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
        showSuccess('Success', 'Avatar updated successfully!');
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
    showSuccess('Avatar Cleared', 'Your avatar has been cleared successfully!');
  };

  // Handle edit button click
  const handleEditClick = () => {
    console.log('✏️ Edit button clicked');
    if (avatarUri) {
      setEditingImageUri(avatarUri);
      setImageRotation(0);
      setShowImageEditor(true);
    }
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

  const handleCropAreaChange = (newCropArea: { x: number; y: number; width: number; height: number }) => {
    setCropArea(newCropArea);
  };

  const handleCropAreaPress = (event: any) => {
    if (!cropMode) return;
    console.log('🔧 Crop area press triggered');
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
    console.log('🔧 Crop area press:', clientX, clientY, 'crop area:', cropArea);
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
    console.log('🔧 handleCropAreaMove called:', { isDragging, cropMode });
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
    
    console.log('🔧 Crop area move:', { deltaX, deltaY, newX, newY });
    
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
    console.log('🔧 Corner pressed:', corner);
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
    console.log('🔧 Initial position:', clientX, clientY);
    console.log('🔧 Initial crop area:', cropArea);
  };

  const handleCornerMove = (event: any) => {
    console.log('🔧 handleCornerMove called:', { isResizing, cropMode, resizeCorner });
    if (!isResizing || !cropMode || !resizeCorner) return;
    
    // Get the touch position from responder event
    const touch = event.nativeEvent.touches ? event.nativeEvent.touches[0] : event.nativeEvent;
    const clientX = touch.clientX || touch.pageX;
    const clientY = touch.clientY || touch.pageY;
    
    console.log('🔧 Corner move:', resizeCorner, 'current:', clientX, clientY);
    
    const minSize = 50;
    const maxSize = 300;
    
    // Calculate delta from initial position
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    
    console.log('🔧 Delta:', deltaX, deltaY);
    console.log('🔧 Initial crop area:', { x: dragStart.cropX, y: dragStart.cropY, width: dragStart.cropWidth, height: dragStart.cropHeight });
    
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
    
    console.log('🔧 New crop area:', { x: newX, y: newY, width: newWidth, height: newHeight });
    
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
        console.log('🔧 Saving edited image with crop area:', cropArea);
        
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
        
        img.onload = () => {
          console.log('🔧 Image loaded, applying crop and rotation');
          
          // Set canvas size to crop area
          canvas.width = cropArea.width;
          canvas.height = cropArea.height;
          
          if (ctx) {
            console.log('🔧 Canvas context available, drawing image');
            console.log('🔧 Image dimensions:', img.width, 'x', img.height);
            console.log('🔧 Canvas dimensions:', canvas.width, 'x', canvas.height);
            console.log('🔧 Crop area:', cropArea);
            
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
            
            console.log('🔧 Scaled crop coordinates:', {
              original: cropArea,
              scaled: { x: scaledCropX, y: scaledCropY, width: scaledCropWidth, height: scaledCropHeight },
              scale: { x: scaleX, y: scaleY }
            });
            
            // Clear canvas first
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw cropped and rotated image
            ctx.drawImage(
              img,
              scaledCropX, scaledCropY, scaledCropWidth, scaledCropHeight,
              0, 0, cropArea.width, cropArea.height
            );
            
            console.log('🔧 Image drawn to canvas');
            console.log('🔧 Canvas data URL (first 100 chars):', canvas.toDataURL().substring(0, 100));
            
            // Create a preview to verify the crop
            const previewCanvas = document.createElement('canvas');
            const previewCtx = previewCanvas.getContext('2d');
            previewCanvas.width = 100;
            previewCanvas.height = 100;
            if (previewCtx) {
              previewCtx.drawImage(canvas, 0, 0, 100, 100);
              console.log('🔧 Crop preview data URL:', previewCanvas.toDataURL().substring(0, 50) + '...');
            }
            
            // Convert to blob and create new URI
            canvas.toBlob((blob) => {
              if (blob) {
                console.log('🔧 Blob created, setting new avatar URI');
                const newUri = URL.createObjectURL(blob);
                console.log('🔧 New avatar URI:', newUri);
                console.log('🔧 Blob size:', blob.size, 'bytes');
                console.log('🔧 Previous avatar URI:', avatarUri);
                
                // Test if the blob URL is accessible
                const testImg = new Image();
                testImg.onload = () => {
                  console.log('🔧 Blob URL test successful - image loaded');
                  console.log('🔧 Test image dimensions:', testImg.width, 'x', testImg.height);
                  setAvatarUri(newUri);
                  console.log('🔧 Avatar URI set to:', newUri);
                };
                testImg.onerror = () => {
                  console.error('🔧 Blob URL test failed - image could not load');
                  // Still try to set the URI
                  setAvatarUri(newUri);
                  console.log('🔧 Avatar URI set to (despite test failure):', newUri);
                };
                testImg.src = newUri;
                setShowImageEditor(false);
                setCropMode(false);
                showSuccess('Success', 'Avatar updated successfully!');
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
        
        img.src = editingImageUri;
      } catch (error) {
        console.error('Error processing image:', error);
        // Fallback: save original image
        setAvatarUri(editingImageUri);
        setShowImageEditor(false);
        setCropMode(false);
        showSuccess('Success', 'Avatar updated successfully!');
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
    
    avatarScale.value = withSequence(
      withSpring(0.95, { damping: 15, stiffness: 300 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
  };

  // Position picker handlers
  const handlePositionPickerOpen = () => {
    setShowPositionPicker(true);
    // Position modal entrance animation
    positionModalOpacity.value = withTiming(1, { duration: 300 });
    positionModalScale.value = withSpring(1, { damping: 10, stiffness: 100 });
    positionModalTranslateY.value = withSpring(0, { damping: 12, stiffness: 100 });
  };

  const handlePositionPickerClose = () => {
    // Position modal exit animation
    positionModalOpacity.value = withTiming(0, { duration: 200 });
    positionModalScale.value = withTiming(0.8, { duration: 200 });
    positionModalTranslateY.value = withTiming(300, { duration: 200 }, () => {
      runOnJS(setShowPositionPicker)(false);
    });
  };

  const handlePositionSelect = (selectedPosition: string) => {
    setPosition(selectedPosition);
    handlePositionPickerClose();
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      setDateOfBirth(formattedDate);
    }
    // Only close modal for native date picker (mobile), not for web
    if (Platform.OS !== 'web') {
      setShowDatePicker(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showError('Validation Error', 'Please fill in both first name and last name.');
      return;
    }

    setLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await updateProfile({
        name: fullName,
        birth_date: dateOfBirth || undefined,
        role: position || undefined,
        avatar_url: avatarUri || undefined,
      });
      
      showSuccess('Success', 'Profile updated successfully!');
      router.back();
    } catch (error: any) {
      showError('Update Failed', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <AnimatedView style={[styles.header, headerAnimatedStyle]}>
        <AnimatedPressable 
          style={styles.backButton} 
          onPress={() => router.back()}
          onPressIn={() => {
            buttonScale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
          }}
          onPressOut={() => {
            buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
          }}
        >
          <ChevronLeft size={24} color="#17f196" />
        </AnimatedPressable>
        <AnimatedText style={styles.headerTitle}>My Work Profile</AnimatedText>
        <View style={styles.headerSpacer} />
      </AnimatedView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Main Content Card */}
        <AnimatedView style={[styles.contentCard, contentCardAnimatedStyle]}>
          {/* Section Title */}
          <AnimatedText style={styles.sectionTitle}>Personal Data Information</AnimatedText>
          <AnimatedText style={styles.sectionSubtitle}>Your personal data information</AnimatedText>

          {/* Profile Photo Upload Section */}
          <AnimatedView style={[styles.photoUploadSection, photoUploadAnimatedStyle]}>
            
            <AnimatedView style={[styles.photoPlaceholder, avatarAnimatedStyle]}>
              <AnimatedPressable 
                style={styles.avatarMainArea}
                onPress={handleAvatarPress}
                disabled={isUploadingAvatar}
                onPressIn={() => {
                  if (!isUploadingAvatar) {
                    avatarScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
                  }
                }}
                onPressOut={() => {
                  if (!isUploadingAvatar) {
                    avatarScale.value = withSpring(1, { damping: 15, stiffness: 300 });
                  }
                }}
              >
                {avatarUri ? (
                  <RNImage 
                    key={avatarUri} // Force re-render when URI changes
                    source={{ uri: avatarUri }} 
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <AnimatedView style={styles.photoIcon}>
                <User size={40} color="#17f196" />
                  </AnimatedView>
                )}
              </AnimatedPressable>
              
              {/* Refresh Button (Top Right) */}
              <AnimatedPressable 
                style={[styles.uploadButton, isUploadingAvatar && styles.uploadButtonLoading]}
                onPress={avatarUri ? handleRefreshClick : handleAvatarPress}
                disabled={isUploadingAvatar}
              >
                {avatarUri ? (
                  <RefreshCw size={16} color={isUploadingAvatar ? "#CCCCCC" : "#FFFFFF"} />
                ) : (
                  <Upload size={16} color={isUploadingAvatar ? "#CCCCCC" : "#FFFFFF"} />
                )}
              </AnimatedPressable>

              {/* Edit Button (Bottom Right) - Only show when image exists */}
              {avatarUri && (
                <AnimatedPressable 
                  style={styles.editButton}
                  onPress={handleEditClick}
                  disabled={isUploadingAvatar}
                >
                  <Edit3 size={14} color="#FFFFFF" />
                </AnimatedPressable>
              )}
            </AnimatedView>
            <AnimatedText style={styles.uploadLabel}>
              {avatarUri ? 'Change Photo' : 'Upload Photo'}
            </AnimatedText>
            <AnimatedText style={styles.uploadGuidelines}>
              Format should be in .jpeg .png atleast 800×800px and less than 5MB
            </AnimatedText>
          </AnimatedView>

          {/* Input Fields */}
          <AnimatedView style={[styles.inputFieldsContainer, inputFieldsAnimatedStyle]}>
            {/* First Name */}
            <AnimatedView style={styles.inputGroup}>
              <AnimatedText style={styles.inputLabel}>First Name</AnimatedText>
              <AnimatedView style={styles.inputContainer}>
                <User size={20} color="#17f196" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First Name"
                  placeholderTextColor="#CCCCCC"
                />
              </AnimatedView>
            </AnimatedView>

            {/* Last Name */}
            <AnimatedView style={styles.inputGroup}>
              <AnimatedText style={styles.inputLabel}>Last Name</AnimatedText>
              <AnimatedView style={styles.inputContainer}>
                <User size={20} color="#17f196" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last Name"
                  placeholderTextColor="#CCCCCC"
                />
              </AnimatedView>
            </AnimatedView>

            {/* Date of Birth */}
            <AnimatedView style={styles.inputGroup}>
              <AnimatedText style={styles.inputLabel}>Date of Birth</AnimatedText>
              <AnimatedPressable 
                style={styles.inputContainer} 
                onPress={handleDatePickerOpen}
                onPressIn={() => {
                  buttonScale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
                }}
                onPressOut={() => {
                  buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
                }}
              >
                <Calendar size={20} color="#17f196" style={styles.inputIcon} />
                <AnimatedText style={[styles.textInput, !dateOfBirth && styles.placeholderText]}>
                  {dateOfBirth || 'Date of Birth'}
                </AnimatedText>
                <ChevronDown size={20} color="#17f196" style={styles.inputChevron} />
              </AnimatedPressable>
            </AnimatedView>

            {/* Position */}
            <AnimatedView style={styles.inputGroup}>
              <AnimatedText style={styles.inputLabel}>Position</AnimatedText>
              <AnimatedPressable 
                style={styles.inputContainer} 
                onPress={handlePositionPickerOpen}
                onPressIn={() => {
                  buttonScale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
                }}
                onPressOut={() => {
                  buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
                }}
              >
                <Briefcase size={20} color="#17f196" style={styles.inputIcon} />
                <AnimatedText style={[styles.textInput, !position && styles.placeholderText]}>
                  {position || 'Select Position'}
                </AnimatedText>
                <ChevronDown size={20} color="#17f196" style={styles.inputChevron} />
              </AnimatedPressable>
            </AnimatedView>
          </AnimatedView>
        </AnimatedView>
      </ScrollView>

      {/* Update Profile Button */}
      <AnimatedView style={[styles.buttonContainer, buttonAnimatedStyle]}>
        <AnimatedPressable 
          style={[styles.updateButton, loading && styles.updateButtonDisabled]}
          onPress={handleUpdateProfile}
          onPressIn={handleButtonPressIn}
          onPressOut={handleButtonPressOut}
          disabled={loading}
        >
          <AnimatedText style={styles.updateButtonText}>
            {loading ? 'Updating...' : 'Update Profile'}
          </AnimatedText>
        </AnimatedPressable>
      </AnimatedView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="none"
        onRequestClose={handleDatePickerClose}
      >
        <AnimatedView style={[styles.datePickerOverlay, { opacity: modalOpacity }]}>
          <AnimatedView style={[styles.datePickerContainer, modalAnimatedStyle]}>
            <AnimatedView style={styles.datePickerHeader}>
              <AnimatedPressable 
                onPress={handleDatePickerClose} 
                style={styles.datePickerCancelButton}
                onPressIn={() => {
                  buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
                }}
                onPressOut={() => {
                  buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
                }}
              >
                <AnimatedText style={styles.datePickerCancelText}>Cancel</AnimatedText>
              </AnimatedPressable>
              <AnimatedText style={styles.datePickerTitle}>Select Date of Birth</AnimatedText>
              <AnimatedPressable 
                onPress={handleDatePickerClose} 
                style={styles.datePickerDoneButton}
                onPressIn={() => {
                  buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
                }}
                onPressOut={() => {
                  buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
                }}
              >
                <AnimatedText style={styles.datePickerDoneText}>Done</AnimatedText>
              </AnimatedPressable>
            </AnimatedView>
            <AnimatedView style={styles.datePickerContent}>
              {Platform.OS === 'web' ? (
                <AnimatedView style={styles.webDatePicker}>
                  <AnimatedView style={styles.datePickerRow}>
                    <AnimatedView style={styles.datePickerColumn}>
                      <AnimatedText style={styles.datePickerLabel}>Year</AnimatedText>
                      <ScrollView style={styles.yearScrollView} showsVerticalScrollIndicator={true}>
                        {Array.from({ length: 125 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                          <AnimatedPressable
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
                            onPressIn={() => {
                              buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
                            }}
                            onPressOut={() => {
                              buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
                            }}
                          >
                            <AnimatedText style={[
                              styles.datePickerOptionText,
                              selectedDate.getFullYear() === year && styles.datePickerOptionTextSelected
                            ]}>
                              {year}
                            </AnimatedText>
                          </AnimatedPressable>
                        ))}
                      </ScrollView>
                    </AnimatedView>
                    
                    <AnimatedView style={styles.datePickerColumn}>
                      <AnimatedText style={styles.datePickerLabel}>Month</AnimatedText>
                      <ScrollView style={styles.monthScrollView} showsVerticalScrollIndicator={true}>
                        {[
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((month, index) => (
                          <AnimatedPressable
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
                            onPressIn={() => {
                              buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
                            }}
                            onPressOut={() => {
                              buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
                            }}
                          >
                            <AnimatedText style={[
                              styles.datePickerOptionText,
                              selectedDate.getMonth() === index && styles.datePickerOptionTextSelected
                            ]}>
                              {month}
                            </AnimatedText>
                          </AnimatedPressable>
                        ))}
                      </ScrollView>
                    </AnimatedView>
                    
                    <AnimatedView style={styles.datePickerColumn}>
                      <AnimatedText style={styles.datePickerLabel}>Day</AnimatedText>
                      <ScrollView style={styles.dayScrollView} showsVerticalScrollIndicator={true}>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <AnimatedPressable
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
                            onPressIn={() => {
                              buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
                            }}
                            onPressOut={() => {
                              buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
                            }}
                          >
                            <AnimatedText style={[
                              styles.datePickerOptionText,
                              selectedDate.getDate() === day && styles.datePickerOptionTextSelected
                            ]}>
                              {day}
                            </AnimatedText>
                          </AnimatedPressable>
                        ))}
                      </ScrollView>
                    </AnimatedView>
                  </AnimatedView>
                </AnimatedView>
              ) : (
                <AnimatedView style={styles.nativeDatePicker}>
                  <AnimatedText style={styles.datePickerNote}>
                    Native date picker would be implemented here for mobile platforms
                  </AnimatedText>
                  <AnimatedText style={styles.datePickerNote}>
                    Selected: {selectedDate.toDateString()}
                  </AnimatedText>
                </AnimatedView>
              )}
            </AnimatedView>
          </AnimatedView>
        </AnimatedView>
      </Modal>

      {/* Position Picker Modal */}
      <Modal
        visible={showPositionPicker}
        transparent={true}
        animationType="none"
        onRequestClose={handlePositionPickerClose}
      >
        <AnimatedView style={[styles.datePickerOverlay, { opacity: positionModalOpacity }]}>
          <AnimatedView style={[styles.datePickerContainer, positionModalAnimatedStyle]}>
            <AnimatedView style={styles.datePickerHeader}>
              <AnimatedPressable 
                onPress={handlePositionPickerClose} 
                style={styles.datePickerCancelButton}
                onPressIn={() => {
                  buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
                }}
                onPressOut={() => {
                  buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
                }}
              >
                <AnimatedText style={styles.datePickerCancelText}>Cancel</AnimatedText>
              </AnimatedPressable>
              <AnimatedText style={styles.datePickerTitle}>Select Position</AnimatedText>
              <AnimatedPressable 
                onPress={handlePositionPickerClose} 
                style={styles.datePickerDoneButton}
                onPressIn={() => {
                  buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
                }}
                onPressOut={() => {
                  buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
                }}
              >
                <AnimatedText style={styles.datePickerDoneText}>Done</AnimatedText>
              </AnimatedPressable>
            </AnimatedView>
            <AnimatedView style={styles.datePickerContent}>
              <AnimatedView style={styles.positionPickerContainer}>
                {['Partner', 'Owner'].map((positionOption) => (
                  <AnimatedPressable
                    key={positionOption}
                    style={[
                      styles.positionOption,
                      position === positionOption && styles.positionOptionSelected
                    ]}
                    onPress={() => handlePositionSelect(positionOption)}
                    onPressIn={() => {
                      buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
                    }}
                    onPressOut={() => {
                      buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
                    }}
                  >
                    <AnimatedText style={[
                      styles.positionOptionText,
                      position === positionOption && styles.positionOptionTextSelected
                    ]}>
                      {positionOption}
                    </AnimatedText>
                  </AnimatedPressable>
                ))}
              </AnimatedView>
            </AnimatedView>
          </AnimatedView>
        </AnimatedView>
      </Modal>

      {/* Image Editing Modal */}
      <Modal
        visible={showImageEditor}
        transparent={true}
        animationType="none"
        onRequestClose={handleCancelEdit}
      >
        <AnimatedView style={styles.imageEditorOverlay}>
          <AnimatedView style={styles.imageEditorContainer}>
            {/* Header */}
            <AnimatedView style={styles.imageEditorHeader}>
              <AnimatedPressable 
                onPress={handleCancelEdit} 
                style={styles.imageEditorCancelButton}
              >
                <X size={24} color="#666666" />
              </AnimatedPressable>
              <AnimatedText style={styles.imageEditorTitle}>Edit Image</AnimatedText>
              <AnimatedPressable 
                onPress={handleSaveEditedImage} 
                style={styles.imageEditorSaveButton}
              >
                <Check size={24} color="#17f196" />
              </AnimatedPressable>
            </AnimatedView>

            {/* Image Display Area */}
            <AnimatedView style={styles.imageEditorContent}>
              {editingImageUri && (
                <AnimatedView style={styles.imageEditorImageWrapper}>
                  <AnimatedView 
                    style={[
                      styles.imageEditorImageContainer,
                      {
                        transform: [
                          { rotate: `${imageRotation}deg` },
                          { scale: imageScale }
                        ]
                      }
                    ]}
                  >
                    <RNImage 
                      source={{ uri: editingImageUri }} 
                      style={styles.imageEditorImage}
                      resizeMode="contain"
                    />
                  </AnimatedView>
                  
                  {/* Crop Overlay */}
                  {cropMode && (
                    <AnimatedView style={styles.cropOverlay}>
                      {/* Dark overlay parts */}
                      <AnimatedView style={[styles.cropOverlayTop, { height: cropArea.y }]} />
                      <AnimatedView style={[styles.cropOverlayBottom, { 
                        top: cropArea.y + cropArea.height,
                        height: 300 - cropArea.y - cropArea.height 
                      }]} />
                      <AnimatedView style={[styles.cropOverlayLeft, { 
                        top: cropArea.y,
                        width: cropArea.x,
                        height: cropArea.height 
                      }]} />
                      <AnimatedView style={[styles.cropOverlayRight, { 
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
                    </AnimatedView>
                  )}
                </AnimatedView>
              )}
            </AnimatedView>

            {/* Control Buttons */}
            <AnimatedView style={styles.imageEditorControls}>
              <AnimatedPressable 
                style={[styles.imageEditorControlButton, cropMode && styles.imageEditorControlButtonActive]}
                onPress={handleToggleCropMode}
              >
                <Crop size={24} color={cropMode ? "#FFFFFF" : "#17f196"} />
                <AnimatedText style={[styles.imageEditorControlText, cropMode && styles.imageEditorControlTextActive]}>
                  {cropMode ? 'Exit Crop' : 'Crop'}
                </AnimatedText>
              </AnimatedPressable>

              <AnimatedPressable 
                style={styles.imageEditorControlButton}
                onPress={handleRotateImage}
              >
                <RotateCw size={24} color="#17f196" />
                <AnimatedText style={styles.imageEditorControlText}>Rotate</AnimatedText>
              </AnimatedPressable>

              <AnimatedPressable 
                style={styles.imageEditorControlButton}
                onPress={handleResetCrop}
              >
                <RotateCcw size={24} color="#17f196" />
                <AnimatedText style={styles.imageEditorControlText}>Reset</AnimatedText>
              </AnimatedPressable>
            </AnimatedView>
          </AnimatedView>
        </AnimatedView>
      </Modal>
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 32,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  photoUploadSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 16,
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
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#17f196',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17f196',
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
  editButton: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#17f196',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  uploadLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  uploadGuidelines: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  inputFieldsContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
    height: 56,
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
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  datePickerDoneButton: {
    padding: 8,
  },
  datePickerDoneText: {
    fontSize: 16,
    color: '#17f196',
    fontWeight: '600',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
});
