import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
  Image as RNImage,
} from 'react-native';
import { Clock } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';

interface FeaturesToCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onFeatureSelect: (feature: string) => void;
}

type FeatureType = 'tasks' | 'calendar' | 'shopList' | 'coming-soon';

interface Feature {
  id: FeatureType;
  title: string;
  subtitle: string;
  iconActive: any;
  iconDisabled: any;
  count: string;
  enabled: boolean;
}

const FeaturesToCreateModal: React.FC<FeaturesToCreateModalProps> = ({
  visible,
  onClose,
  onFeatureSelect,
}) => {
  const { t } = useLanguage();
  const [selectedFeature, setSelectedFeature] = useState<FeatureType>('tasks');

  const features: Feature[] = [
    {
      id: 'tasks',
      title: 'Tasks',
      subtitle: '14 Tasks',
      iconActive: require('@/assets/images/icon/tasks_active.png'),
      iconDisabled: require('@/assets/images/icon/tasks_dis.png'),
      count: '14 Tasks',
      enabled: true,
    },
    {
      id: 'calendar',
      title: 'Calendar',
      subtitle: '6 Events',
      iconActive: require('@/assets/images/icon/calendar2_active.png'),
      iconDisabled: require('@/assets/images/icon/calendar2_dis.png'),
      count: '6 Events',
      enabled: true,
    },
    {
      id: 'shopList',
      title: 'Shopping List',
      subtitle: '25 Items',
      iconActive: require('@/assets/images/icon/shop_list_active.png'),
      iconDisabled: require('@/assets/images/icon/shop_list_dis.png'),
      count: '25 Items',
      enabled: true,
    },
    {
      id: 'coming-soon',
      title: 'Coming Soon',
      subtitle: 'Hyped?',
      iconActive: require('@/assets/images/icon/soon_active.png'),
      iconDisabled: require('@/assets/images/icon/soon_dis.png'),
      count: 'Hyped?',
      enabled: true,
    },
  ];

  const handleFeatureSelect = (feature: FeatureType) => {
    // if (feature === 'coming-soon') return; // Disabled feature
    setSelectedFeature(feature);
  };

  const handleStartCreation = () => {
    onFeatureSelect(selectedFeature);
    onClose();
  };

  const renderFeatureCard = (feature: Feature) => {
    const isSelected = selectedFeature === feature.id;
    const isEnabled = feature.enabled;

    return (
      <Pressable
        key={feature.id}
        style={[
          styles.featureCard,
          isSelected && styles.featureCardSelected,
          !isEnabled && styles.featureCardDisabled,
        ]}
        onPress={() => handleFeatureSelect(feature.id)}
        disabled={!isEnabled}
      >
        <View style={styles.featureContentContainer}>
          <View style={styles.featureTitleRow}>
            <View style={[
              styles.featureIcon,
              isSelected && styles.featureIconSelected,
              !isEnabled && styles.featureIconDisabled,
            ]}>
              {isSelected ? (
                <RNImage 
                  source={feature.iconActive} 
                  style={styles.featureIconImage}
                  resizeMode="contain"
                />
              ) : (
                <RNImage 
                  source={feature.iconDisabled} 
                  style={styles.featureIconImage}
                  resizeMode="contain"
                />
              )}
            </View>
            <Text style={[
              styles.featureTitle,
              isSelected && styles.featureTitleSelected,
              !isEnabled && styles.featureTitleDisabled,
            ]}>
              {feature.title}
            </Text>
          </View>
          <Text style={[
            styles.featureSubtitle,
            isSelected && styles.featureSubtitleSelected,
            !isEnabled && styles.featureSubtitleDisabled,
          ]}>
            {feature.subtitle}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.overlayPressable} onPress={onClose} />
        
        <View style={styles.modalContainer}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.icon}>
              <RNImage 
                source={require('@/assets/images/icon/add_new.png')}
                style={styles.iconImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Features to Create</Text>
            <Text style={styles.modalSubtitle}>
              On which feature would you like to add something new to? Please select your Feature
            </Text>
          </View>

          {/* Feature Selection Grid */}
          <View style={styles.featuresGrid}>
            {features.map(renderFeatureCard)}
          </View>

          {/* Start with Creation Button */}
          <Pressable
            style={styles.startButton}
            onPress={handleStartCreation}
          >
            <Text style={styles.startButtonText}>Start with Creation</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayPressable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 34,
    minHeight: 400,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: -70,
    marginBottom: 30,
  },
  icon: {
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
  iconImage: {
    width: 35,
    height: 35,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  featureCard: {
    width: (width - 60) / 2, // Account for padding and gap
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureCardSelected: {
    borderColor: '#17f196',
    borderWidth: 1,
  },
  featureCardDisabled: {
    opacity: 0.6,
  },
  featureContentContainer: {
    flex: 1,
  },
  featureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureIcon: {
    marginRight: 8,
  },
  featureIconImage: {
    width: 14,
    height: 14,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureIconSelected: {
    // Icon color is handled by the icon component itself
  },
  featureIconDisabled: {
    opacity: 0.5,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'left',
  },
  featureTitleSelected: {
    // color: '#17f196',
  },
  featureTitleDisabled: {
    color: '#9CA3AF',
  },
  featureSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'left',
  },
  featureSubtitleSelected: {
    // color: '#17f196',
  },
  featureSubtitleDisabled: {
    color: '#9CA3AF',
  },
  startButton: {
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
    marginTop: 8,
  },
  startButtonText: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
});

export default FeaturesToCreateModal;
