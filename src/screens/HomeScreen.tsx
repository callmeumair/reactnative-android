import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useNotification, Destination } from '../context/NotificationContext';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { destinations, toggleDestination, deleteDestination } = useNotification();

  const handleDelete = (destination: Destination) => {
    Alert.alert(
      'Delete Destination',
      `Are you sure you want to delete ${destination.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDestination(destination.id),
        },
      ]
    );
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getDepartureTime = (destination: Destination) => {
    const arrivalTime = new Date(destination.arrivalTime);
    const departureTime = new Date(arrivalTime.getTime() - destination.travelTime * 60000);
    return formatTime(departureTime.toISOString());
  };

  const getTimeUntilDeparture = (destination: Destination) => {
    const arrivalTime = new Date(destination.arrivalTime);
    const departureTime = new Date(arrivalTime.getTime() - destination.travelTime * 60000);
    const now = new Date();
    const diffMs = departureTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 0) {
      return 'Overdue';
    } else if (diffMins < 60) {
      return `${diffMins}m`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const renderDestination = ({ item }: { item: Destination }) => (
    <View style={styles.destinationCard}>
      <View style={styles.destinationHeader}>
        <View style={styles.destinationInfo}>
          <Text style={styles.destinationName}>{item.name}</Text>
          <Text style={styles.destinationAddress}>{item.address}</Text>
        </View>
        <TouchableOpacity
          style={[styles.toggleButton, item.isActive && styles.toggleButtonActive]}
          onPress={() => toggleDestination(item.id)}
        >
          <Icon
            name={item.isActive ? 'notifications-active' : 'notifications-off'}
            size={24}
            color={item.isActive ? '#fff' : '#666'}
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.timeInfo}>
        <View style={styles.timeRow}>
          <Icon name="schedule" size={16} color="#666" />
          <Text style={styles.timeText}>
            Arrive: {formatTime(item.arrivalTime)}
          </Text>
        </View>
        <View style={styles.timeRow}>
          <Icon name="directions-car" size={16} color="#666" />
          <Text style={styles.timeText}>
            Leave: {getDepartureTime(item)}
          </Text>
        </View>
        <View style={styles.timeRow}>
          <Icon name="access-time" size={16} color="#666" />
          <Text style={styles.timeText}>
            Travel: {item.travelTime} min
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.countdown}>
          <Text style={styles.countdownLabel}>Time until departure:</Text>
          <Text style={[
            styles.countdownTime,
            getTimeUntilDeparture(item) === 'Overdue' && styles.overdue
          ]}>
            {getTimeUntilDeparture(item)}
          </Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('AddDestination', { destination: item })}
          >
            <Icon name="edit" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
          >
            <Icon name="delete" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="location-on" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Destinations Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Add your first destination to get started with commute reminders
      </Text>
      <TouchableOpacity
        style={styles.addFirstButton}
        onPress={() => navigation.navigate('AddDestination')}
      >
        <Text style={styles.addFirstButtonText}>Add Destination</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {destinations.length === 0 ? (
          <EmptyState />
        ) : (
          <FlatList
            data={destinations}
            renderItem={renderDestination}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </ScrollView>
      
      {destinations.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddDestination')}
        >
          <Icon name="add" size={30} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  destinationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  destinationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  destinationInfo: {
    flex: 1,
  },
  destinationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  destinationAddress: {
    fontSize: 14,
    color: '#666',
  },
  toggleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  timeInfo: {
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countdown: {
    flex: 1,
  },
  countdownLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  countdownTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  overdue: {
    color: '#FF3B30',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  addFirstButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default HomeScreen;
