import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {FadeInDown, FadeInUp} from 'react-native-reanimated';
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Card} from '../components/Card';
import {Button} from '../components/Button';
import {useTheme} from '../context/ThemeContext';
import {LatLng} from '../services/directions';
import {databaseService, Destination} from '../services/database';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

interface AddDestinationScreenProps {
  onClose: () => void;
  onDestinationAdded: (destination: Destination) => void;
  editingDestination?: Destination;
}

const destinationIcons = [
  {id: 'work', icon: 'work', label: 'Work', color: ['#667eea', '#764ba2']},
  {id: 'school', icon: 'school', label: 'School', color: ['#4facfe', '#00f2fe']},
  {id: 'home', icon: 'home', label: 'Home', color: ['#43e97b', '#38f9d7']},
  {id: 'gym', icon: 'fitness-center', label: 'Gym', color: ['#f093fb', '#f5576c']},
  {id: 'shopping', icon: 'shopping-cart', label: 'Shopping', color: ['#fa709a', '#fee140']},
  {id: 'restaurant', icon: 'restaurant', label: 'Restaurant', color: ['#a8edea', '#fed6e3']},
  {id: 'hospital', icon: 'local-hospital', label: 'Hospital', color: ['#ff9a9e', '#fecfef']},
  {id: 'other', icon: 'place', label: 'Other', color: ['#a1c4fd', '#c2e9fb']},
];

