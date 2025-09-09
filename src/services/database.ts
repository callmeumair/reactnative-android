import SQLite from 'react-native-sqlite-storage';
import uuid from 'react-native-uuid';
import {supabaseService} from './supabase';

// Enable debugging
SQLite.DEBUG(true);
SQLite.enablePromise(true);

export interface Destination {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  arrivalTime: string; // HH:MM format
  icon: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommuteCalculation {
  destinationId: string;
  date: string; // YYYY-MM-DD
  leaveTime: string; // HH:MM
  duration: number; // seconds
  weatherCondition: string;
  weatherDelay: number; // seconds
  calculatedAt: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private useCloud: boolean = true;

  async initializeDatabase(): Promise<void> {
    try {
      // Initialize SQLite for local storage and fallback
      this.db = await SQLite.openDatabase({
        name: 'CommuteTimely.db',
        location: 'default',
      });

      await this.createTables();
      
      // Test Supabase connection
      const cloudConnected = await supabaseService.checkConnection();
      this.useCloud = cloudConnected;
      
      console.log(`Database initialized - SQLite: ✅, Supabase: ${cloudConnected ? '✅' : '❌'}`);
      
      // Sync data if cloud is available
      if (this.useCloud) {
        await this.syncWithCloud();
      }
    } catch (error) {
      console.error('Database initialization failed:', error);
      this.useCloud = false; // Fallback to local only
      
      // Still initialize local database
      if (!this.db) {
        this.db = await SQLite.openDatabase({
          name: 'CommuteTimely.db',
          location: 'default',
        });
        await this.createTables();
      }
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Destinations table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS destinations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        arrivalTime TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Commute calculations table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS commute_calculations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        destinationId TEXT NOT NULL,
        date TEXT NOT NULL,
        leaveTime TEXT NOT NULL,
        duration INTEGER NOT NULL,
        weatherCondition TEXT NOT NULL,
        weatherDelay INTEGER NOT NULL,
        calculatedAt TEXT NOT NULL,
        FOREIGN KEY (destinationId) REFERENCES destinations (id),
        UNIQUE(destinationId, date)
      )
    `);

    console.log('Database tables created successfully');
  }

  // Destination CRUD operations
  async addDestination(destination: Omit<Destination, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = uuid.v4() as string;
    const now = new Date().toISOString();

    try {
      // Try cloud first
      if (this.useCloud) {
        await supabaseService.createDestination({
          id,
          name: destination.name,
          address: destination.address,
          latitude: destination.latitude,
          longitude: destination.longitude,
          arrival_time: destination.arrivalTime,
          icon: destination.icon,
          color: destination.color,
          is_active: destination.isActive,
        });
      }
    } catch (error) {
      console.warn('Failed to save to cloud, using local only:', error);
      this.useCloud = false;
    }

    // Always save locally as backup/cache
    await this.db.executeSql(
      `INSERT INTO destinations (id, name, address, latitude, longitude, arrivalTime, icon, color, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        destination.name,
        destination.address,
        destination.latitude,
        destination.longitude,
        destination.arrivalTime,
        destination.icon,
        destination.color,
        destination.isActive ? 1 : 0,
        now,
        now,
      ]
    );

    console.log('Destination added:', id, this.useCloud ? '(Cloud + Local)' : '(Local only)');
    return id;
  }

  async getDestinations(): Promise<Destination[]> {
    if (!this.db) throw new Error('Database not initialized');

    let cloudDestinations: Destination[] = [];

    // Try to get from cloud first
    if (this.useCloud) {
      try {
        const supabaseDestinations = await supabaseService.getDestinations();
        cloudDestinations = supabaseDestinations.map(d => supabaseService.convertFromSupabaseFormat(d));
        
        // Update local cache with cloud data
        await this.updateLocalCacheFromCloud(cloudDestinations);
        
        console.log(`Retrieved ${cloudDestinations.length} destinations from cloud`);
        return cloudDestinations;
      } catch (error) {
        console.warn('Failed to get destinations from cloud, using local:', error);
        this.useCloud = false;
      }
    }

    // Fallback to local database
    const results = await this.db.executeSql(
      'SELECT * FROM destinations WHERE isActive = 1 ORDER BY createdAt DESC'
    );

    const destinations: Destination[] = [];
    const rows = results[0].rows;

    for (let i = 0; i < rows.length; i++) {
      const row = rows.item(i);
      destinations.push({
        ...row,
        isActive: row.isActive === 1,
      });
    }

    console.log(`Retrieved ${destinations.length} destinations from local database`);
    return destinations;
  }

