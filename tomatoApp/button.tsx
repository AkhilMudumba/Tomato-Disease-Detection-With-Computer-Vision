import { Text, StyleSheet, Pressable, View, StyleProp, ViewStyle, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  label: string;
  onPress: () => void;
  theme?: 'primary' | 'secondary' | 'outline' | 'text';
  customStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

export default function Button({ 
  label, 
  onPress, 
  theme = 'primary', 
  customStyle, 
  disabled = false,
  icon,
  iconPosition = 'left',
  loading = false 
}: ButtonProps) {
  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  const getGradientColors = () => {
    switch (theme) {
      case 'primary':
        return ['#ff7043', '#d32f2f'];
      case 'secondary':
        return ['#FF6347', '#FF4500'];
      case 'outline':
      case 'text':
        return ['transparent', 'transparent'];
      default:
        return ['#ff7043', '#d32f2f'];
    }
  };

  return (
    <View style={customStyle}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          theme === 'outline' && styles.outlineButton,
          disabled && styles.disabledButton,
        ]}
        onPress={handlePress}
        disabled={disabled || loading}
      >
        {({ pressed }) => (
          <LinearGradient
            colors={disabled ? ['#cccccc', '#b3b3b3'] : pressed ? ['#b71c1c', '#d32f2f'] : getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={[
              styles.buttonContent,
              iconPosition === 'right' && styles.buttonContentReverse
            ]}>
              {loading ? (
                <ActivityIndicator 
                  color="#fff" 
                  size="small" 
                  style={styles.icon} 
                />
              ) : icon && iconPosition === 'left' ? (
                <MaterialIcons 
                  name={icon as any} 
                  size={20} 
                  color="#fff"
                  style={styles.icon} 
                />
              ) : null}
              
              <Text style={[
                styles.buttonLabel,
                { color: theme === 'outline' || theme === 'text' ? '#d32f2f' : '#fff' },
                pressed && styles.buttonLabelPressed,
                disabled && styles.disabledText,
              ]}>
                {label}
              </Text>
              
              {!loading && icon && iconPosition === 'right' ? (
                <MaterialIcons 
                  name={icon as any} 
                  size={20} 
                  color="#fff"
                  style={styles.icon} 
                />
              ) : null}
            </View>
          </LinearGradient>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: '#d32f2f',
  },
  gradient: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContentReverse: {
    flexDirection: 'row-reverse',
  },
  icon: {
    marginHorizontal: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonLabelPressed: {
    opacity: 0.8,
  },
  disabledButton: {
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledText: {
    opacity: 0.7,
  }
});