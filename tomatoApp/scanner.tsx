import { View, StyleSheet, Alert, ScrollView, Platform, TextInput, Text, SafeAreaView, 
  ActivityIndicator, StatusBar, Animated, Easing, TouchableOpacity, Appearance, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect, useRef } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import Button from '@/components/button';

const DEFAULT_LOCATION = 'Coimbatore';
const API_URL = 'http://192.168.107.180:8000/analyze';

const FARMING_TIPS = [
  "🌱 Fact: Tomatoes need at least 6-8 hours of sunlight daily for optimal growth.",
  "💧 Advice: Water tomatoes deeply once or twice a week rather than frequent shallow watering.",
  "🌡️ Fact: Tomato plants are susceptible to diseases like blight and wilt in humid conditions.",
  "🍂 Advice: Use mulch around tomato plants to retain moisture and prevent weeds.",
  "🍅 Fact: Tomatoes are rich in vitamins C and K, and antioxidants like lycopene.",
  "✂️ Advice: Prune lower leaves to improve air circulation and reduce disease risk.",
  "💦 Fact: Overwatering can lead to root rot and fruit cracking in tomatoes.",
  "🔄 Advice: Rotate tomato crops yearly to prevent soil-borne diseases.",
  "🌱 Fact: Tomatoes thrive in well-drained, slightly acidic soil (pH 6.0-6.8).",
  "🥢 Advice: Stake or cage tomato plants to support heavy fruit and improve yield.",
];

type RootStackParamList = {
  Index: undefined;
  DiseaseDetails: { result: any };
};
type NavigationProps = StackNavigationProp<RootStackParamList, 'Index'>;

