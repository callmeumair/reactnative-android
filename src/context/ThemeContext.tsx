import React, {createContext, useContext, useEffect, useState, ReactNode} from 'react';
import {useColorScheme} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Theme {
  primary: string;
  primaryVariant: string;
  primaryContainer: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  error: string;
  onPrimary: string;
  onSecondary: string;
  onBackground: string;
  onSurface: string;
  onSurfaceVariant: string;
  onError: string;
  outline: string;
  shadow: string;
  elevation: {
    level0: string;
    level1: string;
    level2: string;
    level3: string;
    level4: string;
    level5: string;
  };
}

export const lightTheme: Theme = {
  primary: '#6750A4',
  primaryVariant: '#4F378B',
  primaryContainer: '#EADDFF',
  secondary: '#625B71',
  background: '#FFFBFE',
  surface: '#FFFBFE',
  surfaceVariant: '#E7E0EC',
  error: '#BA1A1A',
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onBackground: '#1C1B1F',
  onSurface: '#1C1B1F',
  onSurfaceVariant: '#49454F',
  onError: '#FFFFFF',
  outline: '#79747E',
  shadow: '#000000',
  elevation: {
    level0: 'transparent',
    level1: '#F7F2FA',
    level2: '#F2EDF4',
    level3: '#ECE6F0',
    level4: '#EAE7F0',
    level5: '#E6E0E9',
  },
};

export const darkTheme: Theme = {
  primary: '#D0BCFF',
  primaryVariant: '#9A82DB',
  primaryContainer: '#4F378B',
  secondary: '#CCC2DC',
  background: '#1C1B1F',
  surface: '#1C1B1F',
  surfaceVariant: '#49454F',
  error: '#F2B8B5',
  onPrimary: '#371E73',
  onSecondary: '#332D41',
  onBackground: '#E6E1E5',
  onSurface: '#E6E1E5',
  onSurfaceVariant: '#CAC4D0',
  onError: '#601410',
  outline: '#938F99',
  shadow: '#000000',
  elevation: {
    level0: 'transparent',
    level1: '#22212B',
    level2: '#28272F',
    level3: '#2E2D35',
    level4: '#302F37',
    level5: '#33323C',
  },
};

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@CommuteTimely:themeMode';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({children}: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  
  const isDark = themeMode === 'system' 
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';
    
  const theme = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    loadThemeMode();
  }, []);

  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.warn('Failed to load theme mode:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.warn('Failed to save theme mode:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{theme, isDark, themeMode, setThemeMode}}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
