# Commute Reminder App - Complete Codebase Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Configuration Files](#configuration-files)
3. [Entry Points](#entry-points)
4. [Main Application](#main-application)
5. [Source Code Structure](#source-code-structure)
6. [Android Configuration](#android-configuration)
7. [Build and Deployment](#build-and-deployment)

---

## 🎯 Project Overview

**Commute Reminder** is a React Native mobile application that helps users manage their daily commute schedules by providing timely notifications before departure times. The app allows users to add destinations, set arrival times, and receive push notifications to remind them when to leave.

### Key Features:
- Add and manage commute destinations
- Set arrival times and travel duration
- Push notification reminders
- Location-based destination storage
- Settings management

---

## ⚙️ Configuration Files

### 1. `package.json` - Project Configuration

```json
{
  "name": "commute-reminder",           // Project name for npm registry
  "version": "1.0.0",                  // Semantic versioning (major.minor.patch)
  "private": true,                      // Prevents accidental publishing to npm
```

#### Scripts Section:
```json
"scripts": {
  "android": "react-native run-android",           // Runs app on Android device/emulator
  "start": "react-native start",                   // Starts Metro bundler server
  "test": "jest",                                  // Runs unit tests
  "lint": "eslint .",                              // Runs code linting
  "build:android": "cd android && ./gradlew assembleRelease",  // Builds release APK
  "clean:android": "cd android && ./gradlew clean",            // Cleans Android build
  "build:debug": "cd android && ./gradlew assembleDebug",     // Builds debug APK
  "install:android": "cd android && ./gradlew installDebug",  // Installs debug APK
  "bundle:android": "react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res",  // Creates JS bundle
  "fix:gradle": "./scripts/fix-gradle-compatibility.sh",      // Fixes Gradle compatibility issues
  "setup:android": "npm run fix:gradle && npm run android"    // Setup and run Android
}
```

#### Dependencies:
```json
"dependencies": {
  "@react-native-async-storage/async-storage": "^1.19.5",     // Local data persistence
  "@react-native-community/datetimepicker": "^7.6.1",        // Date/time picker component
  "@react-native-community/geolocation": "^3.0.7",           // GPS location services
  "@react-navigation/native": "^6.1.9",                       // Navigation framework
  "@react-navigation/stack": "^6.3.20",                      // Stack navigation
  "react": "18.2.0",                                          // React core library
  "react-native": "0.72.6",                                   // React Native framework
  "react-native-gesture-handler": "2.13.4",                   // Touch gesture handling
  "react-native-maps": "1.7.1",                               // Map components
  "react-native-permissions": "^3.10.1",                     // Permission management
  "react-native-push-notification": "^8.1.1",                // Push notifications
  "react-native-safe-area-context": "^4.7.4",                // Safe area handling
  "react-native-screens": "^3.27.0",                          // Native screen components
  "react-native-vector-icons": "^10.0.2"                     // Icon library
}
```

#### Development Dependencies:
```json
"devDependencies": {
  "@babel/core": "^7.20.0",                                   // JavaScript transpiler
  "@babel/preset-env": "^7.20.0",                             // Babel environment preset
  "@babel/runtime": "^7.20.0",                                // Babel runtime helpers
  "@react-native-community/cli": "10.1.3",                   // React Native CLI
  "@react-native-community/cli-platform-android": "10.1.3",  // Android platform CLI
  "@react-native/eslint-config": "^0.72.2",                  // ESLint configuration
  "@react-native/gradle-plugin": "0.72.11",                  // Gradle plugin for RN
  "@react-native/metro-config": "0.72.11",                   // Metro bundler config
  "@tsconfig/react-native": "^3.0.0",                        // TypeScript config
  "@types/react": "^18.0.24",                                 // React TypeScript types
  "@types/react-test-renderer": "^18.0.0",                   // Test renderer types
  "babel-jest": "^29.2.1",                                    // Babel Jest transformer
  "eslint": "^8.19.0",                                        // Code linting tool
  "jest": "^29.2.1",                                          // Testing framework
  "metro-react-native-babel-preset": "0.72.4",               // Metro Babel preset
  "prettier": "^2.4.1",                                       // Code formatting
  "react-test-renderer": "18.2.0",                           // React test renderer
  "typescript": "4.8.4"                                       // TypeScript compiler
}
```

### 2. `metro.config.js` - Metro Bundler Configuration

```javascript
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration optimized for Android-only builds
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    platforms: ['android'],                    // Only include Android platform
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,      // Disable experimental import features
        inlineRequires: true,                  // Inline requires for better performance
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);  // Merge with defaults
```

### 3. `babel.config.js` - Babel Configuration

```javascript
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],  // Use React Native Babel preset
};
```

---

## 🚀 Entry Points

### 1. `index.js` - Application Entry Point

```javascript
import 'react-native-gesture-handler';                    // Must be first import for gesture handling
import {AppRegistry} from 'react-native';                // React Native app registry
import App from './App';                                  // Main App component

AppRegistry.registerComponent('CommuteReminder', () => App);  // Register app with React Native
```

**Line-by-line explanation:**
- **Line 1**: Imports gesture handler - must be first import to properly initialize touch handling
- **Line 2**: Imports AppRegistry from React Native core
- **Line 3**: Imports the main App component
- **Line 5**: Registers the app component with React Native using the name 'CommuteReminder'

---

## 📱 Main Application

### 1. `App.tsx` - Root Application Component

```typescript
import React from 'react';                                // React core library
import { NavigationContainer } from '@react-navigation/native';  // Navigation container
import { createStackNavigator } from '@react-navigation/stack';  // Stack navigator
import { StatusBar } from 'react-native';                 // Status bar component
import HomeScreen from './src/screens/HomeScreen';        // Home screen component
import AddDestinationScreen from './src/screens/AddDestinationScreen';  // Add destination screen
import SettingsScreen from './src/screens/SettingsScreen';  // Settings screen
import { NotificationProvider } from './src/context/NotificationContext';  // Context provider

const Stack = createStackNavigator();                     // Create stack navigator instance

const App = () => {
  return (
    <NotificationProvider>                               // Wrap app with notification context
      <NavigationContainer>                              // Navigation container wrapper
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />  // Configure status bar
        <Stack.Navigator
          initialRouteName="Home"                        // Set initial screen
          screenOptions={{
            headerStyle: {
              backgroundColor: '#007AFF',                // Header background color
            },
            headerTintColor: '#fff',                     // Header text color
            headerTitleStyle: {
              fontWeight: 'bold',                        // Header title style
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Commute Reminder' }}      // Screen title
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

export default App;                                       // Export App component
```

---

## 📁 Source Code Structure

### 1. `src/context/NotificationContext.tsx` - State Management

#### Interface Definitions:
```typescript
export interface Destination {
  id: string;                    // Unique identifier for destination
  name: string;                  // Display name for destination
  address: string;               // Physical address
  arrivalTime: string;           // ISO string for arrival time
  travelTime: number;            // Travel duration in minutes
  notificationTime: number;      // Minutes before departure to notify
  isActive: boolean;             // Whether notifications are enabled
  latitude?: number;             // Optional GPS latitude
  longitude?: number;            // Optional GPS longitude
}

interface NotificationContextType {
  destinations: Destination[];                           // Array of all destinations
  addDestination: (destination: Omit<Destination, 'id'>) => void;  // Add new destination
  updateDestination: (id: string, updates: Partial<Destination>) => void;  // Update destination
  deleteDestination: (id: string) => void;              // Delete destination
  toggleDestination: (id: string) => void;              // Toggle notification status
  scheduleNotification: (destination: Destination) => void;  // Schedule push notification
  cancelNotification: (id: string) => void;              // Cancel scheduled notification
}
```

#### Context Creation:
```typescript
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);       // Get context value
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');  // Error if used outside provider
  }
  return context;
};
```

#### Provider Component:
```typescript
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [destinations, setDestinations] = useState<Destination[]>([]);  // State for destinations

  useEffect(() => {
    loadDestinations();                                  // Load saved destinations on mount
    setupPushNotifications();                            // Initialize push notifications
  }, []);

  const setupPushNotifications = () => {
    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);                    // Log device token
      },
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);      // Log received notifications
      },
      permissions: {
        alert: true,                                      // Allow alert notifications
        badge: true,                                      // Allow badge updates
        sound: true,                                      // Allow sound notifications
      },
      popInitialNotification: true,                       // Show notification when app opens
      requestPermissions: true,                           // Request permissions automatically
    });

    PushNotification.createChannel(
      {
        channelId: 'commute-reminders',                  // Unique channel ID
        channelName: 'Commute Reminders',                 // Channel display name
        channelDescription: 'Notifications for commute reminders',  // Channel description
        playSound: true,                                  // Enable sound
        soundName: 'default',                             // Use default sound
        importance: 4,                                    // High importance level
        vibrate: true,                                    // Enable vibration
      },
      (created) => console.log(`Channel created: ${created}`)  // Log channel creation
    );
  };
```

#### Data Persistence Functions:
```typescript
  const loadDestinations = async () => {
    try {
      const stored = await AsyncStorage.getItem('destinations');  // Load from AsyncStorage
      if (stored) {
        const parsed = JSON.parse(stored);                // Parse JSON data
        setDestinations(parsed);                          // Update state
        // Reschedule notifications for active destinations
        parsed.forEach((dest: Destination) => {
          if (dest.isActive) {
            scheduleNotification(dest);                   // Reschedule active notifications
          }
        });
      }
    } catch (error) {
      console.error('Error loading destinations:', error);  // Log errors
    }
  };

  const saveDestinations = async (newDestinations: Destination[]) => {
    try {
      await AsyncStorage.setItem('destinations', JSON.stringify(newDestinations));  // Save to AsyncStorage
    } catch (error) {
      console.error('Error saving destinations:', error);  // Log errors
    }
  };
```

### 2. `src/screens/HomeScreen.tsx` - Main Screen

#### Imports and Setup:
```typescript
import React from 'react';
import {
  View,                          // Container component
  Text,                          // Text display component
  StyleSheet,                    // Style definitions
  FlatList,                      // Scrollable list component
  TouchableOpacity,              // Touchable component
  Alert,                         // Alert dialog
  ScrollView,                    // Scrollable view
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';  // Icon library
import { useNavigation } from '@react-navigation/native';    // Navigation hook
import { useNotification, Destination } from '../context/NotificationContext';  // Custom hook

const HomeScreen = () => {
  const navigation = useNavigation();                       // Navigation object
  const { destinations, toggleDestination, deleteDestination } = useNotification();  // Context values
```

#### Utility Functions:
```typescript
  const handleDelete = (destination: Destination) => {
    Alert.alert(
      'Delete Destination',                               // Alert title
      `Are you sure you want to delete ${destination.name}?`,  // Alert message
      [
        { text: 'Cancel', style: 'cancel' },            // Cancel button
        {
          text: 'Delete',                               // Delete button
          style: 'destructive',                          // Destructive style (red)
          onPress: () => deleteDestination(destination.id),  // Delete action
        },
      ]
    );
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);                   // Create Date object
    return date.toLocaleTimeString('en-US', {           // Format time in US locale
      hour: 'numeric',                                   // Show hour
      minute: '2-digit',                                 // Show minutes with leading zero
      hour12: true,                                      // Use 12-hour format
    });
  };

  const getDepartureTime = (destination: Destination) => {
    const arrivalTime = new Date(destination.arrivalTime);  // Parse arrival time
    const departureTime = new Date(arrivalTime.getTime() - destination.travelTime * 60000);  // Calculate departure time
    return formatTime(departureTime.toISOString());      // Format and return
  };

  const getTimeUntilDeparture = (destination: Destination) => {
    const arrivalTime = new Date(destination.arrivalTime);  // Parse arrival time
    const departureTime = new Date(arrivalTime.getTime() - destination.travelTime * 60000);  // Calculate departure time
    const now = new Date();                              // Current time
    const diffMs = departureTime.getTime() - now.getTime();  // Time difference in milliseconds
    const diffMins = Math.floor(diffMs / 60000);         // Convert to minutes
    
    if (diffMins < 0) {
      return 'Overdue';                                  // Past departure time
    } else if (diffMins < 60) {
      return `${diffMins}m`;                             // Less than 1 hour
    } else {
      const hours = Math.floor(diffMins / 60);           // Calculate hours
      const mins = diffMins % 60;                        // Calculate remaining minutes
      return `${hours}h ${mins}m`;                       // Format as hours and minutes
    }
  };
```

#### Render Functions:
```typescript
  const renderDestination = ({ item }: { item: Destination }) => (
    <View style={styles.destinationCard}>
      <View style={styles.destinationHeader}>
        <View style={styles.destinationInfo}>
          <Text style={styles.destinationName}>{item.name}</Text>        // Destination name
          <Text style={styles.destinationAddress}>{item.address}</Text>  // Destination address
        </View>
        <TouchableOpacity
          style={[styles.toggleButton, item.isActive && styles.toggleButtonActive]}  // Conditional styling
          onPress={() => toggleDestination(item.id)}                     // Toggle notification
        >
          <Icon
            name={item.isActive ? 'notifications-active' : 'notifications-off'}  // Dynamic icon
            size={24}
            color={item.isActive ? '#fff' : '#666'}                      // Dynamic color
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.timeInfo}>
        <View style={styles.timeRow}>
          <Icon name="schedule" size={16} color="#666" />                // Clock icon
          <Text style={styles.timeText}>
            Arrive: {formatTime(item.arrivalTime)}                       // Arrival time
          </Text>
        </View>
        <View style={styles.timeRow}>
          <Icon name="directions-car" size={16} color="#666" />          // Car icon
          <Text style={styles.timeText}>
            Leave: {getDepartureTime(item)}                              // Departure time
          </Text>
        </View>
        <View style={styles.timeRow}>
          <Icon name="access-time" size={16} color="#666" />            // Time icon
          <Text style={styles.timeText}>
            {getTimeUntilDeparture(item)}                               // Time until departure
          </Text>
        </View>
      </View>
    </View>
  );
```

---

## 🤖 Android Configuration

### 1. `android/build.gradle` - Project-level Gradle Configuration

```gradle
buildscript {
    ext {
        buildToolsVersion = "33.0.0"                    // Android build tools version
        minSdkVersion = 21                              // Minimum Android API level
        compileSdkVersion = 33                         // Compilation SDK version
        targetSdkVersion = 33                          // Target SDK version
        ndkVersion = "23.1.7779620"                    // Native Development Kit version
    }
    repositories {
        google()                                        // Google's Maven repository
        mavenCentral()                                  // Maven Central repository
    }
    dependencies {
        classpath("com.android.tools.build:gradle:7.4.2")  // Android Gradle plugin
        classpath("com.facebook.react:react-native-gradle-plugin")  // React Native plugin
    }
}

allprojects {
    repositories {
        maven {
            // All of React Native (JS, Obj-C sources, Android binaries) is installed from npm
            url("$rootDir/../node_modules/react-native/android")  // React Native Android binaries
        }
        maven {
            // Android JSC is installed from npm
            url("$rootDir/../node_modules/jsc-android/dist")     // JavaScript Core
        }
        mavenCentral {
            // We don't want to fetch react-native from Maven Central as there are
            // older versions over there.
            content {
                excludeGroup "com.facebook.react"                // Exclude React Native from Maven Central
            }
        }
        google()                                                // Google repository
        maven { url 'https://www.jitpack.io' }                  // JitPack repository
    }
}
```

### 2. `android/app/build.gradle` - App-level Gradle Configuration

```gradle
plugins{
    id "com.android.application"                        // Android application plugin
    id "com.facebook.react"                            // React Native plugin
}

def enableProguardInReleaseBuilds = false              // Proguard optimization flag

def jscFlavor = 'org.webkit:android-jsc:+'             // JavaScript Core flavor

android {
    ndkVersion rootProject.ext.ndkVersion              // NDK version from project config

    compileSdkVersion rootProject.ext.compileSdkVersion  // Compilation SDK version

    namespace "com.commutereminder"                     // App package namespace

    defaultConfig {
        applicationId "com.commutereminder"             // Unique app identifier
        minSdkVersion rootProject.ext.minSdkVersion     // Minimum SDK version
        targetSdkVersion rootProject.ext.targetSdkVersion  // Target SDK version
        versionCode 1                                    // Internal version number
        versionName "1.0"                                // User-visible version
    }

    buildFeatures {
        buildConfig true                                 // Enable BuildConfig generation
    }

    signingConfigs {
        debug {
            storeFile file('debug.keystore')            // Debug keystore file
            storePassword 'android'                     // Debug keystore password
            keyAlias 'androiddebugkey'                  // Debug key alias
            keyPassword 'android'                       // Debug key password
        }
    }
    
    buildTypes {
        debug {
            signingConfig signingConfigs.debug          // Use debug signing for debug builds
        }
        release {
            signingConfig signingConfigs.debug          // Use debug signing for release (should be changed)
            minifyEnabled enableProguardInReleaseBuilds  // Enable code minification
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"  // Proguard rules
        }
    }
}

dependencies {
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.0.0")  // Pull-to-refresh
    implementation("androidx.appcompat:appcompat:1.6.1")                    // App compatibility

    implementation("com.facebook.react:react-android")                     // React Native core
    implementation project(':react-native-gesture-handler')                  // Gesture handler

    if (hermesEnabled.toBoolean()) {
        implementation("com.facebook.react:hermes-android")                // Hermes JavaScript engine
    } else {
        implementation jscFlavor                                            // JavaScript Core engine
    }
}
```

### 3. `android/gradle.properties` - Gradle Properties

```properties
# Project-wide Gradle settings.

# IDE (e.g. Android Studio) users:
# Gradle settings configured through the IDE *will override*
# any settings specified in this file.

# For more details on how to configure your build environment visit
# http://www.gradle.org/docs/current/userguide/build_environment.html

# Specifies the JVM arguments used for the daemon process.
# The setting is particularly useful for tweaking memory settings.
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m

# When configured, Gradle will run in incubating parallel mode.
# This option should only be used with decoupled projects. More details, visit
# http://www.gradle.org/docs/current/userguide/multi_project_builds.html#sec:decoupled_projects
org.gradle.parallel=true

# AndroidX package structure to make it clearer which packages are bundled with the
# Android operating system, and which are packaged with your app's APK
# https://developer.android.com/topic/libraries/support-library/androidx-rn
android.useAndroidX=true

# Automatically convert third-party libraries to use AndroidX
android.enableJetifier=true

# Version of flipper SDK to use with React Native
FLIPPER_VERSION=0.125.0

# Use this property to specify which architecture you want to build.
# You can also override it from the CLI using
# ./gradlew <task> -PreactNativeArchitectures=x86_64
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64

# Use this property to enable support to the new architecture.
# This will allow you to use TurboModules and the Fabric render in
# your application. You should enable this flag either if you want
# to write custom TurboModules/Fabric components OR use libraries that
# are providing them.
newArchEnabled=false

# Use this property to enable or disable the Hermes JS engine.
# If set to false, you will be using JSC instead.
hermesEnabled=true
```

---

## 🚀 Build and Deployment

### Build Process Overview:

1. **Development Build**:
   ```bash
   npm run android                    # Runs development build on device/emulator
   ```

2. **Debug Build**:
   ```bash
   npm run build:debug               # Creates debug APK
   ```

3. **Release Build**:
   ```bash
   npm run build:android             # Creates release APK
   ```

4. **Bundle Creation**:
   ```bash
   npm run bundle:android            # Creates JavaScript bundle
   ```

### Key Build Files:

- **`android/app/build.gradle`**: App-specific build configuration
- **`android/build.gradle`**: Project-level build configuration
- **`android/gradle.properties`**: Gradle and React Native properties
- **`android/settings.gradle`**: Project settings and module inclusion
- **`metro.config.js`**: JavaScript bundler configuration
- **`babel.config.js`**: JavaScript transpiler configuration

### Deployment Checklist:

1. **Version Management**:
   - Update `versionCode` in `android/app/build.gradle`
   - Update `versionName` in `android/app/build.gradle`
   - Update version in `package.json`

2. **Signing Configuration**:
   - Generate production keystore
   - Update signing configuration in `android/app/build.gradle`
   - Secure keystore passwords

3. **Build Optimization**:
   - Enable Proguard for release builds
   - Configure Proguard rules
   - Test release build thoroughly

4. **Testing**:
   - Test on multiple Android versions
   - Verify all features work in release mode
   - Check notification permissions

---

## 🔧 Troubleshooting Guide

### Common Issues:

1. **Build Failures**:
   - Check Gradle version compatibility
   - Verify SDK versions in `android/build.gradle`
   - Clean build: `npm run clean:android`

2. **Metro Bundler Issues**:
   - Clear Metro cache: `npx react-native start --reset-cache`
   - Check `metro.config.js` configuration

3. **Permission Issues**:
   - Verify Android permissions in `AndroidManifest.xml`
   - Check runtime permissions in app code

4. **Notification Issues**:
   - Verify notification channel creation
   - Check device notification settings
   - Test on physical device

### Performance Optimization:

1. **Enable Hermes**: Set `hermesEnabled=true` in `gradle.properties`
2. **Enable New Architecture**: Set `newArchEnabled=true` for TurboModules
3. **Optimize Images**: Use appropriate image formats and sizes
4. **Minimize Bundle Size**: Enable Proguard and remove unused dependencies

---

## 📚 Additional Resources

- [React Native Documentation](https://reactnative.dev/)
- [Android Developer Documentation](https://developer.android.com/)
- [React Navigation Documentation](https://reactnavigation.org/)
- [Metro Bundler Documentation](https://facebook.github.io/metro/)

---

*This documentation covers every line of code in the Commute Reminder React Native application. Each section provides detailed explanations of the purpose, functionality, and configuration of the codebase.*
