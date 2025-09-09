import React, {useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  useAnimatedScrollHandler,
  FadeIn,
  SlideInRight,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Button} from '../components/Button';
import {useTheme} from '../context/ThemeContext';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: string[];
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Smart Commute Planning',
    description: 'Never be late again! Get personalized departure times based on real-time traffic and weather conditions.',
    icon: 'schedule',
    gradient: ['#667eea', '#764ba2'],
  },
  {
    id: '2',
    title: 'Intelligent Notifications',
    description: 'Receive timely alerts when it\'s time to leave, taking into account traffic delays and weather conditions.',
    icon: 'notifications-active',
    gradient: ['#f093fb', '#f5576c'],
  },
  {
    id: '3',
    title: 'Multiple Destinations',
    description: 'Save your favorite destinations like work, gym, or school. Plan your commute to any location with ease.',
    icon: 'place',
    gradient: ['#4facfe', '#00f2fe'],
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({onComplete}: OnboardingScreenProps) {
  const {theme} = useTheme();
  const scrollX = useSharedValue(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const renderSlide = (slide: OnboardingSlide, index: number) => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const animatedStyle = useAnimatedStyle(() => {
      const scale = interpolate(
        scrollX.value,
        inputRange,
        [0.8, 1, 0.8],
      );
      
      const opacity = interpolate(
        scrollX.value,
        inputRange,
        [0.5, 1, 0.5],
      );

      return {
        transform: [{scale}],
        opacity,
      };
    });

    return (
      <View key={slide.id} style={styles.slide}>
        <LinearGradient
          colors={slide.gradient}
          style={styles.gradientBackground}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}>
          <Animated.View style={[styles.slideContent, animatedStyle]}>
            <Animated.View 
              entering={FadeIn.delay(200)}
              style={[styles.iconContainer, {backgroundColor: theme.surface}]}>
              <Icon name={slide.icon} size={64} color={slide.gradient[0]} />
            </Animated.View>
            
            <Animated.Text 
              entering={SlideInRight.delay(400)}
              style={[styles.title, {color: theme.onPrimary}]}>
              {slide.title}
            </Animated.Text>
            
            <Animated.Text 
              entering={SlideInRight.delay(600)}
              style={[styles.description, {color: theme.onPrimary}]}>
              {slide.description}
            </Animated.Text>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const animatedStyle = useAnimatedStyle(() => {
            const inputRange = [
              (index - 1) * SCREEN_WIDTH,
              index * SCREEN_WIDTH,
              (index + 1) * SCREEN_WIDTH,
            ];

            const width = interpolate(
              scrollX.value,
              inputRange,
              [8, 24, 8],
            );

            const opacity = interpolate(
              scrollX.value,
              inputRange,
              [0.5, 1, 0.5],
            );

            return {
              width,
              opacity,
            };
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                {backgroundColor: theme.onSurface},
                animatedStyle,
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.scrollView}>
        {slides.map(renderSlide)}
      </Animated.ScrollView>

      {renderPagination()}

      <View style={[styles.footer, {backgroundColor: theme.surface}]}>
        <Button
          title="Get Started"
          onPress={onComplete}
          size="large"
          style={styles.getStartedButton}
        />
        
        <Text style={[styles.footerText, {color: theme.onSurfaceVariant}]}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
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
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingBottom: 48,
  },
  getStartedButton: {
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});
