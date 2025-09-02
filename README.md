# CommuteTimely App (Android Only)

A React Native app optimized for Android that helps users never be late by sending timely notifications about when to leave home to reach their destination on time.

## Features

- Add multiple destinations (office, school, college, etc.)
- Set arrival times and travel duration
- Configure notification timing
- Daily recurring notifications
- Beautiful, intuitive UI optimized for Android
- Persistent storage of destinations
- Toggle notifications on/off for each destination
- Android-specific optimizations and configurations

## Prerequisites

- Node.js (v16 or higher)
- Java Development Kit (JDK) 11 or 17
- Android Studio with Android SDK
- Android Emulator or physical device

## Installation

1. Install dependencies:
```bash
npm install
```

2. For Android development, make sure you have:
   - Android Studio installed
   - Android SDK (API level 21 or higher)
   - Android Emulator running or physical device connected

## Running the App

### Start Metro Bundler
```bash
npm start
```

### Run on Android
```bash
npm run android
```

This will:
1. Build the Android app
2. Install it on the emulator/device
3. Start the Metro bundler
4. Launch the app

## Android-Specific Commands

```bash
# Build debug APK
npm run build:debug

# Build release APK
npm run build:android

# Clean Android build
npm run clean:android

# Install debug APK on device
npm run install:android

# Bundle JavaScript for production
npm run bundle:android
```

## Project Structure

```
src/
├── context/
│   └── NotificationContext.tsx    # Notification management (Android optimized)
├── screens/
│   ├── HomeScreen.tsx             # Main screen with destinations
│   ├── AddDestinationScreen.tsx   # Add/edit destinations
│   └── SettingsScreen.tsx         # App settings
App.tsx                            # Main app component
android/                           # Android-specific configurations
```

## Android Configuration

The project is optimized for Android with:
- Metro bundler configured for Android-only builds
- Android-specific build scripts
- Optimized notification handling for Android
- Proper Android permissions and manifest configuration

## How It Works

1. **Add Destinations**: Users can add destinations with names, addresses, arrival times, and travel duration
2. **Calculate Departure Time**: The app automatically calculates when to leave based on arrival time and travel duration
3. **Schedule Notifications**: Notifications are scheduled to remind users when to leave
4. **Daily Recurring**: Notifications repeat daily at the same time
5. **Persistent Storage**: All destinations are saved locally and persist between app launches

## Permissions

The app requires the following Android permissions:
- `VIBRATE` - For notification vibrations
- `WAKE_LOCK` - To ensure notifications are delivered
- `RECEIVE_BOOT_COMPLETED` - To reschedule notifications after device restart
- `ACCESS_FINE_LOCATION` - For future location-based features
- `ACCESS_COARSE_LOCATION` - For future location-based features

## Troubleshooting

### Common Issues

1. **Build fails**: Make sure you have the correct JDK version installed
2. **Emulator not found**: Start an Android emulator before running the app
3. **Metro bundler issues**: Try clearing the cache with `npm start -- --reset-cache`

### Clean Build
If you encounter build issues, try:
```bash
npm run clean:android
npm run android
```

## Future Enhancements

- Location-based travel time estimation
- Traffic-aware departure time calculation
- Multiple notification sounds
- Widget support
- Wear OS companion app
- Cloud sync across devices

## License

This project is for educational purposes.
