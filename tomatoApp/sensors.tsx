import React, { useEffect, useState, useContext, createContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  useColorScheme
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';

// API endpoint
const API_BASE_URL = 'http://192.168.107.180:8000'; // Replace with your actual server IP

// Theme context
interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: Theme;
}

interface Theme {
  background: string;
  card: string;
  text: string;
  subtext: string;
  border: string;
  accent: string;
  gradientStart: string;
  gradientEnd: string;
}

const lightTheme: Theme = {
  background: '#f8f8f8',
  card: '#ffffff',
  text: '#333333',
  subtext: '#666666',
  border: '#e0e0e0',
  accent: '#d32f2f',
  gradientStart: '#d32f2f',
  gradientEnd: '#ff7043'
};

const darkTheme: Theme = {
  background: '#121212',
  card: '#1e1e1e',
  text: '#ffffff',
  subtext: '#b0b0b0',
  border: '#2c2c2c',
  accent: '#ff5252',
  gradientStart: '#752020',
  gradientEnd: '#9c3e2a'
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
  theme: lightTheme
});

// Define sensor data interface
interface SensorData {
  temperature: number | null;
  humidity: number | null;
  light_intensity: number | null;
  soil_moisture: number | null;
  timestamp?: string;
}

// Theme provider component
const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(deviceTheme === 'dark');

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themePreference');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };
    loadThemePreference();
  }, []);

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('themePreference', newMode ? 'dark' : 'light');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
const useTheme = () => useContext(ThemeContext);

// Main sensors screen component
export default function SensorsScreen() {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSensorData();
    const intervalId = setInterval(() => {
      fetchSensorData(false);
    }, 300000); // 5 minutes
    return () => clearInterval(intervalId);
  }, []);

  const fetchSensorData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await fetch(`${API_BASE_URL}/sensor_data`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch sensor data');
      const data = await response.json();
      if (data.status === 'available') {
        const newData = {
          temperature: data.data.temperature,
          humidity: data.data.humidity,
          light_intensity: data.data.light_intensity,
          soil_moisture: data.data.soil_moisture,
          timestamp: new Date().toISOString(),
        };
        setSensorData(newData);
      } else {
        setError('Sensor data currently unavailable');
      }
    } catch (err) {
      setError('Error connecting to server: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fetchSensorData(false);
  };

  return (
    <ThemeProvider>
      <AppContent 
        sensorData={sensorData}
        loading={loading}
        error={error}
        refreshing={refreshing}
        onRefresh={onRefresh}
        fetchSensorData={fetchSensorData}
      />
    </ThemeProvider>
  );
}