export function AddDestinationScreen({
  onClose,
  onDestinationAdded,
  editingDestination,
}: AddDestinationScreenProps) {
  const {theme} = useTheme();
  
  // Form state
  const [name, setName] = useState(editingDestination?.name || '');
  const [address, setAddress] = useState(editingDestination?.address || '');
  const [coordinates, setCoordinates] = useState<LatLng>({
    latitude: editingDestination?.latitude || 37.7749,
    longitude: editingDestination?.longitude || -122.4194,
  });
  const [selectedIcon, setSelectedIcon] = useState(
    editingDestination ? 
      destinationIcons.find(icon => icon.icon === editingDestination.icon) || destinationIcons[0] 
      : destinationIcons[0]
  );
  
  // Time picker state
  const [arrivalTime, setArrivalTime] = useState(() => {
    if (editingDestination?.arrivalTime) {
      const [hours, minutes] = editingDestination.arrivalTime.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    }
    // Default to 9:00 AM
    const date = new Date();
    date.setHours(9, 0, 0, 0);
    return date;
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);

  // Simplified coordinate input handlers
  const handleCoordinateChange = (field: 'latitude' | 'longitude', value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setCoordinates(prev => ({
        ...prev,
        [field]: numValue,
      }));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a destination name.');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Please enter an address.');
      return;
    }

    setLoading(true);
    try {
      const destinationData = {
        name: name.trim(),
        address: address.trim(),
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        arrivalTime: arrivalTime.toTimeString().slice(0, 5), // HH:MM format
        icon: selectedIcon.icon,
        color: JSON.stringify(selectedIcon.color),
        isActive: true,
      };

      let destinationId: string;
      if (editingDestination) {
        await databaseService.updateDestination(editingDestination.id, destinationData);
        destinationId = editingDestination.id;
      } else {
        destinationId = await databaseService.addDestination(destinationData);
      }

      // Create the full destination object
      const destination: Destination = {
        id: destinationId,
        ...destinationData,
        createdAt: editingDestination?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onDestinationAdded(destination);
      Alert.alert(
        'Success',
        `Destination ${editingDestination ? 'updated' : 'added'} successfully!`,
        [{text: 'OK', onPress: onClose}]
      );
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save destination. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Simplified address input section
  const renderAddressInput = () => (
    <Animated.View entering={FadeInUp.delay(150)} style={styles.section}>
      <Text style={[styles.sectionTitle, {color: theme.onBackground}]}>
        Address
      </Text>
      <Card style={styles.inputCard}>
        <TextInput
          style={[styles.textInput, {color: theme.onSurface}]}
          placeholder="Enter full address (e.g., 123 Main St, San Francisco, CA)"
          placeholderTextColor={theme.onSurfaceVariant}
          value={address}
          onChangeText={setAddress}
          multiline
          numberOfLines={2}
        />
      </Card>
    </Animated.View>
  );

  const renderCoordinateInput = () => (
    <Animated.View entering={FadeInUp.delay(175)} style={styles.section}>
      <Text style={[styles.sectionTitle, {color: theme.onBackground}]}>
        Coordinates (Optional)
      </Text>
      <View style={styles.coordinateRow}>
        <View style={styles.coordinateInput}>
          <Text style={[styles.coordinateLabel, {color: theme.onSurfaceVariant}]}>Latitude</Text>
          <Card style={styles.inputCard}>
            <TextInput
              style={[styles.textInput, {color: theme.onSurface}]}
              placeholder="37.7749"
              placeholderTextColor={theme.onSurfaceVariant}
              value={coordinates.latitude.toString()}
              onChangeText={(value) => handleCoordinateChange('latitude', value)}
              keyboardType="numeric"
            />
          </Card>
        </View>
        <View style={styles.coordinateInput}>
          <Text style={[styles.coordinateLabel, {color: theme.onSurfaceVariant}]}>Longitude</Text>
          <Card style={styles.inputCard}>
            <TextInput
              style={[styles.textInput, {color: theme.onSurface}]}
              placeholder="-122.4194"
              placeholderTextColor={theme.onSurfaceVariant}
              value={coordinates.longitude.toString()}
              onChangeText={(value) => handleCoordinateChange('longitude', value)}
              keyboardType="numeric"
            />
          </Card>
        </View>
      </View>
    </Animated.View>
  );

  const renderIconSelector = () => (
    <Animated.View entering={FadeInUp.delay(200)} style={styles.section}>
      <Text style={[styles.sectionTitle, {color: theme.onBackground}]}>
        Choose Icon
      </Text>
      <View style={styles.iconGrid}>
        {destinationIcons.map((iconData, index) => (
          <Animated.View key={iconData.id} entering={FadeInDown.delay(index * 50)}>
            <Card
              onPress={() => setSelectedIcon(iconData)}
              style={[
                styles.iconCard,
                {
                  borderColor: selectedIcon.id === iconData.id ? theme.primary : 'transparent',
                  borderWidth: selectedIcon.id === iconData.id ? 2 : 0,
                },
              ]}>
              <Icon
                name={iconData.icon}
                size={24}
                color={selectedIcon.id === iconData.id ? theme.primary : theme.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.iconLabel,
                  {
                    color: selectedIcon.id === iconData.id ? theme.primary : theme.onSurfaceVariant,
                  },
                ]}>
                {iconData.label}
              </Text>
            </Card>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Animated.View entering={FadeInUp} style={styles.header}>
          <Text style={[styles.headerTitle, {color: theme.onBackground}]}>
            {editingDestination ? 'Edit Destination' : 'Add Destination'}
          </Text>
          <Button
            title="Cancel"
            variant="text"
            onPress={onClose}
            size="small"
          />
        </Animated.View>

        {/* Destination Name */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.section}>
          <Text style={[styles.sectionTitle, {color: theme.onBackground}]}>
            Destination Name
          </Text>
          <Card style={styles.inputCard}>
            <TextInput
              style={[styles.textInput, {color: theme.onSurface}]}
              placeholder="Enter destination name (e.g., My Office)"
              placeholderTextColor={theme.onSurfaceVariant}
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
          </Card>
        </Animated.View>

        {/* Address Input */}
        {renderAddressInput()}

        {/* Coordinate Input */}
        {renderCoordinateInput()}

        {/* Icon Selection */}
        {renderIconSelector()}

        {/* Arrival Time */}
        <Animated.View entering={FadeInUp.delay(250)} style={styles.section}>
          <Text style={[styles.sectionTitle, {color: theme.onBackground}]}>
            Arrival Time
          </Text>
          <Card onPress={() => setShowTimePicker(true)} style={styles.timeCard}>
            <View style={styles.timeCardContent}>
              <Icon name="access-time" size={24} color={theme.primary} />
              <Text style={[styles.timeText, {color: theme.onSurface}]}>
                {arrivalTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
              </Text>
              <Icon name="arrow-drop-down" size={24} color={theme.onSurfaceVariant} />
            </View>
          </Card>
        </Animated.View>

        {/* Time Picker */}
        <DatePicker
          modal
          open={showTimePicker}
          date={arrivalTime}
          mode="time"
          onConfirm={(selectedTime) => {
            setArrivalTime(selectedTime);
            setShowTimePicker(false);
          }}
          onCancel={() => setShowTimePicker(false)}
          title="Select Arrival Time"
        />

        {/* Save Button */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.saveSection}>
          <Button
            title={editingDestination ? 'Update Destination' : 'Add Destination'}
            onPress={handleSave}
            loading={loading}
            disabled={!address.trim() || !name.trim()}
            size="large"
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    fontSize: 16,
    padding: 0,
  },
  coordinateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinateInput: {
    flex: 1,
  },
  coordinateLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconCard: {
    width: (SCREEN_WIDTH - 48 - 36) / 4, // 4 icons per row with margins and gaps
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  iconLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  timeCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  timeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  saveSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
});
