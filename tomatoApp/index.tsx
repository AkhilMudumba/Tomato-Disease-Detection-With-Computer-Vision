import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar, Animated, ScrollView, useColorScheme, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';

// Theme configurations
const themes = {
  light: {
    background: '#FCFCFC',
    cardBackground: '#FFFFFF',
    text: '#333333',
    subtitle: '#666666',
    featureBg: '#FFF8F7',
    iconBg: '#FFE8E5',
    diseaseBg: 'rgba(255, 235, 238, 0.7)',
    gradient: ['#FF5252', '#FF7676', '#FF9E80'],
    buttonGradient: ['#FF5252', '#FF7676'],
    visualGradient: ['#FF7676', '#FF5252'],
    diseaseTitle: '#E53935',
    iconColor: '#E53935',
    shadow: 'rgba(0, 0, 0, 0.1)',
    border: '#EEEEEE'
  },
  dark: {
    background: '#121212',
    cardBackground: '#1E1E1E',
    text: '#FFFFFF',
    subtitle: '#DDDDDD',
    featureBg: '#262626',
    iconBg: '#353535',
    diseaseBg: 'rgba(66, 66, 66, 0.7)',
    gradient: ['#CF2D2D', '#E53935', '#F44336'],
    buttonGradient: ['#E53935', '#CF2D2D'],
    visualGradient: ['#F44336', '#CF2D2D'],
    diseaseTitle: '#FF5252',
    iconColor: '#FF5252',
    shadow: 'rgba(0, 0, 0, 0.3)',
    border: '#333333'
  }
};

// Server configuration
const SERVER_URL = 'http://192.168.107.180:8000'; // Replace with your server URL

