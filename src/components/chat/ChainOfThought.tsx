
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  interpolate,
  Extrapolate,
  measure,
  runOnUI,
  useDerivedValue
} from 'react-native-reanimated';
import { ChevronDown, Circle } from 'lucide-react-native';
import { theme } from '../../lib/theme';

// Types
interface ChainOfThoughtProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface ChainOfThoughtStepProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  isLast?: boolean;
}

interface ChainOfThoughtTriggerProps {
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  onPress?: () => void;
  isOpen?: boolean;
  status?: 'active' | 'complete' | 'pending' | 'skipped' | string;
}

interface ChainOfThoughtContentProps {
  children: React.ReactNode;
  isOpen?: boolean;
}

interface ChainOfThoughtItemProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

// Components

export const ChainOfThoughtItem = ({ children, style }: ChainOfThoughtItemProps) => (
  <View style={[styles.item, style]}>
    <Text style={styles.itemText}>{children}</Text>
  </View>
);

export const ChainOfThoughtTrigger = ({ 
  children, 
  leftIcon, 
  onPress, 
  isOpen, 
  status = 'pending'
}: ChainOfThoughtTriggerProps) => {
  const rotation = useDerivedValue(() => {
    return withTiming(isOpen ? 180 : 0, { duration: 200 });
  }, [isOpen]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <TouchableOpacity 
      style={styles.trigger} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.triggerLeft}>
        <View style={styles.iconContainer}>
          {leftIcon || <Circle size={8} fill={theme.colors.text.tertiary} color={theme.colors.text.tertiary} />}
        </View>
        <Text style={[
          styles.triggerText, 
          status === 'active' && styles.triggerTextActive,
          status === 'complete' && styles.triggerTextComplete
        ]}>
          {children}
        </Text>
      </View>
      {!leftIcon && (
         <Animated.View style={animatedIconStyle}>
           <ChevronDown size={14} color={theme.colors.text.tertiary} />
         </Animated.View>
      )}
    </TouchableOpacity>
  );
};

export const ChainOfThoughtContent = ({ children, isOpen }: ChainOfThoughtContentProps) => {
  // Simple conditional rendering for now as measuring layout for reanimated height 
  // can be tricky with dynamic content. 
  // We can enhance with height animation later if needed.
  if (!isOpen) return null;

  return (
    <View style={styles.contentContainer}>
      <View style={styles.contentBorder} />
      <View style={styles.contentInner}>
        {children}
      </View>
    </View>
  );
};

export const ChainOfThoughtStep = ({ 
  children, 
  defaultOpen = false, 
  isLast = false 
}: ChainOfThoughtStepProps) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  // Clone children to inject props
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // Check if it's a Trigger or Content and pass necessary state
      // @ts-ignore - inspecting component names/types is hard in RN, reliant on order/structure
      // Assuming first child is trigger, second is content usually
      
      // If it looks like a Trigger (has user interactions)
      if ((child.type as any) === ChainOfThoughtTrigger || (child as React.ReactElement<any>).props.onPress === undefined) {
         return React.cloneElement(child as React.ReactElement<any>, { 
           onPress: () => setIsOpen(!isOpen),
           isOpen,
         });
      }
      // If it looks like Content
      if ((child.type as any) === ChainOfThoughtContent || (child as React.ReactElement<any>).props.isOpen === undefined) {
         return React.cloneElement(child as React.ReactElement<any>, { isOpen });
      }
    }
    return child;
  });

  return (
    <View style={styles.step}>
      {childrenWithProps}
      {!isLast && (
        <View style={styles.connectorContainer}>
          <View style={styles.connector} />
        </View>
      )}
    </View>
  );
};

export const ChainOfThought = ({ children, style }: ChainOfThoughtProps) => {
  const childrenArray = React.Children.toArray(children);

  return (
    <View style={[styles.container, style]}>
      {childrenArray.map((child, index) => (
        <React.Fragment key={index}>
          {React.isValidElement(child) &&
            React.cloneElement(child as React.ReactElement<any>, {
              isLast: index === childrenArray.length - 1,
            })}
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  step: {
    flexDirection: 'column',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerText: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  triggerTextActive: {
    color: theme.colors.text.primary,
  },
  triggerTextComplete: {
    color: theme.colors.text.secondary,
  },
  contentContainer: {
    flexDirection: 'row',
  },
  contentBorder: {
    width: 1,
    backgroundColor: theme.colors.border.subtle, // or primary/20
    marginLeft: 9.5, // Center align with icon (20px width / 2 = 10px center - 0.5px border)
    marginRight: 16,
  },
  contentInner: {
    flex: 1,
    paddingBottom: 8,
    gap: 4,
  },
  item: {
    marginBottom: 2,
  },
  itemText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    lineHeight: 18,
  },
  connectorContainer: {
    flexDirection: 'row',
    height: 6, // Spacing between steps
  },
  connector: {
    width: 1,
    backgroundColor: theme.colors.border.subtle,
    marginLeft: 9.5,
  }
});