// App content with theme applied
const AppContent: React.FC<{
  sensorData: SensorData | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  onRefresh: () => void;
  fetchSensorData: (showLoading?: boolean) => Promise<void>;
}> = ({ 
  sensorData, 
  loading, 
  error, 
  refreshing, 
  onRefresh, 
  fetchSensorData
}) => {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  
  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent 
      />
      <ScrollView 
        style={[styles.scrollContainer, { backgroundColor: theme.background }]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[theme.accent]} 
            tintColor={theme.accent}
          />
        }
      >
        <LinearGradient
          colors={[theme.gradientStart, theme.gradientEnd]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.header}>
            <View style={styles.topRow}>
              <View style={styles.iconButtonPlaceholder} />
              
              <View style={styles.themeToggleContainer}>
                <TouchableOpacity onPress={toggleTheme}>
                  <Ionicons 
                    name="sunny" 
                    size={24} 
                    color={isDarkMode ? '#fff' : '#FFD700'} 
                    style={[styles.themeIcon, !isDarkMode && styles.activeIcon]} 
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleTheme}>
                  <Ionicons 
                    name="moon" 
                    size={24} 
                    color={isDarkMode ? '#FFD700' : '#fff'} 
                    style={[styles.themeIcon, isDarkMode && styles.activeIcon]} 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 800, easing: Easing.out(Easing.quad) }}
            >
              <Text style={styles.title}>Tomato Monitoring</Text>
              <Text style={styles.subtitle}>Live Growth Conditions</Text>
            </MotiView>
          </View>
        </LinearGradient>

        <View style={styles.contentContainer}>
          {loading && !refreshing ? (
            <LoadingView theme={theme} />
          ) : error ? (
            <ErrorView error={error} fetchSensorData={fetchSensorData} theme={theme} />
          ) : sensorData ? (
            <>
              <View style={styles.lastUpdatedContainer}>
                <Text style={[styles.lastUpdatedText, { color: theme.subtext }]}>
                  Last updated: {new Date().toLocaleTimeString()}
                </Text>
                <TouchableOpacity onPress={() => fetchSensorData()}>
                  <Ionicons name="refresh-outline" size={20} color={theme.subtext} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.sensorGrid}>
                <SensorCard
                  icon="thermometer-outline"
                  title="Temperature"
                  value={sensorData.temperature !== null ? `${sensorData.temperature}°C` : 'N/A'}
                  optimalRange="Optimal: 21-29°C"
                  status={getTomatoTemperatureStatus(sensorData.temperature)}
                  theme={theme}
                />
                <SensorCard
                  icon="water-outline"
                  title="Humidity"
                  value={sensorData.humidity !== null ? `${sensorData.humidity}%` : 'N/A'}
                  optimalRange="Optimal: 65-75%"
                  status={getTomatoHumidityStatus(sensorData.humidity)}
                  theme={theme}
                />
                <SensorCard
                  icon="sunny-outline"
                  title="Light"
                  value={sensorData.light_intensity !== null ? `${sensorData.light_intensity} lux` : 'N/A'}
                  optimalRange="Min: 6000 lux"
                  status={getTomatoLightStatus(sensorData.light_intensity)}
                  theme={theme}
                />
                <SensorCard
                  icon="leaf-outline"
                  title="Soil Moisture"
                  value={sensorData.soil_moisture !== null ? `${sensorData.soil_moisture}%` : 'N/A'}
                  optimalRange="Optimal: 60-80%"
                  status={getTomatoSoilMoistureStatus(sensorData.soil_moisture)}
                  theme={theme}
                />
              </View>
              
              <SummaryCard sensorData={sensorData} theme={theme} />
              
              <PlantHealthCard sensorData={sensorData} theme={theme} />
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Loading view component
const LoadingView: React.FC<{ theme: Theme }> = ({ theme }) => (
  <MotiView 
    from={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    style={styles.loadingContainer}
  >
    <ActivityIndicator size="large" color={theme.accent} />
    <Text style={[styles.loadingText, { color: theme.subtext }]}>Fetching sensor data...</Text>
  </MotiView>
);

// Error view component
const ErrorView: React.FC<{ error: string, fetchSensorData: () => void, theme: Theme }> = ({ error, fetchSensorData, theme }) => (
  <MotiView 
    from={{ opacity: 0, translateY: 20 }}
    animate={{ opacity: 1, translateY: 0 }}
    style={[styles.errorContainer, { backgroundColor: isDarkMode(theme) ? '#2c1c1c' : '#ffebee' }]}
  >
    <Ionicons name="warning-outline" size={40} color={theme.accent} />
    <Text style={[styles.errorText, { color: theme.accent }]}>{error}</Text>
    <TouchableOpacity 
      style={[styles.retryButton, { backgroundColor: theme.accent }]} 
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        fetchSensorData();
      }}
    >
      <Text style={styles.retryButtonText}>Retry</Text>
    </TouchableOpacity>
  </MotiView>
);

// Helper function to check if theme is dark
const isDarkMode = (theme: Theme) => theme.background === darkTheme.background;

// Summary card component with enhanced UI
const SummaryCard: React.FC<{ sensorData: SensorData, theme: Theme }> = ({ sensorData, theme }) => {
  const cardBackground = isDarkMode(theme) 
    ? { backgroundColor: 'rgba(30, 30, 30, 0.9)' } 
    : { backgroundColor: 'rgba(255, 255, 255, 0.9)' };
    
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 600, delay: 100 }}
      style={[styles.summaryCard, cardBackground, { borderColor: theme.border }]}
    >
      <View style={styles.summaryHeader}>
        <Ionicons name="nutrition-outline" size={22} color={theme.accent} />
        <Text style={[styles.summaryTitle, { color: theme.text }]}>Tomato Growing Conditions</Text>
      </View>
      <Text style={[styles.summaryText, { color: theme.subtext }]}>
        {getTomatoSummary(sensorData)}
      </Text>
      <View style={[styles.actionContainer, { backgroundColor: isDarkMode(theme) ? '#252525' : '#f9f9f9' }]}>
        {getTomatoActions(sensorData).map((action, index) => (
          <MotiView 
            key={index} 
            from={{ opacity: 0, translateX: -10 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 100 + (index * 100) }}
            style={styles.actionItem}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color={theme.accent} />
            <Text style={[styles.actionText, { color: theme.text }]}>{action}</Text>
          </MotiView>
        ))}
      </View>
    </MotiView>
  );
};