  async updateDestination(id: string, updates: Partial<Destination>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const updatedData = {...updates, updatedAt: now};

    try {
      // Try cloud first
      if (this.useCloud) {
        const supabaseUpdates: any = {};
        if (updates.name) supabaseUpdates.name = updates.name;
        if (updates.address) supabaseUpdates.address = updates.address;
        if (updates.latitude) supabaseUpdates.latitude = updates.latitude;
        if (updates.longitude) supabaseUpdates.longitude = updates.longitude;
        if (updates.arrivalTime) supabaseUpdates.arrival_time = updates.arrivalTime;
        if (updates.icon) supabaseUpdates.icon = updates.icon;
        if (updates.color) supabaseUpdates.color = updates.color;
        if (updates.isActive !== undefined) supabaseUpdates.is_active = updates.isActive;

        await supabaseService.updateDestination(id, supabaseUpdates);
      }
    } catch (error) {
      console.warn('Failed to update in cloud, using local only:', error);
      this.useCloud = false;
    }

    // Always update locally
    const setClause = Object.keys(updatedData)
      .filter(key => key !== 'id')
      .map(key => `${key} = ?`)
      .join(', ');

    const values = Object.entries(updatedData)
      .filter(([key]) => key !== 'id')
      .map(([key, value]) => {
        if (key === 'isActive') return value ? 1 : 0;
        return value;
      });

    values.push(id);

    await this.db.executeSql(
      `UPDATE destinations SET ${setClause} WHERE id = ?`,
      values
    );

    console.log('Destination updated:', id, this.useCloud ? '(Cloud + Local)' : '(Local only)');
  }

  async deleteDestination(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Soft delete by setting isActive to false
    await this.db.executeSql(
      'UPDATE destinations SET isActive = 0, updatedAt = ? WHERE id = ?',
      [new Date().toISOString(), id]
    );

    // Also delete related commute calculations
    await this.db.executeSql(
      'DELETE FROM commute_calculations WHERE destinationId = ?',
      [id]
    );

    console.log('Destination deleted:', id);
  }

  // Commute calculation operations
  async saveCommuteCalculation(calculation: Omit<CommuteCalculation, 'calculatedAt'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();

    await this.db.executeSql(
      `INSERT OR REPLACE INTO commute_calculations 
       (destinationId, date, leaveTime, duration, weatherCondition, weatherDelay, calculatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        calculation.destinationId,
        calculation.date,
        calculation.leaveTime,
        calculation.duration,
        calculation.weatherCondition,
        calculation.weatherDelay,
        now,
      ]
    );

    console.log('Commute calculation saved for:', calculation.destinationId);
  }

  async getCommuteCalculation(destinationId: string, date: string): Promise<CommuteCalculation | null> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.executeSql(
      'SELECT * FROM commute_calculations WHERE destinationId = ? AND date = ?',
      [destinationId, date]
    );

    if (results[0].rows.length === 0) return null;

    return results[0].rows.item(0);
  }

  async getLatestCommuteCalculations(): Promise<CommuteCalculation[]> {
    if (!this.db) throw new Error('Database not initialized');

    const today = new Date().toISOString().split('T')[0];

    const results = await this.db.executeSql(
      'SELECT * FROM commute_calculations WHERE date = ? ORDER BY calculatedAt DESC',
      [today]
    );

    const calculations: CommuteCalculation[] = [];
    const rows = results[0].rows;

    for (let i = 0; i < rows.length; i++) {
      calculations.push(rows.item(i));
    }

    return calculations;
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      console.log('Database closed');
    }
  }

  // Sync methods
  private async syncWithCloud(): Promise<void> {
    if (!this.useCloud || !this.db) return;

    try {
      console.log('Starting sync with cloud...');
      
      // Get local destinations
      const localResults = await this.db.executeSql(
        'SELECT * FROM destinations WHERE isActive = 1 ORDER BY createdAt DESC'
      );

      const localDestinations: Destination[] = [];
      const rows = localResults[0].rows;

      for (let i = 0; i < rows.length; i++) {
        const row = rows.item(i);
        localDestinations.push({
          ...row,
          isActive: row.isActive === 1,
        });
      }

      // Perform sync analysis
      const syncResult = await supabaseService.syncWithLocalDatabase(localDestinations);
      
      console.log(`Sync complete: ${syncResult.toCreate.length} created, ${syncResult.toUpdate.length} updated, ${syncResult.toDelete.length} deleted`);
    } catch (error) {
      console.error('Sync with cloud failed:', error);
      this.useCloud = false;
    }
  }

  private async updateLocalCacheFromCloud(cloudDestinations: Destination[]): Promise<void> {
    if (!this.db) return;

    try {
      // Clear local cache and rebuild from cloud
      await this.db.executeSql('DELETE FROM destinations');
      
      for (const destination of cloudDestinations) {
        await this.db.executeSql(
          `INSERT INTO destinations (id, name, address, latitude, longitude, arrivalTime, icon, color, isActive, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            destination.id,
            destination.name,
            destination.address,
            destination.latitude,
            destination.longitude,
            destination.arrivalTime,
            destination.icon,
            destination.color,
            destination.isActive ? 1 : 0,
            destination.createdAt,
            destination.updatedAt,
          ]
        );
      }
      
      console.log('Local cache updated from cloud');
    } catch (error) {
      console.error('Failed to update local cache:', error);
    }
  }

  // Public methods for manual sync
  async forceSyncWithCloud(): Promise<boolean> {
    if (!this.useCloud) {
      // Try to reconnect
      const cloudConnected = await supabaseService.checkConnection();
      this.useCloud = cloudConnected;
    }

    if (this.useCloud) {
      await this.syncWithCloud();
      return true;
    }
    
    return false;
  }

  isCloudEnabled(): boolean {
    return this.useCloud;
  }

  getConnectionStatus(): {local: boolean; cloud: boolean} {
    return {
      local: this.db !== null,
      cloud: this.useCloud,
    };
  }
}

export const databaseService = new DatabaseService();
