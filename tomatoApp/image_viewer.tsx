import { StyleSheet, Image, View, ActivityIndicator, Text, Animated, Easing } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ImageViewerProps {
  imgSource: any;
  selectedImage?: string;
}

export default function ImageViewer({ imgSource, selectedImage }: ImageViewerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Animation setup
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Shimmer animation for placeholder
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [fadeAnim, scaleAnim, shimmerAnim]);

  // Reset animations when image changes
  useEffect(() => {
    if (selectedImage) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selectedImage, fadeAnim, scaleAnim]);

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const imageSource = selectedImage ? { uri: selectedImage } : imgSource;

  // Shimmer effect for placeholder
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 300],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['#FFF3F3', '#FFEBEE']}
        style={styles.imageGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Placeholder when no image is selected */}
        {!selectedImage && !loading && (
          <View style={styles.placeholderContainer}>
            <LinearGradient
              colors={['rgba(255,235,238,0.8)', 'rgba(255,205,210,0.6)']}
              style={styles.placeholderGradient}
            >
              <FontAwesome5 name="seedling" size={50} color="#d32f2f" style={styles.placeholderIcon} />
              <Text style={styles.placeholderText}>Capture or select a tomato leaf</Text>
              <Text style={styles.placeholderSubtext}>
                Ensure clear lighting and focus on affected areas
              </Text>
              <Animated.View
                style={[
                  styles.shimmer,
                  { transform: [{ translateX: shimmerTranslate }] },
                ]}
              />
            </LinearGradient>
          </View>
        )}

        {/* Image Display */}
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="contain"
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
        />

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.9)', 'rgba(255,235,238,0.9)']}
              style={styles.loadingGradient}
            >
              <ActivityIndicator size="large" color="#d32f2f" />
              <Text style={styles.loadingText}>Processing image...</Text>
            </LinearGradient>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <LinearGradient
              colors={['rgba(255,235,238,0.9)', 'rgba(255,205,210,0.9)']}
              style={styles.errorGradient}
            >
              <MaterialIcons name="error-outline" size={50} color="#d32f2f" />
              <Text style={styles.errorText}>Image failed to load</Text>
              <Text style={styles.errorSubtext}>Try another image</Text>
            </LinearGradient>
          </View>
        )}
      </LinearGradient>

      {/* Success Indicator */}
      {selectedImage && !loading && !error && (
        <Animated.View
          style={[
            styles.successContainer,
            { opacity: fadeAnim },
          ]}
        >
          <LinearGradient
            colors={['#43a047', '#2e7d32']}
            style={styles.successGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MaterialIcons name="check-circle" size={22} color="#fff" />
            <Text style={styles.successText}>Ready for analysis</Text>
          </LinearGradient>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  placeholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  placeholderGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    overflow: 'hidden',
  },
  placeholderIcon: {
    marginBottom: 12,
    opacity: 0.9,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#d32f2f',
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
  },
  shimmer: {
    position: 'absolute',
    width: 80,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    opacity: 0.7,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#d32f2f',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorGradient: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#d32f2f',
    textAlign: 'center',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  successContainer: {
    position: 'absolute',
    bottom: 12,
    padding: 2,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  successGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  successText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});