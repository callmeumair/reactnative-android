import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { getThemeColors, TYPOGRAPHY, SPACING, createThemedStyles } from '../utils/theme';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const colors = getThemeColors();
  const styles = useThemedStyles();

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* App Icon/Logo */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🚗</Text>
          </View>
        </View>

        {/* App Name */}
        <Text style={styles.appName}>CommuteTimely</Text>
        <Text style={styles.tagline}>Smart commute notifications</Text>

        {/* Loading Animation */}
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingDot,
              { backgroundColor: colors.primary },
              {
                opacity: fadeAnim,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              { backgroundColor: colors.secondary },
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: Animated.loop(
                      Animated.sequence([
                        Animated.timing(new Animated.Value(0), {
                          toValue: -10,
                          duration: 400,
                          useNativeDriver: true,
                        }),
                        Animated.timing(new Animated.Value(-10), {
                          toValue: 0,
                          duration: 400,
                          useNativeDriver: true,
                        }),
                      ]),
                      { iterations: -1 }
                    ),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              { backgroundColor: colors.accent },
              {
                opacity: fadeAnim,
              },
            ]}
          />
        </View>
      </Animated.View>

      {/* Bottom text */}
      <Animated.View
        style={[
          styles.bottomContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </Animated.View>
    </View>
  );
};

const useThemedStyles = createThemedStyles((colors, typography, spacing) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconContainer: {
      marginBottom: spacing.xl,
    },
    iconCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...colors.shadow,
    },
    iconText: {
      fontSize: 60,
    },
    appName: {
      fontSize: typography.fontSize.xxxl,
      fontWeight: typography.fontWeight.bold,
      color: colors.text,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    tagline: {
      fontSize: typography.fontSize.md,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    loadingContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.xl,
    },
    loadingDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginHorizontal: spacing.xs,
    },
    bottomContainer: {
      position: 'absolute',
      bottom: spacing.xl,
      alignItems: 'center',
    },
    versionText: {
      fontSize: typography.fontSize.sm,
      color: colors.textTertiary,
      textAlign: 'center',
    },
  })
);

export default SplashScreen;