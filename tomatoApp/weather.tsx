import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar, ActivityIndicator, ScrollView, Alert, TextInput, Appearance, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import * as Location from 'expo-location';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

// Define the data structure for weather response
interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    condition: string;
    wind_kph: number;
    pressure_mb: number;
    precipitation_mm: number;
    data_source: string;
  };
  rainfall_history: number[];
  forecast_summary: {
    date: string;
    max_temp: number;
    min_temp: number;
    avg_humidity: number;
    chance_of_rain: number;
    condition: string;
  }[];
}

// Theme context for dark/light mode
const ThemeContext = React.createContext<'light' | 'dark'>('light');

export default function WeatherScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [inputLocation, setInputLocation] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(Appearance.getColorScheme() || 'light');
  const [refreshing, setRefreshing] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Sync theme with system preference
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => subscription.remove();
  }, []);

  // Function to get user's location
  const getUserLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        setLoading(false);
        return;
      }
      const locationData = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const geocode = await Location.reverseGeocodeAsync({
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
      });
      if (geocode.length > 0) {
        const address = geocode[0];
        const locationString = address.city || address.region || address.subregion || 'Current Location';
        setLocation(locationString);
        fetchWeatherDataFromAPI(locationString);
      } else {
        const coordsString = `${locationData.coords.latitude.toFixed(2)}, ${locationData.coords.longitude.toFixed(2)}`;
        setLocation(coordsString);
        fetchWeatherDataFromAPI(coordsString);
      }
    } catch (err) {
      console.error('Error getting location:', err);
      setError(`Location error: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };

  // New function to fetch weather data using only Weather API
  const fetchWeatherDataFromAPI = async (locationToUse: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://192.168.107.180:8000/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: locationToUse }),
      });
      if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
      const data = await response.json();
      
      // Ensure we're only using weather API data
      if (data.current.data_source === 'sensor') {
        throw new Error('Received sensor data instead of weather API data');
      }
      
      setWeatherData({
        current: {
          temperature: data.current.temperature,
          humidity: data.current.humidity,
          condition: data.current.condition,
          wind_kph: data.current.wind_kph,
          pressure_mb: data.current.pressure_mb,
          precipitation_mm: data.current.precipitation_mm,
          data_source: 'weather_api',
        },
        rainfall_history: data.rainfall_history,
        forecast_summary: data.forecast_summary,
      });
      setLocation(data.current.location_used || locationToUse);
    } catch (err) {
      setError(`Failed to fetch weather data: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle manual location search
  const handleLocationSearch = () => {
    if (inputLocation.trim() === '') {
      Alert.alert('Error', 'Please enter a location');
      return;
    }
    setShowLocationInput(false);
    fetchWeatherDataFromAPI(inputLocation.trim());
  };

  // Toggle location input visibility
  const toggleLocationInput = () => {
    setShowLocationInput(!showLocationInput);
    if (!showLocationInput && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = async () => {
    if (location) {
      setRefreshing(true);
      await fetchWeatherDataFromAPI(location);
      setRefreshing(false);
    }
  };

  // Function to determine weather icon based on condition
  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) return 'rainy';
    if (conditionLower.includes('cloud')) return 'cloud';
    if (conditionLower.includes('sun') || conditionLower.includes('clear')) return 'sunny';
    if (conditionLower.includes('snow')) return 'snow';
    if (conditionLower.includes('thunder') || conditionLower.includes('storm')) return 'thunderstorm';
    if (conditionLower.includes('fog') || conditionLower.includes('mist')) return 'cloud';
    return 'partly-sunny';
  };

  // Get extra weather description
  const getWeatherDescription = (condition: string, temperature: number) => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('rain')) {
      return temperature < 10 ? "Cold and rainy" : "Wet conditions";
    }
    if (conditionLower.includes('cloud')) {
      return temperature > 25 ? "Warm but cloudy" : "Overcast skies";
    }
    if (conditionLower.includes('sun') || conditionLower.includes('clear')) {
      return temperature > 30 ? "Hot and sunny" : "Clear skies";
    }
    if (conditionLower.includes('snow')) {
      return "Snowfall expected";
    }
    if (conditionLower.includes('thunder')) {
      return "Stormy conditions";
    }
    return "Mixed conditions";
  };

  // Dynamic gradient based on weather
  const getGradientColors = (): [string, string, ...string[]] => {
    if (!weatherData) return theme === 'light' ? ['#ff6f61', '#ff8a65', '#ffb74d'] : ['#b71c1c', '#d32f2f', '#e57373'];
    const condition = weatherData.current.condition.toLowerCase();
    if (condition.includes('rain') || condition.includes('drizzle'))
      return theme === 'light' ? ['#455a64', '#78909c', '#b0bec5'] : ['#263238', '#455a64', '#607d8b'];
    if (condition.includes('sun') || condition.includes('clear'))
      return theme === 'light' ? ['#1565C0', '#42a5f5', '#90CAF9'] : ['#0D47A1', '#1976D2', '#42a5f5'];
    if (condition.includes('cloud'))
      return theme === 'light' ? ['#546e7a', '#90a4ae', '#b0bec5'] : ['#37474f', '#546e7a', '#78909c'];
    if (condition.includes('snow'))
      return theme === 'light' ? ['#b0bec5', '#eceff1', '#ffffff'] : ['#90a4ae', '#b0bec5', '#cfd8dc'];
    if (condition.includes('thunder') || condition.includes('storm'))
      return theme === 'light' ? ['#3949ab', '#5c6bc0', '#7986cb'] : ['#1a237e', '#283593', '#3949ab'];
    return theme === 'light' ? ['#ff6f61', '#ff8a65', '#ffb74d'] : ['#b71c1c', '#d32f2f', '#e57373'];
  };

  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Enhanced tomato farming advice
  const getTomatoFarmingAdvice = () => {
    if (!weatherData) return [];
    const current = weatherData.current;
    const forecast = weatherData.forecast_summary || [];
    const advice = [];
  
    // Temperature-based advice
    if (current.temperature > 35) {
      advice.push({
        title: 'High Temperature Alert',
        icon: 'thermometer',
        content: 'Temperatures above 35°C can inhibit fruit set. Provide shade with cloth or netting and increase irrigation frequency.',
        critical: true,
      });
    } else if (current.temperature > 30) {
      advice.push({
        title: 'Warm Conditions',
        icon: 'thermometer-outline',
        content: 'Warm weather accelerates water loss. Water deeply in the morning and apply mulch to retain soil moisture.',
        critical: false,
      });
    } else if (current.temperature < 10) {
      advice.push({
        title: 'Cold Temperature Alert',
        icon: 'snow',
        content: 'Protect plants with frost covers or row covers. Avoid pruning to prevent stress.',
        critical: true,
      });
    } else if (current.temperature >= 20 && current.temperature <= 27) {
      advice.push({
        title: 'Optimal Temperature',
        icon: 'checkmark-circle-outline',
        content: 'Ideal conditions for tomato growth. Maintain consistent watering and fertilize with balanced nutrients.',
        critical: false,
      });
    } else if (current.temperature < 15) {
      advice.push({
        title: 'Cool Weather Caution',
        icon: 'thermometer-outline',
        content: 'Growth may slow below 15°C. Use cloches or plastic covers to trap heat around plants.',
        critical: false,
      });
    }
  
    // Humidity-based advice
    if (current.humidity > 85) {
      advice.push({
        title: 'High Humidity Warning',
        icon: 'water',
        content: 'Risk of fungal diseases like blight increases. Improve air circulation by pruning lower leaves and avoid overhead watering.',
        critical: true,
      });
    } else if (current.humidity < 40) {
      advice.push({
        title: 'Low Humidity Alert',
        icon: 'water-outline',
        content: 'Dry air can stress plants and reduce pollination. Mist leaves lightly in the morning and mulch to retain moisture.',
        critical: false,
      });
    } else if (current.humidity >= 60 && current.humidity <= 85) {
      advice.push({
        title: 'Good Humidity Levels',
        icon: 'water-outline',
        content: 'Humidity is ideal for tomato health. Monitor for pests like aphids that thrive in these conditions.',
        critical: false,
      });
    }
  
    // Wind-based advice
    if (current.wind_kph > 30) {
      advice.push({
        title: 'Strong Winds Warning',
        icon: 'speedometer',
        content: 'High winds can break stems and uproot plants. Install windbreaks (e.g., fences) and reinforce stakes or cages.',
        critical: true,
      });
    } else if (current.wind_kph > 15) {
      advice.push({
        title: 'Moderate Winds',
        icon: 'speedometer-outline',
        content: 'Moderate winds may dry out soil faster. Check stakes for stability and water as needed.',
        critical: false,
      });
    }
  
    // Rainfall-based advice
    if (current.precipitation_mm > 5) {
      advice.push({
        title: 'Heavy Rainfall Alert',
        icon: 'rainy',
        content: 'Excess water can lead to root rot and nutrient leaching. Ensure proper drainage and avoid additional irrigation.',
        critical: true,
      });
    } else if (current.precipitation_mm > 0 && current.precipitation_mm <= 5) {
      advice.push({
        title: 'Light Rain Benefits',
        icon: 'rainy-outline',
        content: 'Light rain is beneficial but check soil moisture. Supplement with irrigation if soil dries out quickly.',
        critical: false,
      });
    }
  
    // Forecast-based advice
    if (forecast.length > 0) {
      const tomorrow = forecast[0];
      if (tomorrow.chance_of_rain > 70) {
        advice.push({
          title: 'Rain Expected Tomorrow',
          icon: 'umbrella-outline',
          content: 'High rain chance tomorrow. Delay fertilization or pesticide application to prevent runoff.',
          critical: false,
        });
      }
      if (tomorrow.max_temp - tomorrow.min_temp > 15) {
        advice.push({
          title: 'Temperature Swing Ahead',
          icon: 'thermometer-outline',
          content: 'Large temperature swings can stress plants. Cover plants at night if frost is possible.',
          critical: false,
        });
      }
      // Check for prolonged wet conditions
      const wetDays = forecast.slice(0, 3).filter(day => day.chance_of_rain > 50).length;
      if (wetDays >= 3) {
        advice.push({
          title: 'Prolonged Wet Weather',
          icon: 'rainy',
          content: 'Multiple rainy days ahead increase disease risk. Apply preventive fungicide and improve drainage.',
          critical: true,
        });
      }
    }
  
    // Additional general advice
    if (current.pressure_mb < 1000) {
      advice.push({
        title: 'Low Pressure Warning',
        icon: 'speedometer-outline',
        content: 'Low pressure may indicate incoming storms. Secure plants and check for pest activity.',
        critical: false,
      });
    }
    advice.push({
      title: 'Pest Monitoring',
      icon: 'bug-outline',
      content: 'Inspect plants for pests like tomato hornworms or aphids, especially after rain or warm spells.',
      critical: false,
    });
    advice.push({
      title: 'Soil Health Tip',
      icon: 'leaf-outline',
      content: 'Test soil pH (aim for 6.0-6.8) and add compost if nutrients are low, especially after heavy rain.',
      critical: false,
    });
  
    // Fallback advice if no specific conditions are met
    if (advice.length === 0) {
      advice.push({
        title: 'General Tomato Care',
        icon: 'leaf-outline',
        content: 'Monitor for pests, ensure consistent watering, and maintain soil pH (6.0-6.8).',
        critical: false,
      });
    }
  
    return advice;
  };

  // Time of day greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <ThemeContext.Provider value={theme}>
      <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme === 'light' ? '#f5f5f5' : '#121212' }]}>
        <StatusBar barStyle="light-content" />
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme === 'light' ? '#1976D2' : '#42a5f5'}
            />
          }
        >
          <LinearGradient
            colors={getGradientColors()}
            style={styles.gradientHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={26} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                <Ionicons name={theme === 'light' ? 'moon' : 'sunny'} size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <Animated.View entering={FadeInDown.duration(500)} style={styles.headerContainer}>
              <View style={styles.glassContainer}>
                <Text style={styles.greeting}>{getTimeBasedGreeting()}</Text>
                {location && !showLocationInput ? (
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={20} color="#fff" />
                    <Text style={styles.locationText}>{location}</Text>
                    <TouchableOpacity onPress={toggleLocationInput} style={styles.searchButton}>
                      <Ionicons name="search" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  showLocationInput && (
                    <Animated.View entering={FadeIn.duration(300)} style={styles.searchInputContainer}>
                      <TextInput
                        ref={inputRef}
                        style={styles.searchInput}
                        placeholder="Enter location..."
                        placeholderTextColor="rgba(255,255,255,0.7)"
                        value={inputLocation}
                        onChangeText={setInputLocation}
                        returnKeyType="search"
                        onSubmitEditing={handleLocationSearch}
                        autoCapitalize="words"
                      />
                      <TouchableOpacity onPress={toggleLocationInput} style={styles.searchActionButton}>
                        <Ionicons name="close" size={22} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleLocationSearch} style={styles.searchActionButton}>
                        <Ionicons name="search" size={22} color="#fff" />
                      </TouchableOpacity>
                    </Animated.View>
                  )
                )}
              </View>
            </Animated.View>

            {/* Weather Display Panel (Only shown when we have data) */}
            {weatherData && (
              <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.weatherPanel}>
                <View style={styles.currentWeatherRow}>
                  <View style={styles.weatherIconContainer}>
                    <Ionicons 
                      name={getWeatherIcon(weatherData.current.condition)} 
                      size={90} 
                      color="#fff" 
                      style={styles.weatherIconShadow}
                    />
                  </View>
                  <View style={styles.temperatureContainer}>
                    <Text style={styles.temperatureValue}>
                      {weatherData.current.temperature.toFixed(1)}°
                    </Text>
                    <Text style={styles.conditionText}>
                      {weatherData.current.condition}
                    </Text>
                    <Text style={styles.weatherDescription}>
                      {getWeatherDescription(
                        weatherData.current.condition, 
                        weatherData.current.temperature
                      )}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailCol}>
                    <Ionicons name="water-outline" size={22} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.detailValue}>{weatherData.current.humidity}%</Text>
                    <Text style={styles.detailLabel}>Humidity</Text>
                  </View>
                  <View style={styles.detailSeparator} />
                  <View style={styles.detailCol}>
                    <Ionicons name="speedometer-outline" size={22} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.detailValue}>{weatherData.current.wind_kph} km/h</Text>
                    <Text style={styles.detailLabel}>Wind</Text>
                  </View>
                  <View style={styles.detailSeparator} />
                  <View style={styles.detailCol}>
                    <Ionicons name="rainy-outline" size={22} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.detailValue}>{weatherData.current.precipitation_mm} mm</Text>
                    <Text style={styles.detailLabel}>Rain</Text>
                  </View>
                </View>
              </Animated.View>
            )}
          </LinearGradient>

          {/* Location Selection */}
          {!location && !showLocationInput && !loading && (
            <Animated.View entering={FadeInDown.duration(500)} style={styles.locationPrompt}>
              <Text style={[styles.promptText, { color: theme === 'light' ? '#333' : '#eee' }]}>
                Where would you like to check the weather?
              </Text>
              <View style={styles.locationButtons}>
                <TouchableOpacity onPress={getUserLocation} style={styles.locationOptionButton}>
                  <LinearGradient
                    colors={theme === 'light' ? ['#1976D2', '#1565C0'] : ['#1565C0', '#0D47A1']}
                    style={styles.locationGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="locate" size={22} color="#fff" />
                    <Text style={styles.locationButtonText}>Current Location</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleLocationInput} style={styles.locationOptionButton}>
                  <LinearGradient
                    colors={theme === 'light' ? ['#4CAF50', '#2E7D32'] : ['#388E3C', '#1B5E20']}
                    style={styles.locationGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="search" size={22} color="#fff" />
                    <Text style={styles.locationButtonText}>Search Location</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* Main Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme === 'light' ? '#1976D2' : '#42a5f5'} />
              <Text style={[styles.loadingText, { color: theme === 'light' ? '#666' : '#bbb' }]}>
                {location ? 'Updating Weather Data...' : 'Getting Your Location...'}
              </Text>
            </View>
          ) : error ? (
            <View style={[styles.errorContainer, { backgroundColor: theme === 'light' ? '#fff' : '#1e1e1e' }]}>
              <Ionicons name="cloud-offline" size={60} color={theme === 'light' ? '#1976D2' : '#42a5f5'} />
              <Text style={[styles.errorText, { color: theme === 'light' ? '#666' : '#bbb' }]}>{error}</Text>
              <TouchableOpacity 
                style={[styles.retryButton, { backgroundColor: theme === 'light' ? '#1976D2' : '#1565C0' }]} 
                onPress={() => location ? fetchWeatherDataFromAPI(location) : null}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : !location && !weatherData ? (
            <View style={styles.placeholderContainer}>
              <Ionicons name="partly-sunny-outline" size={100} color={theme === 'light' ? '#1976D2' : '#42a5f5'} opacity={0.2} />
            </View>
          ) : weatherData ? (
            <>
              {/* Forecast */}
              {weatherData.forecast_summary && weatherData.forecast_summary.length > 0 && (
                <Animated.View 
                  entering={FadeInDown.delay(300).duration(500)}
                  style={[styles.forecastCard, { backgroundColor: theme === 'light' ? '#fff' : '#1e1e1e' }]}
                >
                  <Text style={[styles.cardTitle, { color: theme === 'light' ? '#333' : '#eee' }]}>5-Day Forecast</Text>
                  <View style={styles.forecastGrid}>
                    {weatherData.forecast_summary.slice(0, 5).map((day, index) => (
                      <View key={index} style={[styles.forecastDay, 
                        { backgroundColor: theme === 'light' ? '#f7f7f7' : '#262626' }]}
                      >
                        <Text style={[styles.forecastDate, { color: theme === 'light' ? '#1976D2' : '#42a5f5' }]}>
                          {formatDate(day.date)}
                        </Text>
                        
                        <View style={styles.forecastIconRow}>
                          <Ionicons 
                            name={getWeatherIcon(day.condition)} 
                            size={28} 
                            color={theme === 'light' ? '#1976D2' : '#42a5f5'} 
                          />
                          <Text style={[styles.rainChance, { color: theme === 'light' ? '#1976D2' : '#42a5f5' }]}>
                            {day.chance_of_rain}%
                          </Text>
                        </View>
                        
                        <View style={styles.tempRow}>
                          <Text style={[styles.maxTemp, { color: theme === 'light' ? '#333' : '#eee' }]}>
                            {day.max_temp.toFixed(0)}°
                          </Text>
                          <View style={[styles.tempBar, { backgroundColor: theme === 'light' ? '#e0e0e0' : '#444' }]}>
                            <View 
                              style={[
                                styles.tempFill, 
                                { 
                                  width: `${(day.max_temp - day.min_temp) / 40 * 100}%`,
                                  backgroundColor: theme === 'light' ? '#1976D2' : '#42a5f5' 
                                }
                              ]} 
                            />
                          </View>
                          <Text style={[styles.minTemp, { color: theme === 'light' ? '#666' : '#aaa' }]}>
                            {day.min_temp.toFixed(0)}°
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </Animated.View>
              )}

              {/* Farming Advice */}
              <Animated.View 
                entering={FadeInDown.delay(400).duration(500)}
                style={[styles.adviceCard, { backgroundColor: theme === 'light' ? '#fff' : '#1e1e1e' }]}
              >
                <Text style={[styles.cardTitle, { color: theme === 'light' ? '#333' : '#eee' }]}>
                  Tomato Farming Tips
                </Text>
                {getTomatoFarmingAdvice().map((advice, index) => (
                  <Animated.View 
                    key={index} 
                    entering={FadeInDown.delay(400 + index * 100).duration(500)}
                    style={[
                      styles.adviceItem, 
                      { 
                        backgroundColor: theme === 'light' ? '#f7f7f7' : '#262626',
                        borderLeftColor: advice.critical 
                          ? (theme === 'light' ? '#f44336' : '#e57373') 
                          : (theme === 'light' ? '#4CAF50' : '#81C784')
                      }
                    ]}
                  >
                    <Ionicons 
                      name={advice.icon as any} 
                      size={28} 
                      color={advice.critical 
                        ? (theme === 'light' ? '#f44336' : '#e57373') 
                        : (theme === 'light' ? '#4CAF50' : '#81C784')
                      } 
                    />
                    <View style={styles.adviceContent}>
                      <Text 
                        style={[
                          styles.adviceTitle, 
                          { color: theme === 'light' ? '#333' : '#eee' }
                        ]}
                      >
                        {advice.title}
                      </Text>
                      <Text 
                        style={[
                          styles.adviceText, 
                          { color: theme === 'light' ? '#666' : '#bbb' }
                        ]}
                      >
                        {advice.content}
                      </Text>
                    </View>
                  </Animated.View>
                ))}
              </Animated.View>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  iconButton: {
    padding: 8,
  },
  headerContainer: {
    marginBottom: 15,
  },
  glassContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  searchButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  searchInput: {
    flex: 1,
    height: 45,
    color: '#fff',
    fontSize: 16,
  },
  searchActionButton: {
    padding: 8,
  },
  weatherPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  currentWeatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  weatherIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  weatherIconShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  temperatureContainer: {
    flex: 1,
  },
  temperatureValue: {
    fontSize: 72,
    fontWeight: '200',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  conditionText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  weatherDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  detailsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
  },
  detailCol: {
    flex: 1,
    alignItems: 'center',
  },
  detailSeparator: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  locationPrompt: {
    margin: 20,
    alignItems: 'center',
  },
  promptText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  locationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 400,
  },
  locationOptionButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  locationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  forecastCard: {
    margin: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  forecastGrid: {
    gap: 10,
  },
  forecastDay: {
    padding: 15,
    borderRadius: 10,
  },
  forecastDate: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  forecastIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rainChance: {
    fontSize: 14,
    fontWeight: '500',
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  maxTemp: {
    fontSize: 16,
    fontWeight: '600',
  },
  tempBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  tempFill: {
    height: '100%',
    borderRadius: 3,
  },
  minTemp: {
    fontSize: 16,
  },
  adviceCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  adviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  adviceContent: {
    flex: 1,
    marginLeft: 15,
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  adviceText: {
    fontSize: 14,
    lineHeight: 20,
  },
});