// Plant health score card
const PlantHealthCard: React.FC<{ sensorData: SensorData, theme: Theme }> = ({ sensorData, theme }) => {
  const calculateHealthScore = () => {
    let score = 100;
    let totalFactors = 0;
    
    if (sensorData.temperature !== null) {
      totalFactors++;
      const tempStatus = getTomatoTemperatureStatus(sensorData.temperature);
      if (tempStatus === "concern") score -= 25;
      else if (tempStatus === "acceptable") score -= 10;
    }
    
    if (sensorData.humidity !== null) {
      totalFactors++;
      const humidityStatus = getTomatoHumidityStatus(sensorData.humidity);
      if (humidityStatus === "concern") score -= 25;
      else if (humidityStatus === "acceptable") score -= 10;
    }
    
    if (sensorData.light_intensity !== null) {
      totalFactors++;
      const lightStatus = getTomatoLightStatus(sensorData.light_intensity);
      if (lightStatus === "concern") score -= 25;
      else if (lightStatus === "acceptable") score -= 10;
    }
    
    if (sensorData.soil_moisture !== null) {
      totalFactors++;
      const moistureStatus = getTomatoSoilMoistureStatus(sensorData.soil_moisture);
      if (moistureStatus === "concern") score -= 25;
      else if (moistureStatus === "acceptable") score -= 10;
    }
    
    return totalFactors > 0 ? Math.max(score, 0) : null;
  };
  
  const healthScore = calculateHealthScore();
  
  const getHealthColor = (score: number | null) => {
    if (score === null) return '#888888';
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFC107';
    return '#F44336';
  };
  
  const healthColor = getHealthColor(healthScore);
  
  const cardBackground = isDarkMode(theme) 
    ? { backgroundColor: 'rgba(30, 30, 30, 0.9)' } 
    : { backgroundColor: 'rgba(255, 255, 255, 0.9)' };
  
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 600, delay: 200 }}
      style={[styles.healthCard, cardBackground, { borderColor: theme.border }]}
    >
      <View style={styles.healthHeader}>
        <Ionicons name="pulse-outline" size={22} color={theme.accent} />
        <Text style={[styles.healthTitle, { color: theme.text }]}>Plant Health Status</Text>
      </View>
      
      <View style={styles.healthScoreContainer}>
        <View style={[styles.healthScoreCircle, { borderColor: healthColor }]}>
          <Text style={[styles.healthScoreText, { color: healthColor }]}>
            {healthScore !== null ? healthScore : '?'}
          </Text>
        </View>
        <View style={styles.healthInfoContainer}>
          <Text style={[styles.healthScoreLabel, { color: theme.text }]}>
            Health Score
          </Text>
          <Text style={[styles.healthDescription, { color: theme.subtext }]}>
            {healthScore !== null ? getHealthDescription(healthScore) : 'Insufficient data'}
          </Text>
        </View>
      </View>

      <View style={styles.healthFactorsContainer}>
        <Text style={[styles.healthFactorsTitle, { color: theme.subtext }]}>
          Growth Factors
        </Text>
        <View style={styles.healthFactorsList}>
          {renderHealthFactor('Temperature', sensorData.temperature, getTomatoTemperatureStatus, theme)}
          {renderHealthFactor('Humidity', sensorData.humidity, getTomatoHumidityStatus, theme)}
          {renderHealthFactor('Light', sensorData.light_intensity, getTomatoLightStatus, theme)}
          {renderHealthFactor('Soil', sensorData.soil_moisture, getTomatoSoilMoistureStatus, theme)}
        </View>
      </View>
    </MotiView>
  );
};

