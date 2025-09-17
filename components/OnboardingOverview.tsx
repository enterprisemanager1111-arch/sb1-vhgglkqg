import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, { 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle,
  withTiming,
  interpolateColor 
} from 'react-native-reanimated';
import { 
  Check, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  User, 
  Settings, 
  Mail, 
  Camera, 
  Users,
  Calendar,
  Target,
  Shield
} from 'lucide-react-native';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: screenWidth } = Dimensions.get('window');

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  category: 'profile' | 'preferences' | 'authentication' | 'verification' | 'family';
  status: 'completed' | 'in-progress' | 'pending' | 'skipped';
  completedAt?: string; // ISO timestamp
  icon: React.ReactNode;
  details?: Record<string, any>;
  substeps?: OnboardingSubstep[];
}

export interface OnboardingSubstep {
  id: string;
  title: string;
  status: 'completed' | 'pending' | 'skipped';
  completedAt?: string;
}

interface OnboardingOverviewProps {
  steps: OnboardingStep[];
  onStepPress?: (step: OnboardingStep) => void;
  onEditStep?: (step: OnboardingStep) => void;
  showProgress?: boolean;
}

const categoryConfig = {
  profile: {
    title: 'Profil erstellen',
    color: '#54FE54',
    bgColor: 'rgba(84, 254, 84, 0.1)',
    icon: <User size={20} color="#54FE54" strokeWidth={2} />
  },
  preferences: {
    title: 'Präferenzen',
    color: '#00D4FF',
    bgColor: 'rgba(0, 212, 255, 0.1)',
    icon: <Target size={20} color="#00D4FF" strokeWidth={2} />
  },
  authentication: {
    title: 'Authentifizierung',
    color: '#FF6B6B',
    bgColor: 'rgba(255, 107, 107, 0.1)',
    icon: <Shield size={20} color="#FF6B6B" strokeWidth={2} />
  },
  verification: {
    title: 'Verifizierung',
    color: '#4ECDC4',
    bgColor: 'rgba(78, 205, 196, 0.1)',
    icon: <Check size={20} color="#4ECDC4" strokeWidth={2} />
  },
  family: {
    title: 'Familie',
    color: '#FFE66D',
    bgColor: 'rgba(255, 230, 109, 0.1)',
    icon: <Users size={20} color="#FFE66D" strokeWidth={2} />
  }
};

const stepIcons = {
  'personal-info': <User size={18} color="#666666" strokeWidth={2} />,
  'preferences': <Settings size={18} color="#666666" strokeWidth={2} />,
  'authentication': <Mail size={18} color="#666666" strokeWidth={2} />,
  'profile-picture': <Camera size={18} color="#666666" strokeWidth={2} />,
  'family-setup': <Users size={18} color="#666666" strokeWidth={2} />,
  'permissions': <Shield size={18} color="#666666" strokeWidth={2} />,
};

