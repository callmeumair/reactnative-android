/**
 * CommuteTimely - Smart Commute Planning App
 * Production-ready React Native app with Material 3 design
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {StatusBar, Platform, View, Text} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ThemeProvider, useTheme} from './src/context/ThemeContext';
import {OnboardingScreen} from './src/screens/OnboardingScreen';
import {HomeScreen} from './src/screens/HomeScreen';
import {SettingsScreen} from './src/screens/SettingsScreen';
import {ensureDefaultChannel, initNotifications} from './src/services/notify';
import {backgroundCommuteService} from './src/services/backgroundService';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const ONBOARDING_STORAGE_KEY = '@CommuteTimely:onboardingCompleted';

function TabNavigator() {
  const {theme, isDark} = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarIcon: ({focused, color, size}) => {
          let iconName = '';
          
          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.outline,
          borderTopWidth: 0.5,
          paddingBottom: 10,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          paddingTop: 8,
        },
      })}>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const {theme, isDark} = useTheme();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
    initializeApp();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      setShowOnboarding(!completed);
    } catch (error) {
      console.warn('Failed to check onboarding status:', error);
      setShowOnboarding(true);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeApp = async () => {
    try {
      // Initialize notifications first
      initNotifications();
      ensureDefaultChannel();
      
      // Initialize background service for daily calculations with delay
      setTimeout(async () => {
        try {
          await backgroundCommuteService.initialize();
        } catch (error) {
          console.warn('Failed to initialize background service:', error);
        }
      }, 5000); // Increased delay to ensure app is fully loaded
    } catch (error) {
      console.warn('Failed to initialize app:', error);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.warn('Failed to save onboarding status:', error);
      setShowOnboarding(false);
    }
  };

  if (isLoading) {
    return null; // You could add a splash screen here
  }

  const navigationTheme = {
    dark: isDark,
    colors: {
      primary: theme.primary,
      background: theme.background,
      card: theme.surface,
      text: theme.onSurface,
      border: theme.outline,
      notification: theme.primary,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
        translucent={false}
      />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: {backgroundColor: theme.background},
        }}>
        {showOnboarding ? (
          <Stack.Screen name="Onboarding">
            {() => <OnboardingScreen onComplete={handleOnboardingComplete} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Main" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App(): JSX.Element {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
