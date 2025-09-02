import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import AddDestinationScreen from './src/screens/AddDestinationScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { NotificationProvider } from './src/context/NotificationContext';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NotificationProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#007AFF',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Commute Reminder' }}
          />
          <Stack.Screen 
            name="AddDestination" 
            component={AddDestinationScreen} 
            options={{ title: 'Add Destination' }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ title: 'Settings' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </NotificationProvider>
  );
};

export default App;