export default function Scanner() {
  const navigation = useNavigation<NavigationProps>();
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<string>(DEFAULT_LOCATION);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [currentTip, setCurrentTip] = useState<string>(FARMING_TIPS[0]);
  
  // Initialize darkMode with device theme
  const [darkMode, setDarkMode] = useState<boolean>(Appearance.getColorScheme() === 'dark');

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const tipFadeAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const cardSlideAnim = useRef(new Animated.Value(0)).current;

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setDarkMode(colorScheme === 'dark');
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(cardSlideAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, slideAnim, shimmerAnim, cardSlideAnim]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(cardSlideAnim, {
        toValue: 0.95,
        duration: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardSlideAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      })
    ]).start();
  }, [darkMode]);

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      const tipInterval = setInterval(() => {
        Animated.sequence([
          Animated.timing(tipFadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(tipFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
        setCurrentTip(FARMING_TIPS[Math.floor(Math.random() * FARMING_TIPS.length)]);
      }, 10000);

      tipFadeAnim.setValue(1);
      return () => clearInterval(tipInterval);
    } else {
      pulseAnim.setValue(1);
      tipFadeAnim.setValue(0);
    }
  }, [isLoading]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 350],
  });

  const cardTransform = cardSlideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0]
  });

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!cameraPermission.granted || !mediaLibraryPermission.granted) {
          Alert.alert('Permission Required', 'Camera and gallery access needed for plant diagnosis.');
        }
      }
    })();
  }, []);

  const processWebImage = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            const base64Content = reader.result.split(',')[1];
            resolve(base64Content);
          } else {
            reject(new Error("Failed to convert image"));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting web image:', error);
      throw error;
    }
  };

  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      try {
        if (Platform.OS !== 'web' && result.assets[0].base64) {
          setSelectedImageBase64(result.assets[0].base64);
        } else if (Platform.OS !== 'web') {
          const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setSelectedImageBase64(base64);
        } else {
          const base64Content = await processWebImage(result.assets[0].uri);
          setSelectedImageBase64(base64Content);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to process image.');
      }
    }
  };

  const takePhotoAsync = async () => {
    if (Platform.OS === 'web' && !ImagePicker.useMediaLibraryPermissions) {
      Alert.alert('Not Available', 'Camera unavailable on web. Use gallery instead.');
      return;
    }
    
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      try {
        if (Platform.OS !== 'web' && result.assets[0].base64) {
          setSelectedImageBase64(result.assets[0].base64);
        } else if (Platform.OS !== 'web') {
          const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setSelectedImageBase64(base64);
        } else {
          const base64Content = await processWebImage(result.assets[0].uri);
          setSelectedImageBase64(base64Content);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to process camera image.');
      }
    }
  };

  const detectLocationAsync = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Location detection unavailable on web.');
      return;
    }

    setIsDetectingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access needed.');
        return;
      }

      const locationData = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
      });

      setUserLocation(geocode?.city ? `${geocode.city}, ${geocode.region || ''}` : DEFAULT_LOCATION);
    } catch (error) {
      Alert.alert('Location Error', 'Failed to detect location.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const navigateToDetailsScreen = (result: any) => {
    navigation.navigate('DiseaseDetails', { result });
  };

  const checkDiseaseAsync = async () => {
    if (!selectedImage || !selectedImageBase64) {
      Alert.alert('Error', 'Please select an image first.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          image: selectedImageBase64,
          location: userLocation || DEFAULT_LOCATION,
        }),
      });

      if (!response.ok) throw new Error('Server error');
      const result = await response.json();

      setTimeout(() => {
        setIsLoading(false);
        Alert.alert(
          'Analysis Complete',
          `Detected: ${result.detection.disease}\nConfidence: ${(result.detection.confidence * 100).toFixed(2)}%\nSeverity: ${result.detection.severity}`,
          [
            { text: 'View Details', onPress: () => navigateToDetailsScreen(result) },
            { text: 'Dismiss', style: 'cancel' },
          ]
        );
      }, 800);
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Analysis Failed', 'Unable to complete the diagnosis. Please try again with a more clear tomato leaf image.');
    }
  };

  const getThemeColors = () => {
      if (darkMode) {
        return {
          background: '#121212',
          card: '#1e1e1e',
          text: '#ffffff',
          subtext: '#b0b0b0',
          accent: '#ff7043',
          primary: '#ff5722',
          secondary: '#4caf50',
          border: '#333333',
          inputBg: '#2a2a2a',
          headerGradient: ['#ff5722', '#bf360c', '#3e2723'] as [string, string, ...string[]],
          buttonGradient: ['#ff5722', '#e64a19'],
          analyzeGradient: ['#43a047', '#2e7d32'] as const,
        };
      }
      return {
        background: '#f8f8f8',
        card: '#ffffff',
        text: '#333333',
        subtext: '#666666',
        accent: '#ff7043',
        primary: '#d32f2f',
        secondary: '#43a047',
        border: '#f0f0f0',
        inputBg: '#f5f5f5',
        headerGradient: ['#d32f2f', '#b71c1c', '#ff5722'] as [string, string, ...string[]],
        buttonGradient: ['#ff7043', '#d32f2f'],
        analyzeGradient: ['#43a047', '#2e7d32'],
      };
    };

  const theme = getThemeColors();

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={darkMode ? "light-content" : "light-content"} 
        backgroundColor={darkMode ? "#000000" : "#d32f2f"} 
      />
      
      {/* Header is only shown when not loading */}
      {!isLoading && (
        <LinearGradient
          colors={theme.headerGradient}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <MaterialIcons name="eco" size={40} color="#fff" style={styles.headerIcon} />
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Plant Health AI</Text>
                <Text style={styles.headerSubtitle}>Smart disease diagnosis</Text>
              </View>
              <TouchableOpacity 
                style={styles.themeToggleButton}
                onPress={() => setDarkMode(!darkMode)}
              >
                <FontAwesome5 
                  name={darkMode ? "sun" : "moon"} 
                  size={24} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      )}

      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.mainContentWrapper, 
            { 
              opacity: fadeAnim, 
              transform: [
                { translateY: slideAnim },
                { translateY: cardTransform }
              ] 
            }
          ]}
        >
          <View style={[styles.mainCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.primary }]}>
              Quick Scan
            </Text>
            
            <View style={styles.imageOuterContainer}>
              <LinearGradient
                colors={darkMode ? ['rgba(30,30,30,0.8)', 'rgba(20,20,20,0.95)'] : ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.95)']}
                style={styles.imageCardGradient}
              >
                {selectedImage ? (
                  <Image 
                    source={{ uri: selectedImage }} 
                    style={styles.imageStyle}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.noImageOverlay}>
                    <MaterialIcons name="image" size={60} color={darkMode ? "#444" : "#ddd"} />
                    <Text style={[styles.noImageText, { color: darkMode ? "#888" : "#999" }]}>
                      Select an image to analyze
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </View>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.inputBg }]} 
                onPress={pickImageAsync}
              >
                <MaterialIcons name="photo-library" size={24} color={theme.primary} />
                <Text style={[styles.actionButtonText, { color: theme.text }]}>Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.inputBg }]} 
                onPress={takePhotoAsync}
              >
                <MaterialIcons name="camera-alt" size={24} color={theme.primary} />
                <Text style={[styles.actionButtonText, { color: theme.text }]}>Camera</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.sectionLabel, { color: theme.text }]}>
                <Feather name="map-pin" size={16} color={theme.primary} /> Location
              </Text>
              
              <View style={styles.locationInputContainer}>
                <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg }]}>
                  <TextInput
                    style={[styles.locationInput, { color: theme.text }]}
                    placeholder="Enter your location"
                    placeholderTextColor={darkMode ? "#777" : "#999"}
                    value={userLocation}
                    onChangeText={setUserLocation}
                  />
                </View>
                
                {Platform.OS !== 'web' && (
                  <TouchableOpacity 
                    style={[styles.detectButton, { backgroundColor: theme.inputBg }]}
                    onPress={detectLocationAsync}
                    disabled={isDetectingLocation}
                  >
                    <Feather 
                      name={isDetectingLocation ? "loader" : "navigation"} 
                      size={20} 
                      color={theme.primary} 
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.analyzeButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.analyzeButton,
                  (!selectedImage || isLoading) && styles.disabledButton,
                  { backgroundColor: theme.secondary }
                ]}
                onPress={checkDiseaseAsync}
                disabled={isLoading || !selectedImage}
              >
                <LinearGradient
                  colors={theme.analyzeGradient as [string, string, ...string[]]}
                  style={styles.analyzeButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Feather name="search" size={22} color="#ffffff" style={styles.analyzeButtonIcon} />
                  )}
                  <Text style={styles.analyzeButtonText}>
                    {isLoading ? "Analyzing..." : "Analyze Plant"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={[styles.tipContainer, { backgroundColor: darkMode ? '#2a2a2a' : 'rgba(255, 236, 235, 0.8)' }]}>
              <FontAwesome5 name="lightbulb" size={16} color={theme.primary} style={styles.tipIcon} />
              <Text style={[styles.tipText, { color: theme.text }]}>
                For best results, provide a clear image of the affected plant leaves in good lighting.
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {isLoading && (
        <LinearGradient
          colors={theme.headerGradient}
          style={styles.loadingOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View style={[styles.loadingContainer, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={darkMode ? ['#2a2a2a', '#1a1a1a'] : ['#fff', '#f9f9f9']}
              style={styles.loadingGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <View style={styles.loaderIconContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <FontAwesome5 name="leaf" size={24} color={theme.secondary} style={styles.loaderLeafIcon} />
              </View>
              
              <Text style={[styles.loadingText, { color: theme.primary }]}>
                Analyzing tomato health...
              </Text>
              <Text style={[styles.loadingSubtext, { color: darkMode ? '#aaa' : '#666' }]}>
                This may take a moment
              </Text>
              
              <Animated.View style={[styles.tipCardContainer, { opacity: tipFadeAnim }]}>
                <LinearGradient
                  colors={darkMode ? ['#2a2a2a', '#333333'] : ['#ffebee', '#ffcdd2']}
                  style={styles.tipCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Animated.Text style={[styles.farmingTip, { color: darkMode ? '#eee' : '#d32f2f' }]}>
                    {currentTip}
                  </Animated.Text>
                </LinearGradient>
              </Animated.View>
            </LinearGradient>
          </Animated.View>
        </LinearGradient>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 25 : 10,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    zIndex: 100,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerIcon: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  themeToggleButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  mainContentWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  mainCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  imageOuterContainer: {
    height: 240,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  imageCardGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    padding: 5,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageStyle: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  noImageOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noImageText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  inputSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 10,
  },
  locationInput: {
    padding: 14,
    fontSize: 16,
  },
  detectButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeButtonContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  analyzeButton: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
  },
  disabledButton: {
    opacity: 0.6,
  },
  analyzeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  analyzeButtonIcon: {
    marginRight: 10,
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  tipContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIcon: {
    marginRight: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    width: '85%',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loadingGradient: {
    padding: 25,
    alignItems: 'center',
  },
  loaderIconContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  loaderLeafIcon: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    marginBottom: 20,
  },
  tipCardContainer: {
    width: '100%',
  },
  tipCardGradient: {
    padding: 15,
    borderRadius: 12,
  },
  farmingTip: {
    fontSize: 14,
    textAlign: 'center',
  },
});