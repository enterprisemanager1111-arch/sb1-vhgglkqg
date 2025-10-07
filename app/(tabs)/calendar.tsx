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
} from 'react-native';
import { router } from 'expo-router';

export default function Calendar() {
  const scrollViewRef = useRef<ScrollView>(null);
  
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
          <Text style={styles.summaryTitle}>{mockData.currentDate}</Text>
          <Text style={styles.summarySubtitle}>Your current calendar progress</Text>
          
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
            style={styles.dateSelectorScrollView}
            contentContainerStyle={styles.dateSelector}
          >
            {dates.map((date, index) => (
              <Pressable
                key={index}
                style={[
                  styles.dateCard,
                  selectedDate === date && styles.dateCardSelected
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  styles.dateNumber,
                  selectedDate === date && styles.dateNumberSelected
                ]}>
                  {date.split(' ')[0]}
                </Text>
                <Text style={[
                  styles.dateDay,
                  selectedDate === date && styles.dateDaySelected
                ]}>
                  {date.split(' ')[1]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          </View>

         {/* Event Cards */}
         <View style={styles.contentContainer}>
           <View style={styles.eventsContainer}>
             {mockData.events.map((event) => (
               <View key={event.id} style={styles.calendarEventCard}>
                 <View style={styles.eventHeader}>
                   <Text style={styles.eventMainTitle}>{event.title}</Text>
                   <Text style={styles.eventPrivateMessage}>{event.message}</Text>
          </View>

                 <View style={styles.eventDetailsContainer}>
                     <View style={styles.eventDetailsGroup}>
                       <View style={styles.eventDetailItemLeft}>
                         <Text style={styles.eventDetailLabel}>Event Title</Text>
                         <Text style={styles.eventDetailValue} numberOfLines={1}>{event.eventTitle}</Text>
                    </View>
                       <View style={styles.eventDetailItemCenter}>
                         <Text style={styles.eventDetailLabel}>Start Time</Text>
                         <Text style={styles.eventDetailValue} numberOfLines={1}>{event.startTime}</Text>
                  </View>
                       <View style={styles.eventDetailItemRight}>
                         <Text style={styles.eventDetailLabel}>Duration</Text>
                         <Text style={styles.eventDetailValue} numberOfLines={1}>{event.duration}</Text>
                      </View>
                    </View>
                  </View>

                 <View style={styles.eventFooter}>
                   <View style={styles.eventAttendees}>
                     {event.attendees.map((attendee, index) => (
                       <View key={index} style={[styles.attendeeAvatar, { backgroundColor: ['#FFB6C1', '#87CEEB', '#FFD700'][index] }]} />
                     ))}
                </View>
                   <View style={styles.eventDateContainer}>
                     <Image
                       source={require('@/assets/images/icon/calendar2_dis.png')}
                       style={styles.calendarIcon}
                     />
                     <Text style={styles.eventDate}>{event.date}</Text>
                  </View>
                  </View>
                </View>
              ))}
            </View>
         </View>
      </ScrollView>
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
    marginBottom: 16,
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
    paddingRight: 20, // Add right padding for better scrolling experience
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
});