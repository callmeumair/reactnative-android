import {createClient, SupabaseClient} from '@supabase/supabase-js';
import {SUPABASE_URL, SUPABASE_ANON_KEY} from '../config/keys';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Database types
export interface SupabaseDestination {
  id: string;
  user_id?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  arrival_time: string; // HH:MM format
  icon: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseCommuteCalculation {
  id?: number;
  destination_id: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  leave_time: string; // HH:MM
  duration: number; // seconds
  weather_condition: string;
  weather_delay: number; // seconds
  calculated_at: string;
}

class SupabaseService {
  private client: SupabaseClient;
  private userId: string | null = null;

  constructor() {
    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });

    this.initializeUser();
  }

  private async initializeUser(): Promise<void> {
    try {
      // Get or create anonymous user ID
      let userId = await AsyncStorage.getItem('@CommuteTimely:userId');
      if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('@CommuteTimely:userId', userId);
      }
      this.userId = userId;
      console.log('Supabase user initialized:', this.userId);
    } catch (error) {
      console.error('Failed to initialize user:', error);
      this.userId = `temp_${Date.now()}`;
    }
  }

  // Destination operations
  async createDestination(destination: Omit<SupabaseDestination, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const now = new Date().toISOString();
      const destinationData: Partial<SupabaseDestination> = {
        ...destination,
        user_id: this.userId || undefined,
        created_at: now,
        updated_at: now,
      };

      // Set the user context for RLS
      await this.setUserContext();

      const {data, error} = await this.client
        .from('destinations')
        .insert(destinationData)
        .select('id')
        .single();

      if (error) throw error;
      
      console.log('Destination created in Supabase:', data.id);
      return data.id;
    } catch (error) {
      console.error('Failed to create destination in Supabase:', error);
      throw error;
    }
  }

  async getDestinations(): Promise<SupabaseDestination[]> {
    try {
      await this.setUserContext();
      
      const {data, error} = await this.client
        .from('destinations')
        .select('*')
        .eq('user_id', this.userId)
        .eq('is_active', true)
        .order('created_at', {ascending: false});

      if (error) throw error;
      
      console.log(`Retrieved ${data?.length || 0} destinations from Supabase`);
      return data || [];
    } catch (error) {
      console.error('Failed to get destinations from Supabase:', error);
      throw error;
    }
  }

  private async setUserContext(): Promise<void> {
    if (this.userId) {
      try {
        // Set the user context for RLS policies
        const {error} = await this.client.rpc('set_config', {
          setting_name: 'app.current_user_id',
          setting_value: this.userId,
          is_local: true,
        });
        
        if (error) {
          console.warn('Failed to set user context, continuing without RLS:', error);
        }
      } catch (error) {
        console.warn('RLS user context not available, using direct user_id filtering');
      }
    }
  }

  async updateDestination(id: string, updates: Partial<SupabaseDestination>): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const {error} = await this.client
        .from('destinations')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', this.userId);

      if (error) throw error;
      
      console.log('Destination updated in Supabase:', id);
    } catch (error) {
      console.error('Failed to update destination in Supabase:', error);
      throw error;
    }
  }

  async deleteDestination(id: string): Promise<void> {
    try {
      // Soft delete by setting is_active to false
      const {error} = await this.client
        .from('destinations')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', this.userId);

      if (error) throw error;

      // Also delete related commute calculations
      await this.client
        .from('commute_calculations')
        .delete()
        .eq('destination_id', id)
        .eq('user_id', this.userId);

      console.log('Destination deleted in Supabase:', id);
    } catch (error) {
      console.error('Failed to delete destination in Supabase:', error);
      throw error;
    }
  }

  // Commute calculation operations
  async saveCommuteCalculation(calculation: Omit<SupabaseCommuteCalculation, 'id' | 'user_id' | 'calculated_at'>): Promise<void> {
    try {
      const calculationData: Partial<SupabaseCommuteCalculation> = {
        ...calculation,
        user_id: this.userId || undefined,
        calculated_at: new Date().toISOString(),
      };

      const {error} = await this.client
        .from('commute_calculations')
        .upsert(calculationData, {
          onConflict: 'destination_id,date,user_id',
        });

      if (error) throw error;
      
      console.log('Commute calculation saved to Supabase');
    } catch (error) {
      console.error('Failed to save commute calculation to Supabase:', error);
      throw error;
    }
  }

  async getCommuteCalculation(destinationId: string, date: string): Promise<SupabaseCommuteCalculation | null> {
    try {
      const {data, error} = await this.client
        .from('commute_calculations')
        .select('*')
        .eq('destination_id', destinationId)
        .eq('date', date)
        .eq('user_id', this.userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
      
      return data || null;
    } catch (error) {
      console.error('Failed to get commute calculation from Supabase:', error);
      return null;
    }
  }

  async getLatestCommuteCalculations(): Promise<SupabaseCommuteCalculation[]> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const {data, error} = await this.client
        .from('commute_calculations')
        .select('*')
        .eq('date', today)
        .eq('user_id', this.userId)
        .order('calculated_at', {ascending: false});

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Failed to get latest commute calculations from Supabase:', error);
      return [];
    }
  }

  // Sync operations
  async syncWithLocalDatabase(localDestinations: any[]): Promise<{
    toCreate: SupabaseDestination[];
    toUpdate: SupabaseDestination[];
    toDelete: string[];
  }> {
    try {
      const cloudDestinations = await this.getDestinations();
      
      // Create maps for easier comparison
      const cloudMap = new Map(cloudDestinations.map(d => [d.id, d]));
      const localMap = new Map(localDestinations.map(d => [d.id, d]));

      const toCreate: SupabaseDestination[] = [];
      const toUpdate: SupabaseDestination[] = [];
      const toDelete: string[] = [];

      // Find destinations to create (exist locally but not in cloud)
      for (const local of localDestinations) {
        if (!cloudMap.has(local.id)) {
          toCreate.push(this.convertToSupabaseFormat(local));
        }
      }

      // Find destinations to update (exist in both but cloud is newer)
      for (const cloud of cloudDestinations) {
        const local = localMap.get(cloud.id);
        if (local) {
          const cloudUpdated = new Date(cloud.updated_at);
          const localUpdated = new Date(local.updatedAt);
          if (cloudUpdated > localUpdated) {
            toUpdate.push(cloud);
          }
        }
      }

      // Find destinations to delete (exist locally but marked inactive in cloud)
      for (const cloud of cloudDestinations) {
        if (!cloud.is_active && localMap.has(cloud.id)) {
          toDelete.push(cloud.id);
        }
      }

      console.log(`Sync analysis: ${toCreate.length} to create, ${toUpdate.length} to update, ${toDelete.length} to delete`);
      
      return {toCreate, toUpdate, toDelete};
    } catch (error) {
      console.error('Failed to sync with local database:', error);
      throw error;
    }
  }

  private convertToSupabaseFormat(localDestination: any): SupabaseDestination {
    return {
      id: localDestination.id,
      name: localDestination.name,
      address: localDestination.address,
      latitude: localDestination.latitude,
      longitude: localDestination.longitude,
      arrival_time: localDestination.arrivalTime,
      icon: localDestination.icon,
      color: localDestination.color,
      is_active: localDestination.isActive,
      created_at: localDestination.createdAt,
      updated_at: localDestination.updatedAt,
    };
  }

  convertFromSupabaseFormat(supabaseDestination: SupabaseDestination): any {
    return {
      id: supabaseDestination.id,
      name: supabaseDestination.name,
      address: supabaseDestination.address,
      latitude: supabaseDestination.latitude,
      longitude: supabaseDestination.longitude,
      arrivalTime: supabaseDestination.arrival_time,
      icon: supabaseDestination.icon,
      color: supabaseDestination.color,
      isActive: supabaseDestination.is_active,
      createdAt: supabaseDestination.created_at,
      updatedAt: supabaseDestination.updated_at,
    };
  }

  // Health check
  async checkConnection(): Promise<boolean> {
    try {
      const {data, error} = await this.client
        .from('destinations')
        .select('count')
        .eq('user_id', this.userId)
        .limit(1);

      return !error;
    } catch (error) {
      console.error('Supabase connection check failed:', error);
      return false;
    }
  }

  // Get user ID for debugging
  getUserId(): string | null {
    return this.userId;
  }
}

export const supabaseService = new SupabaseService();
