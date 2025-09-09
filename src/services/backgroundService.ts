import {AppState, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {databaseService} from './database';
import {CommuteCalculator} from './commute';
import {commuteAlarmManager} from './alarmManager';

const LAST_CALCULATION_KEY = '@CommuteTimely:lastCalculation';
const BACKGROUND_TASK_KEY = '@CommuteTimely:backgroundTask';

export class BackgroundCommuteService {
  private isRunning = false;
  private calculationInterval: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;

  async initialize(): Promise<void> {
    console.log('Initializing background commute service...');
    
    // Set up app state listener
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    
    // Check if we need to run calculation
    await this.checkAndRunDailyCalculation();
    
    // Set up periodic calculation (every 6 hours)
    this.setupPeriodicCalculation();
  }

  private handleAppStateChange = async (nextAppState: string) => {
    if (nextAppState === 'active') {
      console.log('App became active, checking for calculation updates...');
      await this.checkAndRunDailyCalculation();
    }
  };

  private setupPeriodicCalculation(): void {
    // Clear existing interval
    if (this.calculationInterval) {
      clearInterval(this.calculationInterval);
    }

    // Set up calculation every 6 hours
    this.calculationInterval = setInterval(async () => {
      await this.checkAndRunDailyCalculation();
    }, 6 * 60 * 60 * 1000); // 6 hours
  }

  async checkAndRunDailyCalculation(): Promise<void> {
    try {
      const lastCalculation = await AsyncStorage.getItem(LAST_CALCULATION_KEY);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Check if we already calculated today
      if (lastCalculation === today) {
        console.log('Commute already calculated today');
        return;
      }

      console.log('Running daily commute calculation...');
      await this.runDailyCalculation();
      
      // Save calculation date
      await AsyncStorage.setItem(LAST_CALCULATION_KEY, today);
    } catch (error) {
      console.error('Failed to check/run daily calculation:', error);
    }
  }

  private async runDailyCalculation(): Promise<void> {
    if (this.isRunning) {
      console.log('Calculation already running, skipping...');
      return;
    }

    this.isRunning = true;
    try {
      console.log('Starting background commute calculation...');
      
      // Get all active destinations
      const destinations = await databaseService.getDestinations();
      if (destinations.length === 0) {
        console.log('No destinations found, skipping calculation');
        return;
      }

      // Get user's current location (fallback to SF for demo)
      const origin = {latitude: 37.7749, longitude: -122.4194};
      
      // Initialize calculator
      const calculator = new CommuteCalculator(origin);
      
      // Calculate commutes for all destinations
      const results = new Map();
      for (const destination of destinations) {
        try {
          console.log(`Calculating commute for ${destination.name}...`);
          const result = await calculator.calculateCommute(destination);
          results.set(destination.id, result);
          
          // Schedule notification
          await commuteAlarmManager.scheduleCommuteAlarm(destination, result);
          console.log(`✅ Scheduled alarm for ${destination.name} at ${result.leaveTime}`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to calculate commute for ${destination.name}:`, error);
        }
      }

      console.log(`✅ Background calculation completed for ${results.size} destinations`);
      
      // Store completion status
      await AsyncStorage.setItem(BACKGROUND_TASK_KEY, JSON.stringify({
        lastRun: new Date().toISOString(),
        destinationsProcessed: results.size,
        status: 'completed'
      }));

    } catch (error) {
      console.error('Background calculation failed:', error);
      
      // Store error status
      await AsyncStorage.setItem(BACKGROUND_TASK_KEY, JSON.stringify({
        lastRun: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'failed'
      }));
    } finally {
      this.isRunning = false;
    }
  }

  async forceRecalculation(): Promise<void> {
    console.log('Forcing immediate recalculation...');
    await AsyncStorage.removeItem(LAST_CALCULATION_KEY);
    await this.runDailyCalculation();
  }

  async getLastCalculationInfo(): Promise<{
    lastCalculation: string | null;
    lastTaskInfo: any;
  }> {
    const lastCalculation = await AsyncStorage.getItem(LAST_CALCULATION_KEY);
    const lastTaskInfo = await AsyncStorage.getItem(BACKGROUND_TASK_KEY);
    
    return {
      lastCalculation,
      lastTaskInfo: lastTaskInfo ? JSON.parse(lastTaskInfo) : null,
    };
  }

  async scheduleNextDayCalculation(): Promise<void> {
    // Calculate when to run tomorrow (6 AM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0);
    
    const timeUntilTomorrow = tomorrow.getTime() - Date.now();
    
    setTimeout(async () => {
      await this.runDailyCalculation();
      // Schedule the next day
      this.scheduleNextDayCalculation();
    }, timeUntilTomorrow);
    
    console.log(`Scheduled next calculation for ${tomorrow.toLocaleString()}`);
  }

  async cleanup(): Promise<void> {
    console.log('Cleaning up background service...');
    
    if (this.calculationInterval) {
      clearInterval(this.calculationInterval);
      this.calculationInterval = null;
    }
    
    if (this.appStateSubscription) {
      this.appStateSubscription?.remove();
      this.appStateSubscription = null;
    }
    
    this.isRunning = false;
  }

  // For testing purposes
  async testBackgroundCalculation(): Promise<void> {
    console.log('Testing background calculation...');
    await this.runDailyCalculation();
  }
}

export const backgroundCommuteService = new BackgroundCommuteService();

// Initialize the service when the module is imported
if (Platform.OS === 'android') {
  backgroundCommuteService.initialize().catch(error => {
    console.error('Failed to initialize background service:', error);
  });
}
