import React from 'react';
import {Pressable, Text, StyleSheet, ActivityIndicator} from 'react-native';
import Animated, {useSharedValue, useAnimatedStyle, withTiming} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '../context/ThemeContext';

type ButtonVariant = 'filled' | 'outlined' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: any;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  title,
  onPress,
  variant = 'filled',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
}: ButtonProps) {
  const {theme} = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withTiming(0.96, {duration: 100});
    }
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, {duration: 100});
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];
    
    switch (variant) {
      case 'filled':
        return [
          ...baseStyle,
          {
            backgroundColor: disabled ? theme.outline : theme.primary,
          },
        ];
      case 'outlined':
        return [
          ...baseStyle,
          styles.outlined,
          {
            borderColor: disabled ? theme.outline : theme.primary,
            backgroundColor: 'transparent',
          },
        ];
      case 'text':
        return [
          ...baseStyle,
          {backgroundColor: 'transparent'},
        ];
      default:
        return baseStyle;
    }
  };

  const getTextStyle = () => {
    let color = theme.onPrimary;
    
    if (variant === 'outlined' || variant === 'text') {
      color = disabled ? theme.outline : theme.primary;
    } else if (disabled) {
      color = theme.onSurface;
    }
    
    return [
      styles.text,
      styles[`${size}Text`],
      {color},
    ];
  };

  const buttonContent = (
    <>
      {loading && <ActivityIndicator size="small" color={getTextStyle()[2]?.color} style={styles.loader} />}
      {icon && !loading && icon}
      <Text style={getTextStyle()}>{title}</Text>
    </>
  );

  const buttonStyle = getButtonStyle();

  if (variant === 'filled' && !disabled) {
    return (
      <AnimatedPressable
        style={[animatedStyle, style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}>
        <LinearGradient
          colors={[theme.primary, theme.primaryVariant]}
          style={buttonStyle}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}>
          {buttonContent}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      style={[buttonStyle, animatedStyle, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}>
      {buttonContent}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    gap: 8,
  },
  small: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  medium: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  large: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  outlined: {
    borderWidth: 1,
  },
  text: {
    fontWeight: '600',
    fontSize: 16,
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  loader: {
    marginRight: -8,
  },
});
