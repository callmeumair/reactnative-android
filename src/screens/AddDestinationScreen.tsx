import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useNotification, Destination } from '../context/NotificationContext';

const AddDestinationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { addDestination, updateDestination } = useNotification();
  
  const editingDestination = route.params?.destination as Destination | undefined;
  const isEditing = !!editingDestination;

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [arrivalTime, setArrivalTime] = useState(new Date());
  const [travelTime, setTravelTime] = useState('');
  const [notificationTime, setNotificationTime] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (editingDestination) {
      setName(editingDestination.name);
      setAddress(editingDestination.address);
      setArrivalTime(new Date(editingDestination.arrivalTime));
      setTravelTime(editingDestination.travelTime.toString());
      setNotificationTime(editingDestination.notificationTime.toString());
      setIsActive(editingDestination.isActive);
    }
  }, [editingDestination]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a destination name');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter an address');
      return;
    }
    if (!travelTime || parseInt(travelTime) <= 0) {
      Alert.alert('Error', 'Please enter a valid travel time');
      return;
    }
    if (!notificationTime || parseInt(notificationTime) <= 0) {
      Alert.alert('Error', 'Please enter a valid notification time');
      return;
    }

    const destinationData = {
      name: name.trim(),
      address: address.trim(),
      arrivalTime: arrivalTime.toISOString(),
      travelTime: parseInt(travelTime),
      notificationTime: parseInt(notificationTime),
      isActive,
    };

    if (isEditing) {
      updateDestination(editingDestination.id, destinationData);
      Alert.alert('Success', 'Destination updated successfully!');
    } else {
      addDestination(destinationData);
      Alert.alert('Success', 'Destination added successfully!');
    }
    
    navigation.goBack();
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setArrivalTime(selectedTime);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Destination Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Office, School, College"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter full address"
            placeholderTextColor="#999"
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Arrival Time *</Text>
          <TouchableOpacity
            style={styles.timePickerButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Icon name="schedule" size={20} color="#007AFF" />
            <Text style={styles.timePickerText}>
              {formatTime(arrivalTime)}
            </Text>
            <Icon name="keyboard-arrow-down" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Travel Time (minutes) *</Text>
          <TextInput
            style={styles.input}
            value={travelTime}
            onChangeText={setTravelTime}
            placeholder="e.g., 30"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notification Time (minutes before departure) *</Text>
          <TextInput
            style={styles.input}
            value={notificationTime}
            onChangeText={setNotificationTime}
            placeholder="e.g., 15"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
          <Text style={styles.helpText}>
            You'll be notified this many minutes before you need to leave
          </Text>
        </View>

        <View style={styles.switchGroup}>
          <Text style={styles.label}>Enable Notifications</Text>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isActive ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Departure Time:</Text>
            <Text style={styles.summaryValue}>
              {formatTime(new Date(arrivalTime.getTime() - (parseInt(travelTime) || 0) * 60000))}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Notification:</Text>
            <Text style={styles.summaryValue}>
              {parseInt(notificationTime) > 0 
                ? `${parseInt(notificationTime)} minutes before departure`
                : 'Not set'
              }
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Update Destination' : 'Add Destination'}
          </Text>
        </TouchableOpacity>
      </View>

      {showTimePicker && (
        <DateTimePicker
          value={arrivalTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'space-between',
  },
  timePickerText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginLeft: 12,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summary: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddDestinationScreen;
