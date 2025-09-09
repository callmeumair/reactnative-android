import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';
import {Card} from '../components/Card';
import {Button} from '../components/Button';
import {FAB} from '../components/FAB';
import {useTheme} from '../context/ThemeContext';
import {ensureLocationPermission, canScheduleExactAlarms, requestExactAlarmPermission} from '../services/permissions';
import {LatLng} from '../services/directions';
import {databaseService, Destination} from '../services/database';
import {CommuteCalculator, CommuteResult, formatDuration, getWeatherIcon} from '../services/commute';
import {commuteAlarmManager} from '../services/alarmManager';
import {AddDestinationScreen} from './AddDestinationScreen';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

export function HomeScreen() {
  const {theme, isDark} = useTheme();
  const [origin] = useState<LatLng>({latitude: 37.7749, longitude: -122.4194});
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [commuteResults, setCommuteResults] = useState<Map<string, CommuteResult>>(new Map());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAddDestination, setShowAddDestination] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | undefined>();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await databaseService.initializeDatabase();
      await loadDestinations();
      await checkPermissions();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      Alert.alert('Error', 'Failed to initialize the app. Please restart.');
    }
  };

  const loadDestinations = async () => {
    try {
      const loadedDestinations = await databaseService.getDestinations();
      setDestinations(loadedDestinations);
      
      if (loadedDestinations.length > 0) {
        await calculateCommutesForAll(loadedDestinations);
      }
    } catch (error) {
      console.error('Failed to load destinations:', error);
    }
  };

  const calculateCommutesForAll = async (destinationList: Destination[]) => {
    setLoading(true);
    try {
      const calculator = new CommuteCalculator(origin);
      const results = new Map<string, CommuteResult>();
      
      for (const destination of destinationList) {
        try {
          const result = await calculator.calculateCommute(destination);
          results.set(destination.id, result);
          
          // Schedule alarm for this destination
          await commuteAlarmManager.scheduleCommuteAlarm(destination, result);
        } catch (error) {
          console.error(`Failed to calculate commute for ${destination.name}:`, error);
        }
      }
      
      setCommuteResults(results);
    } catch (error) {
      console.error('Failed to calculate commutes:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    const exactAlarmsOk = await canScheduleExactAlarms();
    if (!exactAlarmsOk) {
      Alert.alert(
        'Exact Alarms Permission',
        'For the most accurate notifications, please enable "Exact Alarms" in settings.',
        [
          {text: 'Later', style: 'cancel'},
          {text: 'Open Settings', onPress: requestExactAlarmPermission},
        ]
      );
    }
  };

  const handleAddDestination = () => {
    setEditingDestination(undefined);
    setShowAddDestination(true);
  };

  const handleEditDestination = (destination: Destination) => {
    setEditingDestination(destination);
    setShowAddDestination(true);
  };

  const handleDeleteDestination = (destination: Destination) => {
    Alert.alert(
      'Delete Destination',
      `Are you sure you want to delete "${destination.name}"?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteDestination(destination.id);
              await commuteAlarmManager.cancelAllDestinationAlarms(destination.id);
              await loadDestinations();
              Alert.alert('Success', 'Destination deleted successfully.');
            } catch (error) {
              console.error('Failed to delete destination:', error);
              Alert.alert('Error', 'Failed to delete destination.');
            }
          },
        },
      ]
    );
  };

  const handleDestinationAdded = async (destination: Destination) => {
    setShowAddDestination(false);
    await loadDestinations();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDestinations();
    setRefreshing(false);
  }, []);

  const renderDestinationCard = (destination: Destination, index: number) => {
    const commuteResult = commuteResults.get(destination.id);
    const colors = JSON.parse(destination.color || '["#667eea", "#764ba2"]');
    
    return (
      <Animated.View
        key={destination.id}
        entering={FadeInDown.delay(index * 100)}>
        <Card
          elevated
          onPress={() => handleEditDestination(destination)}
          style={styles.destinationCard}>
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={colors}
              style={styles.iconContainer}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}>
              <Icon name={destination.icon} size={24} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.cardContent}>
              <Text style={[styles.destinationName, {color: theme.onSurface}]}>
                {destination.name}
              </Text>
              <Text style={[styles.destinationSubtitle, {color: theme.onSurfaceVariant}]}>
                Arrive by {destination.arrivalTime}
              </Text>
              {commuteResult && (
                <View style={styles.commuteInfo}>
                  <Text style={[styles.leaveTime, {color: theme.primary}]}>
                    Leave by: {commuteResult.leaveTime}
                  </Text>
                  <Text style={[styles.commuteDetails, {color: theme.onSurfaceVariant}]}>
                    {formatDuration(commuteResult.duration)} • {getWeatherIcon(commuteResult.weatherCondition)} {commuteResult.weatherCondition}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.cardActions}>
              <Icon 
                name="more-vert" 
                size={20} 
                color={theme.onSurfaceVariant}
                onPress={() => showDestinationOptions(destination)}
              />
            </View>
          </View>
        </Card>
      </Animated.View>
    );
  };

  const showDestinationOptions = (destination: Destination) => {
    Alert.alert(
      destination.name,
      'What would you like to do?',
      [
        {text: 'Edit', onPress: () => handleEditDestination(destination)},
        {text: 'Delete', style: 'destructive', onPress: () => handleDeleteDestination(destination)},
        {text: 'Cancel', style: 'cancel'},
      ]
    );
  };

  const renderEmptyState = () => (
    <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyState}>
      <View style={styles.emptyStateContent}>
        <Icon name="add-location-alt" size={64} color={theme.onSurfaceVariant} />
        <Text style={[styles.emptyStateTitle, {color: theme.onSurface}]}>
          No destinations yet
        </Text>
        <Text style={[styles.emptyStateSubtitle, {color: theme.onSurfaceVariant}]}>
          Add your first destination to start planning smart commutes
        </Text>
        <Button
          title="Add Destination"
          onPress={handleAddDestination}
          style={styles.emptyStateButton}
        />
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        
        {/* Header */}
        <Animated.View entering={FadeInUp} style={styles.header}>
          <LinearGradient
            colors={isDark ? ['#1a1a2e', '#16213e'] : ['#667eea', '#764ba2']}
            style={styles.headerGradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}>
            <View style={styles.headerContent}>
              <View>
                <Text style={[styles.greeting, {color: theme.onPrimary}]}>
                  Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}! 👋
                </Text>
                <Text style={[styles.headerSubtitle, {color: theme.onPrimary}]}>
                  Smart commute planning with real-time traffic
                </Text>
              </View>
              <Icon name="navigation" size={32} color={theme.onPrimary} />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Destinations */}
        {destinations.length > 0 ? (
          <Animated.View entering={FadeInUp.delay(300)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, {color: theme.onBackground}]}>
                Your Destinations ({destinations.length})
              </Text>
              {loading && (
                <Icon name="refresh" size={20} color={theme.primary} />
              )}
            </View>
            {destinations.map(renderDestinationCard)}
          </Animated.View>
        ) : (
          renderEmptyState()
        )}

        {/* Quick Actions */}
        {destinations.length > 0 && (
          <Animated.View entering={FadeInUp.delay(400)} style={styles.section}>
            <Text style={[styles.sectionTitle, {color: theme.onBackground}]}>
              Quick Actions
            </Text>
            <Card elevated style={styles.quickActionsCard}>
              <Button
                title="Recalculate All Commutes"
                variant="outlined"
                icon={<Icon name="refresh" size={20} color={theme.primary} />}
                onPress={() => calculateCommutesForAll(destinations)}
                loading={loading}
                style={styles.quickActionButton}
              />
              <Button
                title="Test Notification"
                variant="text"
                icon={<Icon name="notifications" size={20} color={theme.primary} />}
                onPress={() => commuteAlarmManager.testAlarm()}
                style={styles.quickActionButton}
              />
            </Card>
          </Animated.View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <FAB
          onPress={handleAddDestination}
          icon="add"
          extended={destinations.length === 0}
          label={destinations.length === 0 ? "Add Destination" : undefined}
        />
      </View>

      {/* Add Destination Modal */}
      <Modal
        visible={showAddDestination}
        animationType="slide"
        presentationStyle="pageSheet">
        <AddDestinationScreen
          onClose={() => setShowAddDestination(false)}
          onDestinationAdded={handleDestinationAdded}
          editingDestination={editingDestination}
        />
      </Modal>
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
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  headerGradient: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.9,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  destinationCard: {
    marginVertical: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  destinationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  destinationSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  commuteInfo: {
    marginTop: 4,
  },
  leaveTime: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  commuteDetails: {
    fontSize: 13,
  },
  cardActions: {
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateContent: {
    alignItems: 'center',
    maxWidth: 280,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyStateButton: {
    paddingHorizontal: 32,
  },
  commuteTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  commuteTime: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  commuteEta: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
  },
  quickActionsCard: {
    gap: 12,
  },
  quickActionButton: {
    justifyContent: 'flex-start',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
});
