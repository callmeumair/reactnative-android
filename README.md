# CommuteTimely - Smart Commute Notifications

A React Native app that provides intelligent commute timing notifications based on live traffic and weather conditions.

## 🚀 Features

- **Smart Notifications**: Get notified when to leave based on real-time traffic and weather
- **Multiple Transport Modes**: Support for driving, walking, cycling, and public transit
- **Weather Integration**: Weather conditions factor into commute time calculations
- **Location Management**: Save and manage home and work locations
- **Dark Mode**: Automatic system theme detection with manual override
- **Clean UI/UX**: Modern, intuitive design with smooth animations
- **Cross-Platform**: Works on both Android and iOS

## 📱 Screenshots

*Screenshots will be added here*

## 🛠 Tech Stack

- **React Native 0.81.0** - Cross-platform mobile development
- **TypeScript** - Type-safe JavaScript
- **React Navigation 7** - Navigation and routing
- **Mapbox SDK** - Maps, routing, and geocoding
- **Weatherbit.io API** - Real-time weather data
- **AsyncStorage** - Local data persistence
- **React Native Push Notifications** - Local notifications
- **Vector Icons** - Beautiful iconography
- **Lottie** - Smooth animations

## 🔧 Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development - macOS only)
- Java Development Kit (JDK)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CommuteTimely
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **iOS Setup** (macOS only)
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **Android Setup**
   - Ensure Android SDK is installed and configured
   - Create a virtual device or connect a physical device

### API Keys Configuration

The app comes with pre-configured API keys for demo purposes:

- **Mapbox Access Token**: `pk.eyJ1IjoiY29tbXV0ZXRpbWVseSIsImEiOiJjbWUzMzUydmcwMmN1MmtzZnoycGs1ZDhhIn0.438vHnYipmUNS7JoCglyMg`
- **Weatherbit API Key**: `836afe5ccf9c46e1bc2fa3a894f676b3`

For production use, replace these with your own API keys in:
- `src/services/mapboxService.js` - Update `MAPBOX_ACCESS_TOKEN`
- `src/services/weatherService.js` - Update `WEATHERBIT_API_KEY`
- `android/app/build.gradle` - Update buildConfig fields
- `ios/CommuteTimely/Info.plist` - Update MBXAccessToken

### Running the App

#### Android
```bash
npm run android
```

#### iOS
```bash
npm run ios
```

#### Development Server
```bash
npm start
```

## 📁 Project Structure

```
CommuteTimely/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Screen components
│   │   ├── SplashScreen.js
│   │   ├── OnboardingScreen.js
│   │   ├── HomeScreen.js
│   │   ├── SettingsScreen.js
│   │   ├── LocationSetupScreen.js
│   │   ├── CommuteDetailsScreen.js
│   │   └── WeatherDetailsScreen.js
│   ├── services/           # API and business logic
│   │   ├── mapboxService.js
│   │   ├── weatherService.js
│   │   ├── locationService.js
│   │   ├── notificationService.js
│   │   └── commuteService.js
│   ├── navigation/         # Navigation configuration
│   │   └── AppNavigator.js
│   └── utils/              # Utility functions and constants
│       └── theme.js
├── android/                # Android-specific code
├── ios/                    # iOS-specific code
└── README.md
```

## 🔑 Key Components

### Services

#### MapboxService
- Route calculation with live traffic
- Geocoding and reverse geocoding
- Matrix API for multiple destinations
- Traffic-aware routing

#### WeatherService
- Current weather conditions
- Weather forecast data
- Impact analysis for commute times
- Multi-location weather fetching

#### LocationService
- Current location detection
- Location permission management
- Home/work location storage
- Distance calculations

#### NotificationService
- Local push notifications
- Scheduled commute reminders
- Weather and traffic alerts
- Notification settings management

#### CommuteService
- Intelligent commute calculations
- Multi-modal transport support
- Weather impact integration
- Real-time updates

### Screens

#### HomeScreen
- Main dashboard with commute overview
- Transport mode selection
- Weather information
- Quick actions

#### OnboardingScreen
- App introduction and feature overview
- Smooth page transitions
- User-friendly setup flow

#### LocationSetupScreen
- Address search and selection
- Current location detection
- Saved locations management

#### SettingsScreen
- Notification preferences
- Theme selection
- App configuration

## 🌟 Features in Detail

### Smart Commute Calculations
- Real-time traffic data integration
- Weather impact analysis
- Buffer time calculations
- Multiple transport modes

### Weather Integration
- Current conditions analysis
- Precipitation, visibility, and wind impact
- Temperature effects on travel
- Severe weather alerts

### Notification System
- Customizable advance notice times
- Smart scheduling based on conditions
- Weather and traffic alerts
- Background location support

### Theme Support
- Automatic dark/light mode detection
- Manual theme override
- Consistent theming across all screens
- Smooth theme transitions

## 🔐 Permissions

### Android
- `ACCESS_FINE_LOCATION` - Precise location access
- `ACCESS_BACKGROUND_LOCATION` - Background location for notifications
- `INTERNET` - API access
- `WAKE_LOCK` - Notification scheduling
- `VIBRATE` - Notification alerts

### iOS
- `NSLocationWhenInUseUsageDescription` - Location access when app is active
- `NSLocationAlwaysAndWhenInUseUsageDescription` - Background location access
- Background modes for location and notifications

## 📊 Performance Considerations

- Efficient API calling with caching
- Optimized location tracking
- Background task management
- Memory-efficient image loading
- Smooth animations with native drivers

## 🚧 Development

### Adding New Features

1. **New Screen**: Create in `src/screens/` and add to navigation
2. **New Service**: Create in `src/services/` and import where needed
3. **UI Components**: Add to `src/components/` for reusability
4. **Utilities**: Add helper functions to `src/utils/`

### Code Style

- Use TypeScript for type safety
- Follow React hooks patterns
- Implement error handling
- Add loading states
- Use themed styles

### Testing

```bash
npm test
```

## 🐛 Troubleshooting

### Common Issues

1. **Location Permission Denied**
   - Check device settings
   - Restart app after granting permissions

2. **API Errors**
   - Verify API keys are correct
   - Check internet connection
   - Review API usage limits

3. **Build Issues**
   - Clean build cache: `npx react-native clean`
   - Reinstall dependencies: `rm -rf node_modules && npm install`
   - iOS: `cd ios && pod install`

4. **Notification Issues**
   - Check notification permissions
   - Verify background app refresh is enabled
   - Test on physical device (notifications don't work on simulator)

## 📈 Future Enhancements

- [ ] Route optimization with multiple stops
- [ ] Historical commute analytics
- [ ] Integration with calendar apps
- [ ] Carpool and ride-sharing options
- [ ] Voice commands and Siri shortcuts
- [ ] Apple Watch companion app
- [ ] Public transit real-time data
- [ ] Traffic incident notifications
- [ ] Fuel cost calculations
- [ ] Carbon footprint tracking

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support or questions, please open an issue on the GitHub repository.

---

**CommuteTimely** - Never miss your commute window again! 🚗⏰

## Repository Information

This project is also available at: https://github.com/callmeumair/reactnative-ios-android
