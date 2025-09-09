import React from 'react';
import {Pressable, StyleSheet} from 'react-native';
import Animated, {useSharedValue, useAnimatedStyle, withTiming, withSpring} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../context/ThemeContext';

interface FABProps {
  onPress: () => void;
  icon?: string;
  extended?: boolean;
  label?: string;
  style?: any;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FAB({onPress, icon = 'add', extended = false, label, style}: FABProps) {
  const {theme} = useTheme();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {scale: scale.value},
      {rotate: `${rotation.value}deg`},
    ],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.9, {duration: 100});
    rotation.value = withSpring(icon === 'add' ? 90 : 0, {damping: 10});
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {damping: 10});
    rotation.value = withSpring(0, {damping: 10});
  };

  const fabStyle = [
    styles.fab,
    extended ? styles.extended : styles.regular,
    style,
  ];

  return (
    <AnimatedPressable
      style={[animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}>
      <LinearGradient
        colors={[theme.primary, theme.primaryVariant]}
        style={fabStyle}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        <Icon name={icon} size={24} color={theme.onPrimary} />
        {extended && label && (
          <Animated.Text style={[styles.label, {color: theme.onPrimary}]}>
            {label}
          </Animated.Text>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  regular: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  extended: {
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
