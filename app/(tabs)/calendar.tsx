import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useCalendarEventsByDate } from '@/hooks/useCalendarEventsByDate';

export default function Calendar() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>(() => {
    // Initialize with 5 days centered around today
    const today = new Date();
    const fiveDays = [];
    for (let i = -2; i <= 2; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      fiveDays.push(date);
    }
    return fiveDays;
  });
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // State for single date selection - default to today
  const [selectedSingleDate, setSelectedSingleDate] = useState<Date | null>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day
    return today;
  });
  
  // Fetch events for selected single date
  const { events: calendarEvents, loading: eventsLoading, error: eventsError, refreshEvents } = useCalendarEventsByDate(selectedSingleDate);

  // Listen for refresh events from notifications
  useEffect(() => {
    const handleRefreshCalendar = () => {
      console.log('🔄 Calendar refresh triggered from notification');
      refreshEvents();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('refreshCalendar', handleRefreshCalendar);
      
      return () => {
        window.removeEventListener('refreshCalendar', handleRefreshCalendar);
      };
    }
  }, [refreshEvents]);

  // Ensure today's events are loaded by default
  useEffect(() => {
    if (selectedSingleDate) {
      console.log('📅 Calendar loaded with selected date:', selectedSingleDate.toISOString().split('T')[0]);
      console.log('📅 Today\'s events will be displayed by default');
    }
  }, [selectedSingleDate]);

  // Filter events for the selected single date
  const filteredEvents = useMemo(() => {
    if (!selectedSingleDate) {
      return calendarEvents; // Show all events if no single date is selected
    }
    
    const selectedDateString = selectedSingleDate.toISOString().split('T')[0];
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.event_date);
      const eventDateString = eventDate.toISOString().split('T')[0];
      return eventDateString === selectedDateString;
    });
  }, [calendarEvents, selectedSingleDate]);
  
  // Generate all dates for the current month
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Get the first day of the month and the number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Generate array of all dates in the month
  const dates = useMemo(() => {
    const dateArray = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayName = dayNames[date.getDay()];
      dateArray.push(`${day} ${dayName}`);
    }
    
    return dateArray;
  }, [currentYear, currentMonth, daysInMonth]);
  
  // Set today as the default selected date
  const today = currentDate.getDate();
  const todayDayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDate.getDay()];
  const [selectedDate, setSelectedDate] = useState(`${today} ${todayDayName}`);

  // Calendar modal handlers
  const handleCalendarButtonPress = () => {
    setShowCalendarModal(true);
  };

  const handleDateSelect = (date: Date) => {
    // Generate 5 consecutive days starting from the selected date
    const fiveDays = [];
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    for (let i = 0; i < 5; i++) {
      const newDate = new Date(year, month, day + i);
      fiveDays.push(newDate);
    }
    
    setSelectedDates(fiveDays);
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentDisplayMonth(prev => {
      const year = prev.getFullYear();
      const month = prev.getMonth();
      
      if (direction === 'prev') {
        return new Date(year, month - 1, 1);
      } else {
        return new Date(year, month + 1, 1);
      }
    });
  };

  const handleSubmitDates = () => {
    console.log('Selected dates:', selectedDates);
    setShowCalendarModal(false);
  };

  const handleCloseModal = () => {
    setShowCalendarModal(false);
  };

  // Generate calendar dates for the modal
  const generateCalendarDates = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    // Create a clean date for the first day of the month
    const firstDay = new Date(year, monthIndex, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    // Get number of days in current month
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    
    // Get number of days in previous month
    const daysInPrevMonth = new Date(year, monthIndex, 0).getDate();
    
    const dates = [];
    
    // Fill in previous month days (only the days needed to complete the first week)
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      dates.push(new Date(year, monthIndex - 1, day));
    }
    
    // Add current month days
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(new Date(year, monthIndex, day));
    }
    
    // Fill remaining slots with next month days (ensure we have exactly 42 days)
    const remainingSlots = 42 - dates.length;
    for (let day = 1; day <= remainingSlots; day++) {
      dates.push(new Date(year, monthIndex + 1, day));
    }
    
    return dates;
  };
  
  // Scroll to current date on component mount
  useEffect(() => {
    const scrollToCurrentDate = () => {
      if (scrollViewRef.current) {
        // Calculate the position to center the current date
        // Each date card is 64px wide + 8px gap = 72px per item
        const cardWidth = 72; // 64px width + 8px gap
        const currentDateIndex = today - 1; // Array is 0-indexed
        const scrollPosition = (currentDateIndex * cardWidth) - (cardWidth * 2); // Center by subtracting 2 cards worth
        
        scrollViewRef.current.scrollTo({
          x: Math.max(0, scrollPosition), // Ensure we don't scroll to negative position
          animated: true,
        });
      }
    };
    
    // Small delay to ensure the component is fully rendered
    const timer = setTimeout(scrollToCurrentDate, 100);
    return () => clearTimeout(timer);
  }, [today]);

  // Mock data for the design
  const mockData = {
    currentDate: `${new Date().toLocaleString('default', { month: 'long' })}, ${currentDate.getDate()}`,
    progress: {
      today: '2, Events',
      nextEvent: "Bob's Birthday"
    },
    events: [
      {
        id: 1,
        title: "Bob's Birthday",
        message: "Private message: Don't forget the gifts",
        eventTitle: "Birthday Party",
        startTime: "20:00 Uhr",
        duration: "30min",
        date: "20, September",
        attendees: ['A', 'B', 'C']
      },
      {
        id: 2,
        title: "Private Meeting",
        message: "Private message: Don't forget the gifts",
        eventTitle: "Private Meeting",
        startTime: "21:00 Uhr",
        duration: "1h",
        date: "20, September",
        attendees: ['A', 'B', 'C']
      }
    ]
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#17f196" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Calendar Events</Text>
            <Text style={styles.subtitle}>Don't miss your clock in schedule</Text>
          </View>
          <View style={styles.headerIllustration}>
            <Image
              source={require('@/assets/images/icon/clock_calendar.png')}
              style={styles.illustrationImage}
            />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Date and Progress */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryHeaderLeft}>
              <Text style={styles.summaryTitle}>{mockData.currentDate}</Text>
              <Text style={styles.summarySubtitle}>Your current calendar progress</Text>
            </View>
            <Pressable style={styles.calendarButton} onPress={handleCalendarButtonPress}>
              <Image
                source={require('@/assets/images/icon/calendar2_dis.png')}
                style={styles.calendarButtonIcon}
              />
            </Pressable>
          </View>
          
          <View style={styles.progressCards}>
            <View style={styles.progressCard}>
              <View style={styles.progressCardHeader}>
                <Image
                  source={require('@/assets/images/icon/clock.png')}
                  style={styles.progressIcon}
                />
                <Text style={styles.progressCardTitle}>Today</Text>
              </View>
              <Text style={styles.progressCardValue}>{mockData.progress.today}</Text>
            </View>
            
            <View style={styles.progressCard}>
              <View style={styles.progressCardHeader}>
                <Image
                  source={require('@/assets/images/icon/clock.png')}
                  style={styles.progressIcon}
                />
                <Text style={styles.progressCardTitle}>Next Event</Text>
              </View>
              <Text style={styles.progressCardValue}>{mockData.progress.nextEvent}</Text>
            </View>
          </View>

          {/* Date Selector - Horizontal Scrollable */}
          <ScrollView 
            ref={scrollViewRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            style={styles.dateSelectorScrollView}
            contentContainerStyle={styles.dateSelector}
          >
            {/* Always show selected dates (initialized with 5 days centered around today) */}
            {selectedDates.map((date, index) => {
              const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
              const dateString = `${date.getDate()} ${dayName}`;
              
              return (
                <Pressable
                  key={index}
                  style={[
                    styles.dateCard,
                    selectedDate === dateString && styles.dateCardSelected,
                    selectedSingleDate && selectedSingleDate.toDateString() === date.toDateString() && styles.dateCardFiltered
                  ]}
                  onPress={() => {
                    setSelectedDate(dateString);
                    setSelectedSingleDate(date);
                    console.log('📅 Selected single date:', date.toISOString().split('T')[0]);
                  }}
                >
                  <Text style={[
                    styles.dateNumber,
                    selectedDate === dateString && styles.dateNumberSelected
                  ]}>
                    {date.getDate()}
                  </Text>
                  <Text style={[
                    styles.dateDay,
                    selectedDate === dateString && styles.dateDaySelected
                  ]}>
                    {dayName}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          </View>

         {/* Event Cards */}
         <View style={styles.contentContainer}>
           <View style={styles.eventsContainer}>
             {eventsLoading ? (
               <View style={styles.loadingContainer}>
                 <ActivityIndicator size="small" color="#17f196" />
                 <Text style={styles.loadingText}>Loading events...</Text>
               </View>
             ) : eventsError ? (
               <View style={styles.errorContainer}>
                 <Text style={styles.errorText}>Error: {eventsError}</Text>
                 <Pressable 
                   style={styles.retryButton}
                   onPress={refreshEvents}
                 >
                   <Text style={styles.retryButtonText}>Retry</Text>
                 </Pressable>
               </View>
             ) : filteredEvents.length > 0 ? (
               filteredEvents.map((event) => {
                 const eventDate = new Date(event.event_date);
                 const endDate = event.end_date ? new Date(event.end_date) : null;
                 
                 // Format time
                 const formatTime = (date: Date) => {
                   return date.toLocaleTimeString('en-US', {
                     hour: '2-digit',
                     minute: '2-digit',
                     hour12: false
                   });
                 };
                 
                 // Calculate duration
                 const getDuration = () => {
                   if (endDate) {
                     const diffMs = endDate.getTime() - eventDate.getTime();
                     const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                     const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                     
                     if (diffHours > 0) {
                       return `${diffHours}h ${diffMinutes}m`;
                     } else {
                       return `${diffMinutes}m`;
                     }
                   }
                   return 'All day';
                 };
                 
                 return (
                   <View key={event.id} style={styles.calendarEventCard}>
                     <View style={styles.eventHeader}>
                       <Text style={styles.eventMainTitle}>{event.title}</Text>
                       {event.description && (
                         <Text style={styles.eventPrivateMessage}>{event.description}</Text>
                       )}
                     </View>

                     <View style={styles.eventDetailsContainer}>
                       <View style={styles.eventDetailsGroup}>
                         <View style={styles.eventDetailItemLeft}>
                           <Text style={styles.eventDetailLabel}>Event Title</Text>
                           <Text style={styles.eventDetailValue} numberOfLines={1}>{event.title}</Text>
                         </View>
                         <View style={styles.eventDetailItemCenter}>
                           <Text style={styles.eventDetailLabel}>Start Time</Text>
                           <Text style={styles.eventDetailValue} numberOfLines={1}>{formatTime(eventDate)}</Text>
                         </View>
                         <View style={styles.eventDetailItemRight}>
                           <Text style={styles.eventDetailLabel}>Duration</Text>
                           <Text style={styles.eventDetailValue} numberOfLines={1}>{getDuration()}</Text>
                         </View>
                       </View>
                     </View>

                     <View style={styles.eventFooter}>
                       <View style={styles.eventAttendees}>
                         {event.assigneeProfiles && event.assigneeProfiles.slice(0, 3).map((assignee, index) => (
                           <View 
                             key={assignee.id} 
                             style={[
                               styles.assigneeAvatar, 
                               index === 0 && styles.assigneeAvatar1,
                               index === 1 && styles.assigneeAvatar2,
                               index === 2 && styles.assigneeAvatar3
                             ]} 
                           >
                             {assignee.avatar_url ? (
                               <Image
                                 source={{ uri: assignee.avatar_url }}
                                 style={styles.assigneeAvatarImage}
                                 resizeMode="cover"
                               />
                             ) : (
                               <View style={styles.assigneeAvatarPlaceholder}>
                                 <Text style={styles.assigneeAvatarInitial}>
                                   {assignee.name?.charAt(0)?.toUpperCase() || '?'}
                                 </Text>
                               </View>
                             )}
                           </View>
                         ))}
                         {event.assigneeProfiles && event.assigneeProfiles.length > 3 && (
                           <View style={[styles.assigneeAvatar, styles.assigneeAvatar1]}>
                             <View style={styles.assigneeAvatarPlaceholder}>
                               <Text style={styles.assigneeAvatarInitial}>+{event.assigneeProfiles.length - 3}</Text>
                             </View>
                           </View>
                         )}
                       </View>
                       <View style={styles.eventDateContainer}>
                         <Image
                           source={require('@/assets/images/icon/calendar2_dis.png')}
                           style={styles.calendarIcon}
                         />
                         <Text style={styles.eventDate}>
                           {eventDate.toLocaleDateString('en-US', { 
                             day: 'numeric', 
                             month: 'long' 
                           })}
                         </Text>
                       </View>
                     </View>
                   </View>
                 );
               })
             ) : (
               <View style={styles.emptyStateContainer}>
                 <Text style={styles.emptyStateText}>
                   {selectedSingleDate 
                     ? `No events scheduled for ${selectedSingleDate.toLocaleDateString('en-US', { 
                         day: 'numeric', 
                         month: 'long' 
                       })}`
                     : 'No events scheduled for selected dates'
                   }
                 </Text>
                 {selectedSingleDate && (
                   <Pressable 
                     style={styles.showAllButton}
                     onPress={() => setSelectedSingleDate(null)}
                   >
                     <Text style={styles.showAllButtonText}>Show All Events</Text>
                   </Pressable>
                 )}
               </View>
             )}
            </View>
         </View>
      </ScrollView>

      {/* Calendar Selection Modal */}
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Calendar</Text>
              <Text style={styles.modalSubtitle}>Select 5 days to show in calendar</Text>
              
              <View style={styles.monthNavigation}>
                <Pressable 
                  style={styles.monthNavButton}
                  onPress={() => handleMonthChange('prev')}
                >
                  <ChevronLeft size={20} color="#17f196" />
                </Pressable>
                <Text style={styles.monthText}>
                  {currentDisplayMonth.toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </Text>
                <Pressable 
                  style={styles.monthNavButton}
                  onPress={() => handleMonthChange('next')}
                >
                  <ChevronRight size={20} color="#17f196" />
                </Pressable>
              </View>
            </View>

            <View style={styles.calendarGrid}>
              {/* Days of week header */}
              <View style={styles.daysHeader}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <Text key={day} style={styles.dayHeaderText}>{day}</Text>
                ))}
              </View>

              {/* Calendar dates */}
              <View style={styles.datesGrid}>
                {generateCalendarDates(currentDisplayMonth).map((date, index) => {
                  const isSelected = selectedDates.some(d => d.toDateString() === date.toDateString());
                  const isCurrentMonth = date.getMonth() === currentDisplayMonth.getMonth();
                  const isToday = date.toDateString() === new Date().toDateString();
                  
                  // Determine if this is start/end day or middle day
                  let isStartOrEndDay = false;
                  let isMiddleDay = false;
                  let isFirstDay = false;
                  let isLastDay = false;
                  
                  if (isSelected && selectedDates.length === 5) {
                    const selectedDateStrings = selectedDates.map(d => d.toDateString());
                    const currentDateString = date.toDateString();
                    const dateIndex = selectedDateStrings.indexOf(currentDateString);
                    
                    if (dateIndex === 0) {
                      isStartOrEndDay = true;
                      isFirstDay = true;
                    } else if (dateIndex === 4) {
                      isStartOrEndDay = true;
                      isLastDay = true;
                    } else if (dateIndex > 0 && dateIndex < 4) {
                      isMiddleDay = true;
                    }
                  }
                  
                  return (
                    <Pressable
                      key={index}
                      style={[
                        styles.dateButton,
                        isCurrentMonth && styles.currentMonthDate,
                        isFirstDay && styles.firstDay,
                        isLastDay && styles.lastDay,
                        isMiddleDay && styles.middleDate,
                        isToday && styles.todayDate
                      ]}
                      onPress={() => handleDateSelect(date)}
                    >
                      {/* Background strip for first day */}
                      {isFirstDay && <View style={styles.firstDayBackground} />}
                      
                      {/* Background strip for last day */}
                      {isLastDay && <View style={styles.lastDayBackground} />}
                      
                      <Text style={[
                        styles.dateText,
                        isCurrentMonth && styles.currentMonthDateText,
                        isFirstDay && styles.firstDayText,
                        isLastDay && styles.lastDayText,
                        isMiddleDay && styles.middleDateText,
                        isToday && styles.todayDateText
                      ]}>
                        {date.getDate()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.submitButton} onPress={handleSubmitDates}>
                <Text style={styles.submitButtonText}>Submit Date</Text>
              </Pressable>
              <Pressable style={styles.closeButton} onPress={handleCloseModal}>
                <Text style={styles.closeButtonText}>Close Popup</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f3f8',
  },
  header: {
    backgroundColor: '#17f196',
    paddingTop: 40,
    minHeight: 230,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: -90,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // paddingTop: 20,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FEFEFE',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D9D6FE',
  },
  headerIllustration: {
    marginLeft: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationImage: {
    width: 87,
    height: 80,
    resizeMode: 'contain',
  },
  scrollView: {
    flex: 1,
    marginTop: -10,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    marginBottom: 16,
    borderRadius: 8,
    padding: 20,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  summaryHeaderLeft: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#101828',
    lineHeight: 19.6, // 140% of 14px
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#475467',
    lineHeight: 16.8, // 140% of 12px
  },
  calendarButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EAECF0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  calendarButtonIcon: {
    width: 15,
    height: 15,
    resizeMode: 'contain',
  },
  progressCards: {
    flexDirection: 'row',
    gap: 16,
  },
  contentContainer: {
    paddingHorizontal: 10,
    // paddingTop: 20,
  },
  progressCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  progressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  progressIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  progressCardTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475467',
  },
  progressCardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  dateSelectorScrollView: {
    marginTop: 16,
  },
  dateSelector: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 0,
    // paddingRight: 20, // Add right padding for better scrolling experience
    justifyContent: 'center', // Center the cards when showing selected dates
  },
  dateCard: {
    width: 64,
    height: 118,
    flexShrink: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBECEE',
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCardSelected: {
    backgroundColor: '#17f196',
  },
  dateCardFiltered: {
    borderColor: '#17f196',
    borderWidth: 2,
  },
  dateNumber: {
    fontSize: 25,
    fontWeight: '500',
    color: '#2D2D2D',
    marginBottom: 2,
  },
  dateNumberSelected: {
    color: '#FFFFFF',
  },
  dateDay: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475467',
  },
  dateDaySelected: {
    color: '#FFFFFF',
  },

  eventsContainer: {
    gap: 16,
    paddingBottom: 100,
  },
  calendarEventCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
    padding: 12,
    marginTop: 8,
  },
  eventHeader: {
    marginBottom: 16,
  },
  eventMainTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#101828',
    marginBottom: 4,
  },
  eventPrivateMessage: {
    fontSize: 12,
    fontWeight: '400',
    color: '#101828',
  },
  eventDetailsContainer: {
    marginBottom: 16,
  },
  eventDetailsGroup: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 15,
    backgroundColor: '#F9FAFB',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventDetailItem: {
    padding: 5,
  },
  eventDetailItemLeft: {
    flex: 2,
    padding: 5,
    alignItems: 'flex-start',
  },
  eventDetailItemCenter: {
    flex: 1,
    padding: 5,
    alignItems: 'center',
  },
  eventDetailItemRight: {
    flex: 1,
    padding: 5,
    alignItems: 'flex-end',
  },
  eventDetailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475467',
    marginBottom: 2,
  },
  eventDetailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#344054',
  },
  eventDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  calendarIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  eventDate: {
    fontSize: 12,
    color: '#475467',
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventAttendees: {
    flexDirection: 'row',
    gap: -8,
  },
  attendeeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Calendar Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  calendarModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#101828',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#475467',
    marginBottom: 16,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthNavButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#101828',
  },
  calendarGrid: {
    marginBottom: 20,
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#475467',
    paddingVertical: 8,
  },
  datesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateButton: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  currentMonthDate: {
    // Default styling for current month dates
  },
  selectedDate: {
    backgroundColor: '#17f196',
    borderRadius: 20,
  },
  startEndDate: {
    backgroundColor: '#17F196',
    borderRadius: 20,
    marginVertical: 20,
  },
  middleDate: {
    backgroundColor: '#CBFDE8',
    borderRadius: 0, // Extend under start/end dates
    zIndex: -1, // Place behind start/end dates
  },
  firstDay: {
    backgroundColor: '#17F196',
    borderRadius: 20,
    zIndex: 2, // Place above background strip
    position: 'relative',
  },
  firstDayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#CBFDE8',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    zIndex: -1, // Place under the green round rectangle
  },
  lastDay: {
    backgroundColor: '#17F196',
    borderRadius: 20,
    zIndex: 2, // Place above background strip
    position: 'relative',
  },
  lastDayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#CBFDE8',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: -1, // Place under the green round rectangle
  },
  todayDate: {
    // Special styling for today
  },
  dateText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  currentMonthDateText: {
    color: '#101828',
  },
  selectedDateText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  startEndDateText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  firstDayText: {
    color: '#FFFFFF',
    fontWeight: '600',
    width: '100%',
    height: '100%',
    backgroundColor: '#17F196',
    textAlign: 'center',
    alignContent: 'center',
    borderRadius: 20,
  },
  lastDayText: {
    color: '#FFFFFF',
    fontWeight: '600',
    width: '100%',
    height: '100%',
    backgroundColor: '#17F196',
    textAlign: 'center',
    alignContent: 'center',
    borderRadius: 20,
  },
  middleDateText: {
    // color: '#17F196',
    // fontWeight: '600',
  },
  todayDateText: {
    color: '#fff',
    backgroundColor: '#ff8888',
    padding: 2,
    paddingHorizontal: 4,
    borderRadius: 10,
    // fontWeight: '700',
  },
  modalActions: {
    gap: 16,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  submitButton: {
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
  submitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  closeButton: {
    width: '100%',
    height: 50,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#17f196',
    fontFamily: 'Helvetica',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  emptyStateContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  errorContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#17f196',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  showAllButton: {
    backgroundColor: '#17f196',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  showAllButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  attendeeCountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
  },
  attendeeAvatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  attendeeInitials: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  assigneeAvatars: {
    flexDirection: 'row',
  },
  assigneeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginLeft: -8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assigneeAvatar1: {
    backgroundColor: '#FFB6C1',
    marginLeft: 0, // First avatar has no left margin
  },
  assigneeAvatar2: {
    backgroundColor: '#FFD700',
  },
  assigneeAvatar3: {
    backgroundColor: '#87CEEB',
  },
  assigneeAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  assigneeAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assigneeAvatarInitial: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
});