import React, { useState } from 'react';
import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import Animated, { useSharedValue, withSpring, withDelay, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, User, Trash2 } from 'lucide-react-native';

import { useFamily } from '@/contexts/FamilyContext';
import { useFamilyCalendarEvents } from '@/hooks/useFamilyCalendarEvents';
import { useLanguage } from '@/contexts/LanguageContext';
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem';
import EmptyState from '@/components/EmptyState';
import FamilyPrompt from '@/components/FamilyPrompt';
import AddItemModal from '@/components/AddItemModal';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Calendar() {
  const [isLoaded, setIsLoaded] = useState(false);
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const { isInFamily, currentFamily, loading: familyLoading } = useFamily();
  const { 
    events, 
    loading: eventsLoading, 
    error: eventsError,
    deleteEvent,
    refreshEvents,
    getEventsForDate,
    getUpcomingEvents 
  } = useFamilyCalendarEvents();
  const { notifications, dismissNotification, showMemberActivity } = useNotifications();
  
  const headerOpacity = useSharedValue(0);
  const calendarScale = useSharedValue(0.8);
  const eventsTranslateY = useSharedValue(30);

  useEffect(() => {
    if (!isLoaded && !familyLoading && !eventsLoading) {
      headerOpacity.value = withTiming(1, { duration: 600 });
      calendarScale.value = withDelay(200, withSpring(1, { damping: 18 }));
      eventsTranslateY.value = withDelay(400, withSpring(0, { damping: 20 }));
      setIsLoaded(true);
    }
  }, [isLoaded, familyLoading, eventsLoading]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const calendarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: calendarScale.value }],
  }));

  const eventsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: eventsTranslateY.value }],
    opacity: eventsTranslateY.value === 0 ? 1 : 0.7,
  }));

  // Show family prompt if user is not in a family
  if (!familyLoading && !isInFamily) {
    return (
      <SafeAreaView style={styles.container}>
        <FamilyPrompt />
      </SafeAreaView>
    );
  }

  // Show loading only during initial load
  if (familyLoading && !isLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <CalendarIcon size={32} color="#54FE54" strokeWidth={2} />
          </View>
          <Text style={styles.loadingText}>Kalender wird geladen...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (eventsError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Fehler beim Laden des Kalenders</Text>
          <Text style={styles.errorText}>{eventsError}</Text>
          <Pressable style={styles.retryButton} onPress={refreshEvents}>
            <Text style={styles.retryButtonText}>Erneut versuchen</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshEvents();
    } catch (error) {
      console.error('Error refreshing calendar events:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    Alert.alert(
      'Termin löschen',
      'Möchten Sie diesen Termin wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(eventId);
              showMemberActivity('Ein Familienmitglied', 'hat einen Termin gelöscht');
            } catch (error: any) {
              Alert.alert('Fehler', 'Termin konnte nicht gelöscht werden: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const monthNamesShort = [
    'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
  ];

  const dayNamesShort = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday is first day
    startOfWeek.setDate(diff);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(startOfWeek);
      weekDay.setDate(startOfWeek.getDate() + i);
      weekDays.push(weekDay);
    }
    return weekDays;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const selectDate = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  const selectWeekDate = (date: Date) => {
    setSelectedDate(date);
    setCurrentDate(date);
  };

  const isToday = (day: number | null) => {
    if (day === null) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isTodayWeek = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number | null) => {
    if (day === null) return false;
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isSelectedWeek = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const hasEvent = (day: number | null) => {
    if (day === null) return false;
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayEvents = getEventsForDate(dayDate.toISOString().split('T')[0]);
    return dayEvents.length > 0;
  };

  const hasEventWeek = (date: Date) => {
    const dayEvents = getEventsForDate(date.toISOString().split('T')[0]);
    return dayEvents.length > 0;
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = getWeekDays(selectedDate);
  const selectedDateString = selectedDate.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const selectedDateEvents = getEventsForDate(selectedDate.toISOString().split('T')[0]);
  const upcomingEvents = getUpcomingEvents(7);
  const todayEvents = getEventsForDate(new Date().toISOString().split('T')[0]);

  // Show empty state if no events at all
  if (isLoaded && events.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon={<CalendarIcon size={40} color="#54FE54" strokeWidth={1.5} />}
          title="Noch keine Termine"
          description="Erstellen Sie Ihren ersten Familientermin und planen Sie gemeinsame Aktivitäten!"
          buttonText="Termin erstellen"
          onButtonPress={() => setShowAddModal(true)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Notification System */}
      <NotificationSystem
        notifications={notifications}
        onDismiss={dismissNotification}
      />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#54FE54"
          />
        }
      >
        {/* Header */}
        <AnimatedView style={[styles.header, headerAnimatedStyle]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.monthTitle}>
                {monthNames[selectedDate.getMonth()]}, {selectedDate.getDate()}
              </Text>
              <Text style={styles.taskCountText}>{todayEvents.length} Termine heute</Text>
            </View>
            <Pressable 
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={20} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          </View>
        </AnimatedView>

        {/* Week View */}
        <AnimatedView style={[styles.section, calendarAnimatedStyle]}>
          <View style={styles.weekView}>
            {weekDays.map((date, index) => {
              const dayNumber = date.getDate();
              const dayName = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][date.getDay()];
              const isToday = isTodayWeek(date);
              const isSelected = isSelectedWeek(date);
              const hasEvents = hasEventWeek(date);
              
              return (
                <AnimatedPressable
                  key={index}
                  style={[
                    styles.weekDayItem,
                    (isToday || isSelected) && styles.weekDaySelected
                  ]}
                  onPress={() => selectWeekDate(date)}
                >
                  <Text style={[
                    styles.weekDayNumber,
                    (isToday || isSelected) && styles.weekDayNumberSelected
                  ]}>
                    {dayNumber}
                  </Text>
                  <Text style={[
                    styles.weekDayName,
                    (isToday || isSelected) && styles.weekDayNameSelected
                  ]}>
                    {dayName}
                  </Text>
                  {hasEvents && !isSelected && !isToday && (
                    <View style={styles.weekEventDot} />
                  )}
                </AnimatedPressable>
              );
            })}
          </View>
        </AnimatedView>

        {/* Month Navigation */}
        <AnimatedView style={[styles.section, calendarAnimatedStyle]}>
          <View style={styles.monthNavigation}>
            <AnimatedPressable style={styles.monthNavButton} onPress={() => navigateMonth('prev')}>
              <ChevronLeft size={20} color="#54FE54" strokeWidth={2} />
            </AnimatedPressable>
            <Text style={styles.monthNavTitle}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            <AnimatedPressable style={styles.monthNavButton} onPress={() => navigateMonth('next')}>
              <ChevronRight size={20} color="#54FE54" strokeWidth={2} />
            </AnimatedPressable>
          </View>
        </AnimatedView>

        {/* Calendar Grid */}
        <AnimatedView style={[styles.section, calendarAnimatedStyle]}>
          <View style={styles.calendar}>
            {/* Day headers */}
            <View style={styles.weekHeader}>
              {dayNamesShort.map((day) => (
                <Text key={day} style={styles.dayHeader}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar days */}
            <View style={styles.daysGrid}>
              {days.map((day, index) => (
                <AnimatedPressable
                  key={index}
                  style={[
                    styles.dayCell,
                    day === null && styles.emptyDayCell,
                    isToday(day) && styles.todayCell,
                    isSelected(day) && styles.selectedDayCell,
                  ]}
                  onPress={() => day && selectDate(day)}
                  disabled={day === null}
                >
                  {day && (
                    <>
                      <Text
                        style={[
                          styles.dayText,
                          isToday(day) && styles.todayText,
                          isSelected(day) && styles.selectedDayText,
                        ]}
                      >
                        {day}
                      </Text>
                      {hasEvent(day) && !isSelected(day) && !isToday(day) && (
                        <View style={styles.eventDot} />
                      )}
                    </>
                  )}
                </AnimatedPressable>
              ))}
            </View>
          </View>
        </AnimatedView>

        {/* Selected Date Events */}
        <AnimatedView style={[styles.section, eventsAnimatedStyle]}>
          <View style={styles.sectionHeader}>
            <CalendarIcon size={20} color="#161618" strokeWidth={1.5} />
            <Text style={styles.sectionTitle}>Termine für {selectedDate.getDate()}. {monthNames[selectedDate.getMonth()]}</Text>
          </View>

          <View style={styles.eventsList}>
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((event) => (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventLeftSection}>
                    <View style={styles.eventTimeContainer}>
                      <Clock size={14} color="#54FE54" strokeWidth={2} />
                      <Text style={styles.eventTimeText}>
                        {new Date(event.event_date).toLocaleTimeString('de-DE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                    <View style={styles.eventIndicator} />
                  </View>
                  
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    {event.description && (
                      <Text style={styles.eventDescription}>{event.description}</Text>
                    )}
                    
                    <View style={styles.eventMeta}>
                      {event.location && (
                        <View style={styles.eventMetaItem}>
                          <MapPin size={12} color="#666666" strokeWidth={1.5} />
                          <Text style={styles.eventLocation}>{event.location}</Text>
                        </View>
                      )}
                      <View style={styles.eventMetaItem}>
                        <User size={12} color="#666666" strokeWidth={1.5} />
                        <Text style={styles.eventCreator}>
                          {event.creator_profile?.name || 'Unbekannt'}
                        </Text>
                      </View>
                      <View style={styles.eventPoints}>
                        <Text style={styles.eventPointsText}>+10 Punkte erhalten</Text>
                      </View>
                    </View>
                  </View>

                  <Pressable 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteEvent(event.id)}
                  >
                    <Trash2 size={16} color="#666666" strokeWidth={1.5} />
                  </Pressable>
                </View>
              ))
            ) : (
              <View style={styles.emptyDayContainer}>
                <CalendarIcon size={24} color="#E0E0E0" strokeWidth={1.5} />
                <Text style={styles.emptyDayText}>Keine Termine für diesen Tag</Text>
                <Pressable 
                  style={styles.addEventButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <Plus size={16} color="#54FE54" strokeWidth={2} />
                  <Text style={styles.addEventButtonText}>{t('tabs.calendar.addEvent')}</Text>
                </Pressable>
              </View>
            )}
          </View>
        </AnimatedView>

        {/* Upcoming Events Preview */}
        {upcomingEvents.length > 0 && (
          <AnimatedView style={[styles.section, eventsAnimatedStyle]}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color="#161618" strokeWidth={1.5} />
              <Text style={styles.sectionTitle}>Diese Woche</Text>
            </View>
            
            <View style={styles.upcomingEventsList}>
              {upcomingEvents.slice(0, 3).map((event) => (
                <View key={event.id} style={styles.upcomingEventCard}>
                  <View style={styles.upcomingEventDate}>
                    <Text style={styles.upcomingEventDay}>
                      {new Date(event.event_date).getDate()}
                    </Text>
                    <Text style={styles.upcomingEventMonth}>
                      {monthNamesShort[new Date(event.event_date).getMonth()]}
                    </Text>
                  </View>
                  <View style={styles.upcomingEventContent}>
                    <Text style={styles.upcomingEventTitle}>{event.title}</Text>
                    <Text style={styles.upcomingEventTime}>
                      {new Date(event.event_date).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {event.location && ` • ${event.location}`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </AnimatedView>
        )}

        {/* Bottom spacing für Tab Bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Add Event Modal */}
      <AddItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: '#FF0000',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#54FE54',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#161618',
  },

  // Header - App-Design konform
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  monthTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
    marginBottom: 4,
  },
  taskCountText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#54FE54',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Sections
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },

  // Week View - App-Design konform
  weekView: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    gap: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  weekDayItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  weekDaySelected: {
    backgroundColor: '#54FE54',
  },
  weekDayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 2,
  },
  weekDayNumberSelected: {
    color: '#FFFFFF',
  },
  weekDayName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
  },
  weekDayNameSelected: {
    color: '#FFFFFF',
  },
  weekEventDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#54FE54',
  },

  // Month Navigation
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monthNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNavTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },

  // Calendar Grid
  calendar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Montserrat-SemiBold',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 4,
    borderRadius: 8,
  },
  emptyDayCell: {
    opacity: 0,
  },
  todayCell: {
    backgroundColor: '#54FE54',
  },
  selectedDayCell: {
    backgroundColor: '#54FE54',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#161618',
    fontFamily: 'Montserrat-Medium',
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  eventDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#54FE54',
  },

  // Events List
  eventsList: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventLeftSection: {
    alignItems: 'center',
    marginRight: 16,
  },
  eventTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    marginBottom: 8,
  },
  eventTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
  },
  eventIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#54FE54',
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    marginBottom: 8,
    lineHeight: 20,
  },
  eventMeta: {
    gap: 4,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventLocation: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
  eventCreator: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
  eventPoints: {
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  eventPointsText: {
    fontSize: 10,
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
  },
  deleteButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
  },

  // Empty Day
  emptyDayContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'rgba(84, 254, 84, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(84, 254, 84, 0.1)',
  },
  emptyDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
    marginTop: 8,
    marginBottom: 16,
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(84, 254, 84, 0.2)',
  },
  addEventButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
  },

  // Upcoming Events
  upcomingEventsList: {
    gap: 8,
  },
  upcomingEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  upcomingEventDate: {
    width: 50,
    alignItems: 'center',
    marginRight: 16,
  },
  upcomingEventDay: {
    fontSize: 18,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
  },
  upcomingEventMonth: {
    fontSize: 11,
    fontWeight: '500',
    color: '#54FE54',
    fontFamily: 'Montserrat-Medium',
    textTransform: 'uppercase',
  },
  upcomingEventContent: {
    flex: 1,
  },
  upcomingEventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 2,
  },
  upcomingEventTime: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },

  // Bottom spacing
  bottomSpacing: {
    height: 100,
  },
});