export default function OnboardingOverview({
  steps,
  onStepPress,
  onEditStep,
  showProgress = true
}: OnboardingOverviewProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['profile']));
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  // Group steps by category
  const groupedSteps = steps.reduce((groups, step) => {
    if (!groups[step.category]) {
      groups[step.category] = [];
    }
    groups[step.category].push(step);
    return groups;
  }, {} as Record<string, OnboardingStep[]>);

  // Calculate overall progress
  const totalSteps = steps.length;
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const formatDate = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: OnboardingStep['status']) => {
    switch (status) {
      case 'completed':
        return <Check size={16} color="#54FE54" strokeWidth={2.5} />;
      case 'in-progress':
        return <Clock size={16} color="#FFB800" strokeWidth={2} />;
      case 'skipped':
        return <Text style={styles.skippedIcon}>⏭</Text>;
      default:
        return <View style={styles.pendingDot} />;
    }
  };

  const getStatusColor = (status: OnboardingStep['status']) => {
    switch (status) {
      case 'completed': return '#54FE54';
      case 'in-progress': return '#FFB800';
      case 'skipped': return '#999999';
      default: return '#E0E0E0';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Overall Progress Header */}
      {showProgress && (
        <View style={styles.progressHeader}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressTitle}>Onboarding Fortschritt</Text>
            <Text style={styles.progressStats}>
              {completedSteps} von {totalSteps} Schritten abgeschlossen
            </Text>
          </View>
          <View style={styles.progressCircle}>
            <Text style={styles.progressPercentage}>{Math.round(progressPercentage)}%</Text>
          </View>
        </View>
      )}

      {/* Progress Bar */}
      {showProgress && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <Animated.View 
              style={[
                styles.progressBarFill, 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
        </View>
      )}

      {/* Categories and Steps */}
      <View style={styles.stepsContainer}>
        {Object.entries(groupedSteps).map(([category, categorySteps]) => {
          const config = categoryConfig[category as keyof typeof categoryConfig];
          const isExpanded = expandedCategories.has(category);
          const categoryCompleted = categorySteps.filter(s => s.status === 'completed').length;
          const categoryTotal = categorySteps.length;

          return (
            <View key={category} style={styles.categoryContainer}>
              {/* Category Header */}
              <AnimatedPressable 
                style={[styles.categoryHeader, { backgroundColor: config.bgColor }]}
                onPress={() => toggleCategory(category)}
              >
                <View style={styles.categoryLeft}>
                  {config.icon}
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryTitle}>{config.title}</Text>
                    <Text style={styles.categoryProgress}>
                      {categoryCompleted}/{categoryTotal} abgeschlossen
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryRight}>
                  <View style={[styles.categoryBadge, { backgroundColor: config.color }]}>
                    <Text style={styles.categoryBadgeText}>{categoryCompleted}</Text>
                  </View>
                  {isExpanded ? (
                    <ChevronDown size={20} color="#666666" strokeWidth={2} />
                  ) : (
                    <ChevronRight size={20} color="#666666" strokeWidth={2} />
                  )}
                </View>
              </AnimatedPressable>

              {/* Category Steps */}
              {isExpanded && (
                <AnimatedView style={styles.stepsInCategory}>
                  {categorySteps
                    .sort((a, b) => {
                      // Sort by completion status, then by completedAt timestamp
                      if (a.status === 'completed' && b.status !== 'completed') return -1;
                      if (a.status !== 'completed' && b.status === 'completed') return 1;
                      if (a.completedAt && b.completedAt) {
                        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
                      }
                      return 0;
                    })
                    .map((step) => {
                      const isStepExpanded = expandedSteps.has(step.id);
                      const hasSubsteps = step.substeps && step.substeps.length > 0;

                      return (
                        <View key={step.id} style={styles.stepContainer}>
                          {/* Step Header */}
                          <AnimatedPressable 
                            style={[
                              styles.stepHeader,
                              step.status === 'completed' && styles.completedStepHeader
                            ]}
                            onPress={() => {
                              if (hasSubsteps) {
                                toggleStep(step.id);
                              }
                              onStepPress?.(step);
                            }}
                          >
                            <View style={styles.stepLeft}>
                              <View style={[
                                styles.statusIndicator,
                                { borderColor: getStatusColor(step.status) }
                              ]}>
                                {getStatusIcon(step.status)}
                              </View>
                              <View style={styles.stepIcon}>
                                {stepIcons[step.id as keyof typeof stepIcons] || 
                                 <Settings size={18} color="#666666" strokeWidth={2} />}
                              </View>
                              <View style={styles.stepInfo}>
                                <Text style={[
                                  styles.stepTitle,
                                  step.status === 'completed' && styles.completedStepTitle,
                                  step.status === 'skipped' && styles.skippedStepTitle
                                ]}>
                                  {step.title}
                                </Text>
                                <Text style={styles.stepDescription}>
                                  {step.description}
                                </Text>
                                {step.completedAt && (
                                  <Text style={styles.stepTimestamp}>
                                    <Calendar size={12} color="#999999" strokeWidth={1.5} />
                                    {' '}{formatDate(step.completedAt)}
                                  </Text>
                                )}
                              </View>
                            </View>

                            <View style={styles.stepRight}>
                              {onEditStep && step.status === 'completed' && (
                                <Pressable 
                                  style={styles.editButton}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    onEditStep(step);
                                  }}
                                >
                                  <Text style={styles.editButtonText}>Bearbeiten</Text>
                                </Pressable>
                              )}
                              {hasSubsteps && (
                                isStepExpanded ? (
                                  <ChevronDown size={16} color="#666666" strokeWidth={2} />
                                ) : (
                                  <ChevronRight size={16} color="#666666" strokeWidth={2} />
                                )
                              )}
                            </View>
                          </AnimatedPressable>

                          {/* Substeps */}
                          {hasSubsteps && isStepExpanded && (
                            <AnimatedView style={styles.substepsContainer}>
                              {step.substeps?.map((substep) => (
                                <View key={substep.id} style={styles.substepItem}>
                                  <View style={styles.substepIndicator}>
                                    {getStatusIcon(substep.status)}
                                  </View>
                                  <View style={styles.substepContent}>
                                    <Text style={[
                                      styles.substepTitle,
                                      substep.status === 'completed' && styles.completedSubstepTitle
                                    ]}>
                                      {substep.title}
                                    </Text>
                                    {substep.completedAt && (
                                      <Text style={styles.substepTimestamp}>
                                        {formatDate(substep.completedAt)}
                                      </Text>
                                    )}
                                  </View>
                                </View>
                              ))}
                            </AnimatedView>
                          )}

                          {/* Step Details */}
                          {step.details && isStepExpanded && (
                            <AnimatedView style={styles.stepDetails}>
                              {Object.entries(step.details).map(([key, value]) => (
                                <View key={key} style={styles.detailItem}>
                                  <Text style={styles.detailLabel}>
                                    {key.charAt(0).toUpperCase() + key.slice(1)}:
                                  </Text>
                                  <Text style={styles.detailValue}>
                                    {Array.isArray(value) ? value.join(', ') : String(value)}
                                  </Text>
                                </View>
                              ))}
                            </AnimatedView>
                          )}
                        </View>
                      );
                    })}
                </AnimatedView>
              )}
            </View>
          );
        })}
      </View>

      {/* Summary Footer */}
      <View style={styles.summaryFooter}>
        <Text style={styles.summaryTitle}>Zusammenfassung</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStatItem}>
            <Check size={16} color="#54FE54" strokeWidth={2} />
            <Text style={styles.summaryStatText}>
              {steps.filter(s => s.status === 'completed').length} abgeschlossen
            </Text>
          </View>
          <View style={styles.summaryStatItem}>
            <Clock size={16} color="#FFB800" strokeWidth={2} />
            <Text style={styles.summaryStatText}>
              {steps.filter(s => s.status === 'in-progress').length} in Bearbeitung
            </Text>
          </View>
          <View style={styles.summaryStatItem}>
            <View style={styles.pendingDot} />
            <Text style={styles.summaryStatText}>
              {steps.filter(s => s.status === 'pending').length} ausstehend
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F5',
  },

  // Progress Header
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 4,
  },
  progressStats: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#54FE54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
  },

  // Progress Bar
  progressBarContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#54FE54',
    borderRadius: 4,
  },

  // Steps Container
  stepsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },

  // Category
  categoryContainer: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 2,
  },
  categoryProgress: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
  },

  // Steps
  stepsInCategory: {
    paddingLeft: 16,
    gap: 8,
  },
  stepContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  completedStepHeader: {
    backgroundColor: 'rgba(84, 254, 84, 0.05)',
  },
  stepLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 2,
  },
  stepIcon: {
    marginTop: 2,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#161618',
    fontFamily: 'Montserrat-Medium',
    marginBottom: 4,
  },
  completedStepTitle: {
    color: '#54FE54',
  },
  skippedStepTitle: {
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  stepDescription: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    lineHeight: 18,
    marginBottom: 6,
  },
  stepTimestamp: {
    fontSize: 11,
    color: '#999999',
    fontFamily: 'Montserrat-Regular',
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#54FE54',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },

  // Substeps
  substepsContainer: {
    paddingLeft: 48,
    paddingRight: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  substepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  substepIndicator: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  substepContent: {
    flex: 1,
  },
  substepTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#161618',
    fontFamily: 'Montserrat-Medium',
    marginBottom: 2,
  },
  completedSubstepTitle: {
    color: '#54FE54',
  },
  substepTimestamp: {
    fontSize: 10,
    color: '#999999',
    fontFamily: 'Montserrat-Regular',
  },

  // Step Details
  stepDetails: {
    paddingLeft: 48,
    paddingRight: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    color: '#161618',
    fontFamily: 'Montserrat-Regular',
    flex: 2,
    textAlign: 'right',
  },

  // Status Icons
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  skippedIcon: {
    fontSize: 14,
    color: '#999999',
  },

  // Summary Footer
  summaryFooter: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 100,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 12,
  },
  summaryStats: {
    gap: 8,
  },
  summaryStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryStatText: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
});