export default function HomeScreen() {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState(systemColorScheme);
  const theme = themes[themeMode || 'light'];
  const router = useRouter();
  
  // Animation refs
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const slideInAnim = useRef(new Animated.Value(-50)).current;
  const diseaseAnims = Array(6).fill(null).map(() => useRef(new Animated.Value(0)).current);

  // Weather state
  const [weatherData, setWeatherData] = useState({
    temperature: '--°C',
    humidity: '--%',
    sunlight: '--',
    condition: 'Loading...'
  });
  const [locationStatus, setLocationStatus] = useState('loading');

  // Toggle theme function
  const toggleTheme = () => {
    setThemeMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  // Request location permission and fetch weather data
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          console.log('Location permission denied');
          setLocationStatus('denied');
          return;
        }
        
        setLocationStatus('granted');
        
        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        
        fetchWeatherData(`${latitude},${longitude}`);
      } catch (error) {
        console.error('Error getting location:', error);
        setLocationStatus('denied');
      }
    })();
  }, []);

  // Fetch weather data from server
  const fetchWeatherData = async (location: string) => {
    try {
      const response = await fetch(`${SERVER_URL}/weather`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location }),
      });
      
      if (!response.ok) {
        throw new Error('Weather service unavailable');
      }
      
      const data = await response.json();
      
      if (data.current) {
        setWeatherData({
          temperature: `${Math.round(data.current.temperature)}°C`,
          humidity: `${data.current.humidity}%`,
          sunlight: getSunlightLevel(data.current),
          condition: data.current.condition
        });
      }
    } catch (error) {
      console.error('Failed to fetch weather:', error);
    }
  };

  // Helper function to determine sunlight level based on weather condition
  interface WeatherData {
    temperature: string;
    humidity: string;
    sunlight: string;
    condition: string;
  }

  interface CurrentWeather {
    condition: string;
    temperature: number;
    humidity: number;
  }

  const getSunlightLevel = (currentWeather: CurrentWeather): string => {
    const condition = currentWeather.condition.toLowerCase();
    if (condition.includes('sunny') || condition.includes('clear')) {
      return 'High';
    } else if (condition.includes('cloud') || condition.includes('overcast')) {
      return 'Medium';
    } else {
      return 'Low';
    }
  };

  // Pulse animation
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  // Bounce animation for visual
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [bounceAnim]);

  // Rotate animation for leaf
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, { toValue: 1, duration: 6000, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [rotateAnim]);

  // Fade-in and slide-in animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideInAnim, { toValue: 0, duration: 800, useNativeDriver: true })
    ]).start();
  }, [fadeAnim, slideInAnim]);

  // Disease pop-in animation
  useEffect(() => {
    const animation = Animated.stagger(150, diseaseAnims.map(anim =>
      Animated.spring(anim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true })
    ));
    animation.start();
    return () => animation.stop();
  }, [diseaseAnims]);

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });
  const bounceTranslateY = bounceAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Background gradient */}
      <View style={styles.background}>
        <LinearGradient
          colors={[theme.gradient[0], theme.gradient[1]]}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>
      
      {/* Header with theme toggle - reduced padding */}
      <View style={[styles.header, { paddingTop: 25 }]}>
        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
          <View style={[styles.themeToggleButton, { backgroundColor: theme.cardBackground }]}>
            <Ionicons 
              name={themeMode === 'light' ? 'moon-outline' : 'sunny-outline'} 
              size={22} 
              color={theme.text} 
            />
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Tomato Health</Text>
          <Text style={[styles.subtitle, { color: theme.subtitle }]}>AI-Powered Plant Analysis</Text>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Visual element - moved up */}
        <Animated.View style={[
          styles.visualContainer, 
          { opacity: fadeAnim, transform: [{ translateY: slideInAnim }], marginTop: 0 }
        ]}>
          <LinearGradient
            colors={[theme.visualGradient[0], theme.visualGradient[1]]}
            style={styles.visualGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.visualInner}>
              <Animated.View style={[
                styles.leafIconContainer,
                { transform: [{ translateY: bounceTranslateY }, { rotate }] }
              ]}>
                <MaterialCommunityIcons name="leaf" size={65} color="#fff" style={styles.visualIcon} />
              </Animated.View>
              <Animated.View
                style={[
                  styles.pulseCircle,
                  { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
                ]}
              />
            </View>
          </LinearGradient>
          <Text style={[styles.visualText, { color: theme.text }]}>AI Plant Scanner</Text>
        </Animated.View>
        
        {/* Weather widget */}
        {locationStatus === 'granted' && (
          <Animated.View style={[
            styles.weatherContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideInAnim }] }
          ]}>
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              style={[styles.weatherGradient, { backgroundColor: theme.cardBackground }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.weatherHeader}>
                <Text style={[styles.weatherTitle, { color: theme.text }]}>Today's Conditions</Text>
                <Ionicons name="partly-sunny" size={20} color={theme.iconColor} />
              </View>
              
              <View style={styles.weatherDataContainer}>
                <View style={styles.weatherDataItem}>
                  <Ionicons name="thermometer-outline" size={20} color={theme.iconColor} />
                  <Text style={[styles.weatherValue, { color: theme.text }]}>{weatherData.temperature}</Text>
                  <Text style={[styles.weatherLabel, { color: theme.subtitle }]}>Temp</Text>
                </View>
                
                <View style={styles.weatherDataItem}>
                  <Ionicons name="water-outline" size={20} color={theme.iconColor} />
                  <Text style={[styles.weatherValue, { color: theme.text }]}>{weatherData.humidity}</Text>
                  <Text style={[styles.weatherLabel, { color: theme.subtitle }]}>Humidity</Text>
                </View>
                
                <View style={styles.weatherDataItem}>
                  <Ionicons name="sunny-outline" size={20} color={theme.iconColor} />
                  <Text style={[styles.weatherValue, { color: theme.text }]}>{weatherData.sunlight}</Text>
                  <Text style={[styles.weatherLabel, { color: theme.subtitle }]}>Sunlight</Text>
                </View>
              </View>
              
              <Text style={[styles.weatherCondition, { color: theme.subtitle }]}>
                {weatherData.condition}
              </Text>
            </LinearGradient>
          </Animated.View>
        )}
        
        {/* Feature section */}
        <Animated.View style={[
          styles.infoContainer, 
          { opacity: fadeAnim, transform: [{ translateY: slideInAnim }] }
        ]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Features</Text>
          
          <View style={styles.featureGrid}>
            <View style={[styles.featureItem, { backgroundColor: theme.featureBg, borderColor: theme.border }]}>
              <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
                <Ionicons name="scan-outline" size={24} color={theme.iconColor} />
              </View>
              <Text style={[styles.featureText, { color: theme.text }]}>Leaf Analysis</Text>
            </View>
            
            <View style={[styles.featureItem, { backgroundColor: theme.featureBg, borderColor: theme.border }]}>
              <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
                <Ionicons name="bug-outline" size={24} color={theme.iconColor} />
              </View>
              <Text style={[styles.featureText, { color: theme.text }]}>Disease Detection</Text>
            </View>
            
            <View style={[styles.featureItem, { backgroundColor: theme.featureBg, borderColor: theme.border }]}>
              <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
                <Ionicons name="medkit-outline" size={24} color={theme.iconColor} />
              </View>
              <Text style={[styles.featureText, { color: theme.text }]}>Treatment Guide</Text>
            </View>
            
            <View style={[styles.featureItem, { backgroundColor: theme.featureBg, borderColor: theme.border }]}>
              <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
                <Ionicons name="analytics-outline" size={24} color={theme.iconColor} />
              </View>
              <Text style={[styles.featureText, { color: theme.text }]}>Growth Analytics</Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 15 }]}>Tools</Text>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
            onPress={() => router.push('/scanner')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.buttonGradient[0], theme.buttonGradient[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonIcon}
            >
              <Ionicons name="camera" size={22} color="#fff" />
            </LinearGradient>
            
            <View style={styles.buttonTextContainer}>
              <Text style={[styles.buttonText, { color: theme.text }]}>Scan Tomato Leaves</Text>
              <Text style={[styles.buttonSubtext, { color: theme.subtitle }]}>Detect diseases with AI</Text>
            </View>
            
            <Ionicons name="chevron-forward" size={22} color={theme.subtitle} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
            onPress={() => router.push('/sensors')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.buttonGradient[0], theme.buttonGradient[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonIcon}
            >
              <Ionicons name="pulse" size={22} color="#fff" />
            </LinearGradient>
            
            <View style={styles.buttonTextContainer}>
              <Text style={[styles.buttonText, { color: theme.text }]}>Monitor Field</Text>
              <Text style={[styles.buttonSubtext, { color: theme.subtitle }]}>Track growth and conditions</Text>
            </View>
            
            <Ionicons name="chevron-forward" size={22} color={theme.subtitle} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
            onPress={() => router.push('/weather')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.buttonGradient[0], theme.buttonGradient[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonIcon}
            >
              <Ionicons name="partly-sunny" size={22} color="#fff" />
            </LinearGradient>
            
            <View style={styles.buttonTextContainer}>
              <Text style={[styles.buttonText, { color: theme.text }]}>Weather Monitor</Text>
              <Text style={[styles.buttonSubtext, { color: theme.subtitle }]}>Check forecast and alerts</Text>
            </View>
            
            <Ionicons name="chevron-forward" size={22} color={theme.subtitle} />
          </TouchableOpacity>
        </View>
        
        {/* Disease info section */}
        <View style={[styles.diseaseInfoContainer, { backgroundColor: theme.diseaseBg }]}>
          <Text style={[styles.diseaseTitle, { color: theme.diseaseTitle }]}>Common Tomato Diseases</Text>
          
          <View style={styles.diseaseGrid}>
            {[
              { name: 'Early Blight', icon: 'leaf', anim: diseaseAnims[0] },
              { name: 'Late Blight', icon: 'leaf-outline', anim: diseaseAnims[1] },
              { name: 'Leaf Mold', icon: 'water', anim: diseaseAnims[2] },
              { name: 'Bacterial Spot', icon: 'bug', anim: diseaseAnims[3] },
              { name: 'Septoria', icon: 'warning', anim: diseaseAnims[4] },
              { name: 'Virus', icon: 'alert-circle', anim: diseaseAnims[5] }
            ].map((disease, index) => (
              <Animated.View 
                key={index}
                style={[
                  styles.diseaseItem, 
                  { 
                    opacity: disease.anim, 
                    transform: [{ scale: disease.anim }],
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border
                  }
                ]}
              >
                <Ionicons name={disease.icon as keyof typeof Ionicons.glyphMap} size={16} color={theme.iconColor} />
                <Text style={[styles.diseaseItemText, { color: theme.text }]}>
                  {disease.name}
                </Text>
              </Animated.View>
            ))}
          </View>
          
          <TouchableOpacity 
            style={[styles.viewMoreButton, { borderColor: theme.iconColor }]}
            onPress={() => router.push('/diseases')}
          >
            <Text style={[styles.viewMoreText, { color: theme.iconColor }]}>View Disease Guide</Text>
            <Ionicons name="arrow-forward" size={14} color={theme.iconColor} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  backgroundGradient: {
    flex: 1,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 0,
    zIndex: 1,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    paddingTop: 20,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.9,
    marginTop: 2,  // Reduced from 4 to 2
    textAlign: 'center',
  },
  themeToggle: {
    position: 'absolute',
    top: 45,
    right: 20,
    zIndex: 10,
  },
  themeToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 5,
  },
  visualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,  // Reduced from 20 to 15
  },
  visualGradient: {
    width: 110,  // Reduced from 120 to 110
    height: 110, // Reduced from 120 to 110
    borderRadius: 55, // Adjusted from 60 to 55
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  visualInner: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  leafIconContainer: {
    zIndex: 2,
    marginBottom: 5,  // Added slight margin to move leaf up
  },
  visualIcon: {
    opacity: 0.9,
  },
  pulseCircle: {
    position: 'absolute',
    width: 90,  // Reduced from 100 to 90
    height: 90, // Reduced from 100 to 90
    borderRadius: 45, // Adjusted from 50 to 45
    backgroundColor: '#fff',
    zIndex: 1,
  },
  visualText: {
    marginTop: 8,  // Reduced from 12 to 8
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  weatherContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  weatherGradient: {
    borderRadius: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  weatherCondition: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic'
  },
  weatherDataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weatherDataItem: {
    alignItems: 'center',
    flex: 1,
  },
  weatherValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 5,
  },
  weatherLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  infoContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '48%',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
  },
  buttonIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSubtext: {
    fontSize: 12,
    marginTop: 3,
  },
  diseaseInfoContainer: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  diseaseTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
  },
  diseaseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  diseaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  diseaseItemText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 5,
  },
});