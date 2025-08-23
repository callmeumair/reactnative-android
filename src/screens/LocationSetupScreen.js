import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import { getThemeColors, TYPOGRAPHY, SPACING, BORDER_RADIUS, createThemedStyles } from '../utils/theme';
import {
  getCurrentLocation,
  requestLocationPermission,
  saveHomeLocation,
  saveWorkLocation,
  getHomeLocation,
  getWorkLocation,
} from '../services/locationService';
import { geocodeAddress, reverseGeocode } from '../services/mapboxService';

const LocationSetupScreen = ({ navigation, route }) => {
  const [homeAddress, setHomeAddress] = useState('');
  const [workAddress, setWorkAddress] = useState('');
  const [homeLocation, setHomeLocation] = useState(null);
  const [workLocation, setWorkLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null);

  const colors = getThemeColors();
  const styles = useThemedStyles();
  const isUpdate = route?.params?.isUpdate || false;

  useEffect(() => {
    loadExistingLocations();
  }, []);

  const loadExistingLocations = async () => {
    try {
      const [savedHome, savedWork] = await Promise.all([
        getHomeLocation(),
        getWorkLocation(),
      ]);

      if (savedHome) {
        setHomeLocation(savedHome);
        setHomeAddress(savedHome.address || '');
      }

      if (savedWork) {
        setWorkLocation(savedWork);
        setWorkAddress(savedWork.address || '');
      }
    } catch (error) {
      console.error('Load existing locations error:', error);
    }
  };

  const handleUseCurrentLocation = async (locationType) => {
    try {
      setLoadingLocation(locationType);
      
      // Request permissions
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Location permission is required to use current location.',
          [{ text: 'OK' }]
        );
        setLoadingLocation(null);
        return;
      }

      // Get current location
      const currentLocation = await getCurrentLocation();
      
      // Reverse geocode to get address
      const reverseGeoResult = await reverseGeocode([
        currentLocation.longitude,
        currentLocation.latitude,
      ]);

      const address = reverseGeoResult.features?.[0]?.place_name || 'Current Location';
      
      const locationData = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address,
        coords: currentLocation.coords,
      };

      if (locationType === 'home') {
        setHomeLocation(locationData);
        setHomeAddress(address);
      } else {
        setWorkLocation(locationData);
        setWorkAddress(address);
      }

      setLoadingLocation(null);
    } catch (error) {
      setLoadingLocation(null);
      Alert.alert(
        'Location Error',
        'Could not get current location. Please try again or enter address manually.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleAddressSearch = async (address, locationType) => {
    if (!address || address.length < 3) {
      setSearchSuggestions([]);
      return;
    }

    try {
      const geocodeResult = await geocodeAddress(address);
      const suggestions = geocodeResult.features?.slice(0, 5) || [];
      setSearchSuggestions(suggestions);
      setActiveField(locationType);
    } catch (error) {
      console.error('Address search error:', error);
      setSearchSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion, locationType) => {
    const [longitude, latitude] = suggestion.center;
    const locationData = {
      latitude,
      longitude,
      address: suggestion.place_name,
      coords: [longitude, latitude],
    };

    if (locationType === 'home') {
      setHomeLocation(locationData);
      setHomeAddress(suggestion.place_name);
    } else {
      setWorkLocation(locationData);
      setWorkAddress(suggestion.place_name);
    }

    setSearchSuggestions([]);
    setActiveField(null);
  };

  const handleSaveLocations = async () => {
    if (!homeLocation || !workLocation) {
      Alert.alert(
        'Missing Locations',
        'Please set both home and work locations before continuing.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsLoading(true);

      await Promise.all([
        saveHomeLocation(homeLocation),
        saveWorkLocation(workLocation),
      ]);

      Alert.alert(
        'Success',
        'Locations saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              if (isUpdate) {
                navigation.goBack();
              } else {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                });
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Save locations error:', error);
      Alert.alert(
        'Error',
        'Failed to save locations. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderLocationInput = (
    title,
    value,
    onChangeText,
    placeholder,
    locationType,
    location
  ) => (
    <View style={styles.inputContainer}>
      <View style={styles.inputHeader}>
        <Text style={styles.inputLabel}>{title}</Text>
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={() => handleUseCurrentLocation(locationType)}
          disabled={loadingLocation === locationType}
        >
          {loadingLocation === locationType ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Icon name="location" size={16} color={colors.primary} />
              <Text style={styles.currentLocationText}>Use Current</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.inputWrapper, location && styles.inputWrapperSuccess]}>
        <Icon
          name={location ? 'checkmark-circle' : 'location-outline'}
          size={20}
          color={location ? colors.success : colors.textSecondary}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            handleAddressSearch(text, locationType);
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          onFocus={() => setActiveField(locationType)}
          onBlur={() => {
            setTimeout(() => {
              if (activeField === locationType) {
                setActiveField(null);
                setSearchSuggestions([]);
              }
            }, 200);
          }}
        />
      </View>

      {/* Search Suggestions */}
      {activeField === locationType && searchSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {searchSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionItem}
              onPress={() => selectSuggestion(suggestion, locationType)}
            >
              <Icon name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.suggestionText} numberOfLines={2}>
                {suggestion.place_name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {isUpdate ? 'Update Locations' : 'Set Up Your Locations'}
            </Text>
            <Text style={styles.subtitle}>
              Add your home and work addresses for accurate commute calculations.
            </Text>
          </View>

          {/* Location Inputs */}
          {renderLocationInput(
            '🏠 Home Address',
            homeAddress,
            setHomeAddress,
            'Enter your home address',
            'home',
            homeLocation
          )}

          {renderLocationInput(
            '🏢 Work Address',
            workAddress,
            setWorkAddress,
            'Enter your work address',
            'work',
            workLocation
          )}

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Icon name="information-circle" size={24} color={colors.info} />
            <Text style={styles.infoText}>
              We use these locations to calculate your optimal commute time based on live traffic and weather conditions.
            </Text>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!homeLocation || !workLocation) && styles.saveButtonDisabled,
            ]}
            onPress={handleSaveLocations}
            disabled={isLoading || !homeLocation || !workLocation}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isUpdate ? 'Update Locations' : 'Save & Continue'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const useThemedStyles = createThemedStyles((colors, typography, spacing, borderRadius) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.lg,
    },
    header: {
      marginBottom: spacing.xl,
    },
    title: {
      fontSize: typography.fontSize.xxl,
      fontWeight: typography.fontWeight.bold,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: typography.fontSize.md,
      color: colors.textSecondary,
      lineHeight: typography.lineHeight.md,
    },
    inputContainer: {
      marginBottom: spacing.lg,
    },
    inputHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    inputLabel: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.medium,
      color: colors.text,
    },
    currentLocationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
    },
    currentLocationText: {
      fontSize: typography.fontSize.sm,
      color: colors.primary,
      marginLeft: spacing.xs,
      fontWeight: typography.fontWeight.medium,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
    },
    inputWrapperSuccess: {
      borderColor: colors.success,
      backgroundColor: `${colors.success}10`,
    },
    inputIcon: {
      marginRight: spacing.sm,
    },
    textInput: {
      flex: 1,
      fontSize: typography.fontSize.md,
      color: colors.text,
      paddingVertical: spacing.md,
    },
    suggestionsContainer: {
      marginTop: spacing.xs,
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadow,
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    },
    suggestionText: {
      flex: 1,
      fontSize: typography.fontSize.sm,
      color: colors.text,
      marginLeft: spacing.sm,
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: spacing.lg,
    },
    infoText: {
      flex: 1,
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      marginLeft: spacing.sm,
      lineHeight: typography.lineHeight.sm,
    },
    footer: {
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      ...colors.shadow,
    },
    saveButtonDisabled: {
      backgroundColor: colors.textTertiary,
    },
    saveButtonText: {
      fontSize: typography.fontSize.md,
      color: '#FFFFFF',
      fontWeight: typography.fontWeight.semiBold,
    },
  })
);

export default LocationSetupScreen;