// Helper function to render health factors
const renderHealthFactor = (
  name: string, 
  value: number | null, 
  statusFn: (val: number | null) => string,
  theme: Theme
) => {
  const status = statusFn(value);
  let statusColor = '#888888';
  let statusIcon = 'help-circle-outline';
  
  if (status === 'optimal') {
    statusColor = '#4CAF50';
    statusIcon = 'checkmark-circle-outline';
  } else if (status === 'acceptable') {
    statusColor = '#FFC107';
    statusIcon = 'alert-circle-outline';
  } else if (status === 'concern') {
    statusColor = '#F44336';
    statusIcon = 'close-circle-outline';
  }
  
  return (
    <View style={styles.healthFactorItem}>
      <Text style={[styles.healthFactorName, { color: theme.text }]}>{name}</Text>
      <View style={styles.healthFactorStatus}>
        <Ionicons name={statusIcon as any} size={16} color={statusColor} />
        <Text style={[styles.healthFactorStatusText, { color: statusColor }]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
      </View>
    </View>
  );
};

// Get health description based on score
const getHealthDescription = (score: number) => {
  if (score >= 90) return 'Excellent growing conditions';
  if (score >= 80) return 'Very good conditions';
  if (score >= 70) return 'Good conditions with minor issues';
  if (score >= 60) return 'Average conditions - attention needed';
  if (score >= 50) return 'Below average - several issues';
  return 'Poor conditions - immediate action required';
};

interface SensorCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  optimalRange: string;
  status: string;
  theme: Theme;
}

// Redesigned sensor card to match the image
const SensorCard: React.FC<SensorCardProps> = ({ icon, title, value, optimalRange, status, theme }) => {
  // Define gradient colors based on title
  const getGradientColors = (): [string, string] => {
    switch (title.toLowerCase()) {
      case 'temperature':
        return ['#A52A2A', '#D2691E']; // Reddish-brown
      case 'humidity':
        return ['#1E90FF', '#4682B4']; // Blue
      case 'light':
        return ['#DAA520', '#B8860B']; // Gold
      case 'soil moisture':
        return ['#228B22', '#006400']; // Green
      default:
        return ['#666666', '#999999']; // Default gray
    }
  };

  const gradientColors = getGradientColors();
  const statusStyle = getStatusStyle(status);

  return (
    <MotiView 
      style={styles.sensorCardContainer}
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 500 }}
    >
      <LinearGradient
        colors={gradientColors}
        style={styles.sensorCard}
      >
        <View style={styles.sensorContent}>
          <View style={styles.sensorHeader}>
            <Ionicons name={icon} size={24} color="#fff" />
            <Text style={styles.sensorTitle}>{title}</Text>
          </View>
          <Text style={styles.sensorValue}>{value}</Text>
          <Text style={styles.sensorOptimalRange}>{optimalRange}</Text>
          {status !== "unknown" && (
            <TouchableOpacity style={[styles.statusButton, statusStyle]}>
              <Text style={styles.statusButtonText}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </MotiView>
  );
};

// Helper function to get status style
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'optimal':
      return { backgroundColor: '#4CAF50' };
    case 'acceptable':
      return { backgroundColor: '#FFC107' };
    case 'concern':
      return { backgroundColor: '#F44336' };
    default:
      return { backgroundColor: '#888888' };
  }
};

// Helper functions for tomato-specific status
const getTomatoTemperatureStatus = (temp: number | null) => {
  if (temp === null) return "unknown";
  if (temp >= 21 && temp <= 29) return "optimal";
  if (temp >= 18 && temp < 21 || temp > 29 && temp <= 32) return "acceptable";
  return "concern";
};

const getTomatoHumidityStatus = (humidity: number | null) => {
  if (humidity === null) return "unknown";
  if (humidity >= 65 && humidity <= 75) return "optimal";
  if (humidity >= 50 && humidity < 65 || humidity > 75 && humidity <= 85) return "acceptable";
  return "concern";
};

const getTomatoLightStatus = (light: number | null) => {
  if (light === null) return "unknown";
  if (light >= 6000 && light <= 20000) return "optimal";
  if (light > 20000) return "acceptable";
  return "concern";
};

const getTomatoSoilMoistureStatus = (moisture: number | null) => {
  if (moisture === null) return "unknown";
  if (moisture >= 60 && moisture <= 80) return "optimal";
  if (moisture >= 50 && moisture < 60) return "acceptable";
  return "concern";
};

