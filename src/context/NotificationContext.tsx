import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotification from 'react-native-push-notification';

export interface Destination {
  id: string;
  name: string;
  address: string;
  arrivalTime: string;
  travelTime: number; // in minutes
  notificationTime: number; // minutes before departure
  isActive: boolean;
  latitude?: number;
  longitude?: number;
}

interface NotificationContextType {
  destinations: Destination[];
  addDestination: (destination: Omit<Destination, 'id'>) => void;
  updateDestination: (id: string, updates: Partial<Destination>) => void;
  deleteDestination: (id: string) => void;
  toggleDestination: (id: string) => void;
  scheduleNotification: (destination: Destination) => void;
  cancelNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [destinations, setDestinations] = useState<Destination[]>([]);

  useEffect(() => {
    loadDestinations();
    setupPushNotifications();
  }, []);

  const setupPushNotifications = () => {
    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);
      },
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });

    PushNotification.createChannel(
      {
        channelId: 'commute-reminders',
        channelName: 'Commute Reminders',
        channelDescription: 'Notifications for commute reminders',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`Channel created: ${created}`)
    );
  };

  const loadDestinations = async () => {
    try {
      const stored = await AsyncStorage.getItem('destinations');
      if (stored) {
        const parsed = JSON.parse(stored);
        setDestinations(parsed);
        // Reschedule notifications for active destinations
        parsed.forEach((dest: Destination) => {
          if (dest.isActive) {
            scheduleNotification(dest);
          }
        });
      }
    } catch (error) {
      console.error('Error loading destinations:', error);
    }
  };

  const saveDestinations = async (newDestinations: Destination[]) => {
    try {
      await AsyncStorage.setItem('destinations', JSON.stringify(newDestinations));
    } catch (error) {
      console.error('Error saving destinations:', error);
    }
  };

  const addDestination = (destination: Omit<Destination, 'id'>) => {
    const newDestination: Destination = {
      ...destination,
      id: Date.now().toString(),
    };
    const newDestinations = [...destinations, newDestination];
    setDestinations(newDestinations);
    saveDestinations(newDestinations);
    
    if (newDestination.isActive) {
      scheduleNotification(newDestination);
    }
  };

  const updateDestination = (id: string, updates: Partial<Destination>) => {
    const newDestinations = destinations.map(dest =>
      dest.id === id ? { ...dest, ...updates } : dest
    );
    setDestinations(newDestinations);
    saveDestinations(newDestinations);
    
    const updatedDest = newDestinations.find(d => d.id === id);
    if (updatedDest) {
      cancelNotification(id);
      if (updatedDest.isActive) {
        scheduleNotification(updatedDest);
      }
    }
  };

  const deleteDestination = (id: string) => {
    cancelNotification(id);
    const newDestinations = destinations.filter(dest => dest.id !== id);
    setDestinations(newDestinations);
    saveDestinations(newDestinations);
  };

  const toggleDestination = (id: string) => {
    const newDestinations = destinations.map(dest =>
      dest.id === id ? { ...dest, isActive: !dest.isActive } : dest
    );
    setDestinations(newDestinations);
    saveDestinations(newDestinations);
    
    const toggledDest = newDestinations.find(d => d.id === id);
    if (toggledDest) {
      if (toggledDest.isActive) {
        scheduleNotification(toggledDest);
      } else {
        cancelNotification(id);
      }
    }
  };

  const scheduleNotification = (destination: Destination) => {
    if (!destination.isActive) return;

    const arrivalTime = new Date(destination.arrivalTime);
    const departureTime = new Date(arrivalTime.getTime() - destination.travelTime * 60000);
    const notificationTime = new Date(departureTime.getTime() - destination.notificationTime * 60000);

    // Only schedule if notification time is in the future
    if (notificationTime > new Date()) {
      PushNotification.localNotificationSchedule({
        channelId: 'commute-reminders',
        id: destination.id,
        title: 'Time to Leave!',
        message: `Leave now to reach ${destination.name} on time`,
        date: notificationTime,
        repeatType: 'day',
        allowWhileIdle: true,
        vibrate: true,
        playSound: true,
        soundName: 'default',
      });
    }
  };

  const cancelNotification = (id: string) => {
    PushNotification.cancelLocalNotifications({ id });
  };

  const value: NotificationContextType = {
    destinations,
    addDestination,
    updateDestination,
    deleteDestination,
    toggleDestination,
    scheduleNotification,
    cancelNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
