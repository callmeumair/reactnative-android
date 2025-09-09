import React, {ReactNode} from 'react';
import {View, StyleSheet, Pressable} from 'react-native';
import Animated, {useSharedValue, useAnimatedStyle, withTiming} from 'react-native-reanimated';
import {useTheme} from '../context/ThemeContext';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  elevated?: boolean;
  style?: any;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({children, onPress, elevated = false, style}: CardProps) {
  const {theme} = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, {duration: 100});
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, {duration: 100});
  };

  const cardStyles = [
    styles.card,
    {
      backgroundColor: elevated ? theme.elevation.level1 : theme.surface,
      shadowColor: theme.shadow,
    },
    elevated && styles.elevated,
    style,
  ];

  if (onPress) {
    return (
      <AnimatedPressable
        style={[cardStyles, animatedStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}>
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={cardStyles}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
  },
  elevated: {
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