// Generate tomato-specific summary based on sensor readings
const getTomatoSummary = (data: SensorData) => {
  const conditions = [];
  let overallStatus = "optimal";
  
  if (data.temperature !== null) {
    const tempStatus = getTomatoTemperatureStatus(data.temperature);
    if (tempStatus === "concern") {
      overallStatus = "concern";
      if (data.temperature < 18) conditions.push("temperature below ideal range");
      else if (data.temperature > 32) conditions.push("temperature too high");
    } else if (tempStatus === "acceptable" && overallStatus !== "concern") overallStatus = "acceptable";
  }
  
  if (data.humidity !== null) {
    const humidityStatus = getTomatoHumidityStatus(data.humidity);
    if (humidityStatus === "concern") {
      overallStatus = "concern";
      if (data.humidity < 50) conditions.push("humidity too low");
      else if (data.humidity > 85) conditions.push("humidity too high");
    } else if (humidityStatus === "acceptable" && overallStatus !== "concern") overallStatus = "acceptable";
  }
  
  if (data.light_intensity !== null) {
    const lightStatus = getTomatoLightStatus(data.light_intensity);
    if (lightStatus === "concern") {
      overallStatus = "concern";
      conditions.push("insufficient light");
    } else if (lightStatus === "acceptable" && overallStatus !== "concern") overallStatus = "acceptable";
  }
  
  if (data.soil_moisture !== null) {
    const moistureStatus = getTomatoSoilMoistureStatus(data.soil_moisture);
    if (moistureStatus === "concern") {
      overallStatus = "concern";
      if (data.soil_moisture < 50) conditions.push("soil too dry");
      else if (data.soil_moisture > 80) conditions.push("soil too wet");
    } else if (moistureStatus === "acceptable" && overallStatus !== "concern") overallStatus = "acceptable";
  }
  
  if (conditions.length === 0) {
    return overallStatus === "optimal" ? "Ideal conditions for tomato growth" : "Generally favorable conditions";
  }
  return `Attention needed: ${conditions.join(", ")}`;
};

// Generate tomato-specific action recommendations
const getTomatoActions = (data: SensorData) => {
  const actions = [];
  
  if (data.temperature !== null) {
    if (data.temperature < 18) actions.push("Increase temperature with covers");
    else if (data.temperature > 32) actions.push("Reduce heat with shade");
  }
  
  if (data.humidity !== null) {
    if (data.humidity < 50) actions.push("Increase humidity with misting");
    else if (data.humidity > 85) actions.push("Improve air circulation");
  }
  
  if (data.light_intensity !== null && data.light_intensity < 6000) {
    actions.push("Add grow lights");
  }
  
  if (data.soil_moisture !== null) {
    if (data.soil_moisture < 50) actions.push("Water more");
    else if (data.soil_moisture > 80) actions.push("Improve drainage");
  }
  
  if (actions.length === 0) actions.push("Maintain current conditions");
  return actions;
};

// Enhanced styles with support for both themes
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  headerGradient: {
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    padding: 25,
    alignItems: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  iconButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  themeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  themeIcon: {
    marginHorizontal: 8,
    opacity: 0.7,
  },
  activeIcon: {
    opacity: 1,
    transform: [{ scale: 1.2 }],
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  contentContainer: {
    padding: 15,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 15,
    marginVertical: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  lastUpdatedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  lastUpdatedText: {
    fontSize: 14,
  },
  sensorGrid: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 15,
  },
  sensorCardContainer: {
    width: '100%',
    marginBottom: 15,
  },
  sensorCard: {
    borderRadius: 15,
    padding: 15,
    height: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  sensorContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sensorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  sensorValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  sensorOptimalRange: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.7,
  },
  statusButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryCard: {
    borderRadius: 15,
    padding: 20,
    marginTop: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#fff',
  },
  summaryText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 10,
  },
  actionContainer: {
    marginTop: 10,
    borderRadius: 10,
    padding: 10,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
  },
  healthCard: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  healthTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#fff',
  },
  healthScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  healthScoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthScoreText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  healthInfoContainer: {
    flex: 1,
    marginLeft: 10,
  },
  healthScoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  healthDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  healthFactorsContainer: {
    marginTop: 10,
  },
  healthFactorsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 10,
  },
  healthFactorsList: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 10,
  },
  healthFactorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  healthFactorName: {
    fontSize: 14,
    color: '#fff',
  },
  healthFactorStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthFactorStatusText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
});