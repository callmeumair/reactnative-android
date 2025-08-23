import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// Import screens
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LocationSetupScreen from '../screens/LocationSetupScreen';
import CommuteDetailsScreen from '../screens/CommuteDetailsScreen';
import WeatherDetailsScreen from '../screens/WeatherDetailsScreen';
import SplashScreen from '../screens/SplashScreen';

// Import services
import { getHomeLocation, getWorkLocation } from '../services/locationService';
import { initializeTheme, getCurrentTheme, addThemeListener, getStatusBarStyle } from '../utils/theme';
import { initializeNotifications } from '../services/notificationService';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator
const TabNavigator = () => {
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());

  useEffect(() => {
    const handleThemeChange = (theme) => {
      setCurrentTheme(theme);
    };

    addThemeListener(handleThemeChange);

    return () => {
      // Remove listener when component unmounts
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: currentTheme === 'dark' ? '#0A84FF' : '#007AFF',
        tabBarInactiveTintColor: currentTheme === 'dark' ? '#8E8E93' : '#8E8E93',
        tabBarStyle: {
          backgroundColor: currentTheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
          borderTopColor: currentTheme === 'dark' ? '#38383A' : '#E5E5EA',
        },
        headerStyle: {
          backgroundColor: currentTheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
        },
        headerTintColor: currentTheme === 'dark' ? '#FFFFFF' : '#1C1C1E',
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'CommuteTimely',
          headerLargeTitle: true,
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

// Main app navigator
const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize theme
      await initializeTheme();
      setCurrentTheme(getCurrentTheme());

      // Initialize notifications
      initializeNotifications();

      // Check if user has completed onboarding
      const [homeLocation, workLocation] = await Promise.all([
        getHomeLocation(),
        getWorkLocation(),
      ]);

      if (!homeLocation || !workLocation) {
        setNeedsOnboarding(true);
      }

      // Add theme change listener
      addThemeListener((theme) => {
        setCurrentTheme(theme);
      });

      setIsLoading(false);
    } catch (error) {
      console.error('App initialization error:', error);
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false);
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer
      theme={{
        dark: currentTheme === 'dark',
        colors: {
          primary: currentTheme === 'dark' ? '#0A84FF' : '#007AFF',
          background: currentTheme === 'dark' ? '#000000' : '#FFFFFF',
          card: currentTheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
          text: currentTheme === 'dark' ? '#FFFFFF' : '#1C1C1E',
          border: currentTheme === 'dark' ? '#38383A' : '#E5E5EA',
          notification: currentTheme === 'dark' ? '#FF453A' : '#FF3B30',
        },
      }}
    >
      <StatusBar 
        barStyle={getStatusBarStyle()} 
        backgroundColor={currentTheme === 'dark' ? '#000000' : '#FFFFFF'}
        translucent={false}
      />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          transitionSpec: {
            open: {
              animation: 'timing',
              config: { duration: 300 },
            },
            close: {
              animation: 'timing',
              config: { duration: 300 },
            },
          },
        }}
      >
        {needsOnboarding ? (
          <>
            <Stack.Screen 
              name="Onboarding" 
              options={{ headerShown: false }}
            >
              {(props) => (
                <OnboardingScreen
                  {...props}
                  onComplete={handleOnboardingComplete}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="LocationSetup"
              component={LocationSetupScreen}
              options={{
                headerShown: true,
                title: 'Set Up Locations',
                gestureEnabled: false,
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen
              name="CommuteDetails"
              component={CommuteDetailsScreen}
              options={{
                headerShown: true,
                title: 'Commute Details',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="WeatherDetails"
              component={WeatherDetailsScreen}
              options={{
                headerShown: true,
                title: 'Weather Details',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="LocationSetup"
              component={LocationSetupScreen}
              options={{
                headerShown: true,
                title: 'Update Locations',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;