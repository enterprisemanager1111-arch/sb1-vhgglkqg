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
import { useDarkMode } from '@/contexts/DarkModeContext';
import { getTheme } from '@/constants/theme';

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
  const { isDarkMode } = useDarkMode();
  const theme = getTheme(isDarkMode);
  const [selectedFeature, setSelectedFeature] = useState<FeatureType>('tasks');
  
  const styles = createStyles(theme, isDarkMode);

  const features: Feature[] = [
    {
      id: 'tasks',
      title: t('featuresToCreate.features.tasks.title'),
      subtitle: t('featuresToCreate.features.tasks.subtitle'),
      iconActive: require('@/assets/images/icon/tasks_active.png'),
      iconDisabled: require('@/assets/images/icon/tasks_dis.png'),
      count: t('featuresToCreate.features.tasks.subtitle'),
      enabled: true,
    },
    {
      id: 'calendar',
      title: t('featuresToCreate.features.calendar.title'),
      subtitle: t('featuresToCreate.features.calendar.subtitle'),
      iconActive: require('@/assets/images/icon/calendar2_active.png'),
      iconDisabled: require('@/assets/images/icon/calendar2_dis.png'),
      count: t('featuresToCreate.features.calendar.subtitle'),
      enabled: true,
    },
    {
      id: 'shopList',
      title: t('featuresToCreate.features.shopList.title'),
      subtitle: t('featuresToCreate.features.shopList.subtitle'),
      iconActive: require('@/assets/images/icon/shop_list_active.png'),
      iconDisabled: require('@/assets/images/icon/shop_list_dis.png'),
      count: t('featuresToCreate.features.shopList.subtitle'),
      enabled: true,
    },
    {
      id: 'coming-soon',
      title: t('featuresToCreate.features.comingSoon.title'),
      subtitle: t('featuresToCreate.features.comingSoon.subtitle'),
      iconActive: require('@/assets/images/icon/soon_active.png'),
      iconDisabled: require('@/assets/images/icon/soon_dis.png'),
      count: t('featuresToCreate.features.comingSoon.subtitle'),
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
            <Text style={styles.modalTitle}>{t('featuresToCreate.title')}</Text>
            <Text style={styles.modalSubtitle}>
              {t('featuresToCreate.subtitle')}
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
            <Text style={styles.startButtonText}>{t('featuresToCreate.startButton')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const createStyles = (theme: ReturnType<typeof getTheme>, isDarkMode: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayPressable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: theme.surface,
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
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
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
    backgroundColor: theme.input,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
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
    color: theme.textSecondary,
    textAlign: 'left',
  },
  featureTitleSelected: {
    // color: '#17f196',
  },
  featureTitleDisabled: {
    color: theme.textTertiary,
  },
  featureSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'left',
  },
  featureSubtitleSelected: {
    // color: '#17f196',
  },
  featureSubtitleDisabled: {
    color: theme.textTertiary,
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
