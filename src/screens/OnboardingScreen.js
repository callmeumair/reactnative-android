import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors, TYPOGRAPHY, SPACING, BORDER_RADIUS, createThemedStyles } from '../utils/theme';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    emoji: '📍',
    title: 'Set Your Locations',
    description: 'Add your home and work addresses for accurate commute calculations.',
    color: '#007AFF',
  },
  {
    id: 2,
    emoji: '🌦️',
    title: 'Weather-Smart Timing',
    description: 'Get notifications that factor in weather conditions affecting your commute.',
    color: '#FF6B35',
  },
  {
    id: 3,
    emoji: '🚗',
    title: 'Live Traffic Updates',
    description: 'Real-time traffic data ensures you leave at the perfect time.',
    color: '#34C759',
  },
  {
    id: 4,
    emoji: '🔔',
    title: 'Smart Notifications',
    description: 'Receive timely alerts so you never miss your commute window.',
    color: '#FF9500',
  },
];

const OnboardingScreen = ({ navigation, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const colors = getThemeColors();
  const styles = useThemedStyles();

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      scrollViewRef.current?.scrollTo({
        x: prevIndex * width,
        animated: true,
      });
    }
  };

  const handleGetStarted = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate('LocationSetup');
    });
  };

  const handleSkip = () => {
    setCurrentIndex(onboardingData.length - 1);
    scrollViewRef.current?.scrollTo({
      x: (onboardingData.length - 1) * width,
      animated: true,
    });
  };

  const onScroll = (event) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollX / width);
    setCurrentIndex(index);
  };

  const renderOnboardingItem = ({ emoji, title, description, color }) => (
    <View style={[styles.slideContainer, { width }]}>
      <View style={styles.contentContainer}>
        <View style={[styles.emojiContainer, { backgroundColor: color }]}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );

  const renderPaginationDots = () => (
    <View style={styles.paginationContainer}>
      {onboardingData.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            {
              backgroundColor: index === currentIndex ? colors.primary : colors.textTertiary,
              transform: [{ scale: index === currentIndex ? 1.2 : 1 }],
            },
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={currentIndex === onboardingData.length - 1}
          >
            <Text style={[
              styles.skipText,
              { opacity: currentIndex === onboardingData.length - 1 ? 0 : 1 }
            ]}>
              Skip
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {onboardingData.map((item) =>
            renderOnboardingItem(item)
          )}
        </ScrollView>

        {/* Pagination */}
        {renderPaginationDots()}

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[
              styles.backButton,
              { opacity: currentIndex === 0 ? 0.3 : 1 }
            ]}
            onPress={handlePrevious}
            disabled={currentIndex === 0}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: onboardingData[currentIndex]?.color || colors.primary }
            ]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const useThemedStyles = createThemedStyles((colors, typography, spacing, borderRadius) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    animatedContainer: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    skipButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    skipText: {
      fontSize: typography.fontSize.md,
      color: colors.primary,
      fontWeight: typography.fontWeight.medium,
    },
    scrollView: {
      flex: 1,
    },
    slideContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    contentContainer: {
      alignItems: 'center',
      maxWidth: 300,
    },
    emojiContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xl,
      ...colors.shadow,
    },
    emoji: {
      fontSize: 60,
    },
    title: {
      fontSize: typography.fontSize.xxl,
      fontWeight: typography.fontWeight.bold,
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    description: {
      fontSize: typography.fontSize.lg,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: typography.lineHeight.lg,
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    paginationDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginHorizontal: spacing.xs,
    },
    navigationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    backButton: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.lg,
    },
    backButtonText: {
      fontSize: typography.fontSize.md,
      color: colors.textSecondary,
      fontWeight: typography.fontWeight.medium,
    },
    nextButton: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.lg,
      minWidth: 120,
      alignItems: 'center',
      ...colors.shadow,
    },
    nextButtonText: {
      fontSize: typography.fontSize.md,
      color: '#FFFFFF',
      fontWeight: typography.fontWeight.semiBold,
    },
  })
);

export default OnboardingScreen;