import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme storage key
const THEME_STORAGE_KEY = 'app_theme';

// Color schemes
export const COLORS = {
  light: {
    // Primary colors
    primary: '#007AFF',
    primaryDark: '#0056CC',
    secondary: '#FF6B35',
    accent: '#34C759',
    
    // Background colors
    background: '#FFFFFF',
    surface: '#F8F9FA',
    card: '#FFFFFF',
    
    // Text colors
    text: '#1C1C1E',
    textSecondary: '#8E8E93',
    textTertiary: '#C7C7CC',
    
    // Status colors
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#007AFF',
    
    // Weather impact colors
    weatherNone: '#34C759',
    weatherLow: '#FF9500',
    weatherMedium: '#FF6B35',
    weatherHigh: '#FF3B30',
    
    // Border and separator colors
    border: '#E5E5EA',
    separator: '#F2F2F7',
    
    // Map colors
    routeColor: '#007AFF',
    routeColorAlt: '#FF6B35',
    
    // Shadow
    shadow: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  },
  
  dark: {
    // Primary colors
    primary: '#0A84FF',
    primaryDark: '#0056CC',
    secondary: '#FF7043',
    accent: '#32D74B',
    
    // Background colors
    background: '#000000',
    surface: '#1C1C1E',
    card: '#2C2C2E',
    
    // Text colors
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#48484A',
    
    // Status colors
    success: '#32D74B',
    warning: '#FF9F0A',
    error: '#FF453A',
    info: '#0A84FF',
    
    // Weather impact colors
    weatherNone: '#32D74B',
    weatherLow: '#FF9F0A',
    weatherMedium: '#FF7043',
    weatherHigh: '#FF453A',
    
    // Border and separator colors
    border: '#38383A',
    separator: '#2C2C2E',
    
    // Map colors
    routeColor: '#0A84FF',
    routeColorAlt: '#FF7043',
    
    // Shadow
    shadow: {
      shadowColor: '#FFFFFF',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
  },
};

// Typography
export const TYPOGRAPHY = {
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  // Font weights
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
  
  // Line heights
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    xxxl: 44,
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

// Animation durations
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
};

// Current theme state
let currentTheme = 'light';
let themeListeners = [];

/**
 * Initialize theme system
 */
export const initializeTheme = async () => {
  try {
    // Get saved theme preference
    const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    
    if (savedTheme) {
      currentTheme = savedTheme;
    } else {
      // Use system theme
      currentTheme = Appearance.getColorScheme() || 'light';
    }
    
    // Listen for system theme changes
    Appearance.addChangeListener(({ colorScheme }) => {
      const savedTheme = AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (!savedTheme) {
        setTheme(colorScheme || 'light');
      }
    });
    
    notifyThemeListeners();
  } catch (error) {
    console.error('Initialize theme error:', error);
    currentTheme = 'light';
  }
};

/**
 * Get current theme
 * @returns {string} Current theme ('light' or 'dark')
 */
export const getCurrentTheme = () => currentTheme;

/**
 * Get current theme colors
 * @returns {Object} Color scheme object
 */
export const getThemeColors = () => COLORS[currentTheme];

/**
 * Set theme
 * @param {string} theme - Theme to set ('light', 'dark', or 'system')
 */
export const setTheme = async (theme) => {
  try {
    if (theme === 'system') {
      await AsyncStorage.removeItem(THEME_STORAGE_KEY);
      currentTheme = Appearance.getColorScheme() || 'light';
    } else {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
      currentTheme = theme;
    }
    
    notifyThemeListeners();
  } catch (error) {
    console.error('Set theme error:', error);
  }
};

/**
 * Toggle between light and dark themes
 */
export const toggleTheme = async () => {
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  await setTheme(newTheme);
};

/**
 * Add theme change listener
 * @param {Function} listener - Callback function
 */
export const addThemeListener = (listener) => {
  themeListeners.push(listener);
};

/**
 * Remove theme change listener
 * @param {Function} listener - Callback function to remove
 */
export const removeThemeListener = (listener) => {
  themeListeners = themeListeners.filter(l => l !== listener);
};

/**
 * Notify all theme listeners of theme change
 */
const notifyThemeListeners = () => {
  themeListeners.forEach(listener => listener(currentTheme));
};

/**
 * Create themed styles helper
 * @param {Function} styleCreator - Function that takes colors and returns styles
 * @returns {Function} Function that returns themed styles
 */
export const createThemedStyles = (styleCreator) => {
  return () => styleCreator(getThemeColors(), TYPOGRAPHY, SPACING, BORDER_RADIUS);
};

/**
 * Get status bar style for current theme
 * @returns {string} Status bar style
 */
export const getStatusBarStyle = () => {
  return currentTheme === 'dark' ? 'light-content' : 'dark-content';
};

/**
 * Get weather impact color
 * @param {string} impactLevel - Impact level ('none', 'low', 'medium', 'high')
 * @returns {string} Color hex value
 */
export const getWeatherImpactColor = (impactLevel) => {
  const colors = getThemeColors();
  switch (impactLevel) {
    case 'none':
      return colors.weatherNone;
    case 'low':
      return colors.weatherLow;
    case 'medium':
      return colors.weatherMedium;
    case 'high':
      return colors.weatherHigh;
    default:
      return colors.textSecondary;
  }
};

/**
 * Get transport mode color
 * @param {string} mode - Transport mode
 * @returns {string} Color hex value
 */
export const getTransportModeColor = (mode) => {
  const colors = getThemeColors();
  switch (mode) {
    case 'driving':
      return colors.primary;
    case 'walking':
      return colors.accent;
    case 'cycling':
      return colors.secondary;
    case 'transit':
      return colors.info;
    default:
      return colors.textSecondary;
  }
};