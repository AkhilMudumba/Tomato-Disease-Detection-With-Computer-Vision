import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, SafeAreaView, StatusBar, Animated, useColorScheme } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useEffect, useState, useRef } from 'react';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import AnimatedReanimated, { useAnimatedStyle, useSharedValue, withTiming, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;

export default function DiseaseDetails() {
  const systemColorScheme = useColorScheme(); // System theme (light or dark)
  const [theme, setTheme] = useState(systemColorScheme); // Manual theme override
  const route = useRoute();
  const { result } = route.params as { result: any };
  const [analysisImage, setAnalysisImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Animation setup
  const fadeAnim = useSharedValue(0);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

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

  // Bounce animation for leaf
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [bounceAnim]);

  // Fade-in animation and initial setup
  useEffect(() => {
    if (result.analysis_image) {
      const imageUri = `data:image/jpeg;base64,${result.analysis_image}`;
      setAnalysisImage(imageUri);
    }
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setPermissionGranted(status === 'granted');
    })();
    fadeAnim.value = withTiming(1, { duration: 800 });
  }, [result.analysis_image]);

  // Interpolate animation values
  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });
  const bounceTranslateY = bounceAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  const saveImage = async () => {
    if (!analysisImage) return;
    try {
      setSaving(true);
      if (!permissionGranted) {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Permission to access media library is required to save images');
          setSaving(false);
          return;
        }
        setPermissionGranted(true);
      }
      const base64Data = analysisImage.split(',')[1] || analysisImage;
      const fileName = `tomato_disease_${result.detection.disease.replace(/\s+/g, '_')}_${new Date().getTime()}.jpg`;
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, base64Data, { encoding: FileSystem.EncodingType.Base64 });
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync('TomatoDoc', asset, false);
      Alert.alert('Success', 'Image saved to gallery');
    } catch (error) {
      Alert.alert('Error', 'Failed to save image');
    } finally {
      setSaving(false);
    }
  };

  const shareImage = async () => {
    if (!analysisImage) return;
    try {
      setSaving(true);
      const base64Data = analysisImage.split(',')[1] || analysisImage;
      const fileName = `tomato_disease_analysis.jpg`;
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, base64Data, { encoding: FileSystem.EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on your device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share image');
    } finally {
      setSaving(false);
    }
  };

  // Theme toggle function
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const formatSeverityAsPercentage = () => {
    if (typeof result.detection.severity === 'string') {
      const match = result.detection.severity.match(/(\d+\.?\d*)%/);
      if (match && match[1]) return `${parseFloat(match[1]).toFixed(1)}%`;
      const severityMap: { [key: string]: number } = { 'low': 25, 'medium': 50, 'high': 75, 'very high': 90, 'critical': 100 };
      const lowerSeverity = result.detection.severity.toLowerCase();
      for (const [key, value] of Object.entries(severityMap)) {
        if (lowerSeverity.includes(key)) return `${value.toFixed(1)}%`;
      }
      return result.detection.severity;
    } else if (typeof result.detection.severity === 'number') {
      return `${result.detection.severity.toFixed(1)}%`;
    }
    return result.detection.severity || 'N/A';
  };

  const formatDiseaseRiskAsPercentage = () => {
    if (typeof result.environment?.disease_risk_level === 'number') {
      return `${(result.environment.disease_risk_level * 100).toFixed(1)}%`;
    } else if (typeof result.environment?.disease_risk_level === 'string') {
      const percentMatch = result.environment.disease_risk_level.match(/(\d+\.?\d*)%/);
      if (percentMatch && percentMatch[1]) return `${parseFloat(percentMatch[1]).toFixed(1)}%`;
      const riskMap: { [key: string]: number } = { 'low': 25, 'medium': 50, 'high': 75, 'very high': 90, 'critical': 100 };
      const lowerRisk = result.environment.disease_risk_level.toLowerCase();
      for (const [key, value] of Object.entries(riskMap)) {
        if (lowerRisk.includes(key)) return `${value.toFixed(1)}%`;
      }
    }
    return result.environment?.disease_risk_level || 'N/A';
  };

  const getSeverityColor = () => {
    const severity = formatSeverityAsPercentage();
    const percentage = parseFloat(severity);
    if (isNaN(percentage)) return theme === 'dark' ? '#ff8a65' : '#ff7043';
    if (percentage < 30) return theme === 'dark' ? '#ff8a65' : '#ff7043';
    if (percentage < 60) return theme === 'dark' ? '#ef5350' : '#f44336';
    return theme === 'dark' ? '#e53935' : '#d32f2f';
  };

  const styles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={theme === 'dark' ? ['#7f0000', '#b71c1c', '#d32f2f'] : ['#d32f2f', '#f44336', '#ff7043']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedReanimated.View style={[styles.headerContainer, headerAnimatedStyle]}>
          <View style={styles.tomatoIconContainer}>
            <Animated.View style={{ transform: [{ translateY: bounceTranslateY }] }}>
              <Ionicons name="leaf" size={50} color="#fff" style={styles.visualIcon} />
            </Animated.View>
            <Animated.View
              style={[
                styles.pulseCircle,
                { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
              ]}
            />
          </View>
          <Text style={styles.title}>Tomato Leaf Analysis</Text>
          <View style={styles.diseaseBadge}>
            <Text style={styles.diseaseName}>{result.detection.disease || 'Unknown'}</Text>
          </View>
          <TouchableOpacity style={styles.themeToggleButton} onPress={toggleTheme}>
            <Ionicons
              name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </AnimatedReanimated.View>

        {analysisImage && (
          <AnimatedReanimated.View entering={FadeInDown.delay(200).duration(800)}>
            <View style={styles.imageInfoContainer}>
              <View style={styles.imageInfoLeft}>
                <Ionicons name="image-outline" size={32} color={theme === 'dark' ? '#ef5350' : '#d32f2f'} />
                <Text style={styles.imageInfoText}>Analysis Image</Text>
              </View>
              <View style={styles.imageActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={saveImage}
                  disabled={saving}
                >
                  <LinearGradient
                    colors={['#FF6347', '#FF4500']}
                    style={styles.buttonGradient}
                  >
                    <Ionicons name="download-outline" size={22} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={shareImage}
                  disabled={saving}
                >
                  <LinearGradient
                    colors={['#FF6347', '#FF4500']}
                    style={styles.buttonGradient}
                  >
                    <Ionicons name="share-social-outline" size={22} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              {saving && (
                <View style={styles.loadingOverlaySmall}>
                  <ActivityIndicator size="small" color={theme === 'dark' ? '#ef5350' : '#d32f2f'} />
                </View>
              )}
            </View>
          </AnimatedReanimated.View>
        )}

        <AnimatedReanimated.View entering={FadeInDown.delay(300).duration(800)} style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Ionicons name="medical" size={22} color="#FF4500" />
            <Text style={styles.metricLabel}>Severity</Text>
            <Text style={[styles.metricValue, { color: getSeverityColor() }]}>{formatSeverityAsPercentage()}</Text>
            <LinearGradient
              colors={theme === 'dark' ? ['#ff8a65', '#e53935'] : ['#ff7043', '#d32f2f']}
              style={[styles.severityBar, { width: `${Math.min(parseFloat(formatSeverityAsPercentage()) || 0, 100)}%` }]}
            />
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricBox}>
              <Ionicons name="analytics-outline" size={20} color="#FF4500" />
              <Text style={styles.boxLabel}>Confidence</Text>
              <Text style={styles.boxValue}>
                {result.detection.confidence ? (result.detection.confidence * 100).toFixed(1) + '%' : 'N/A'}
              </Text>
            </View>

            {result.detection.affected_area_percentage !== undefined && (
              <View style={styles.metricBox}>
                <Ionicons name="scan-outline" size={20} color="#FF4500" />
                <Text style={styles.boxLabel}>Affected Area</Text>
                <Text style={styles.boxValue}>{result.detection.affected_area_percentage.toFixed(1)}%</Text>
              </View>
            )}
          </View>
        </AnimatedReanimated.View>

        {result.detection.severity_description && (
          <AnimatedReanimated.View entering={FadeInDown.delay(400).duration(800)} style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle-outline" size={22} color={theme === 'dark' ? '#ef5350' : '#d32f2f'} />
              <Text style={styles.cardTitle}>Severity Assessment</Text>
            </View>
            <Text style={styles.description}>{result.detection.severity_description}</Text>
          </AnimatedReanimated.View>
        )}

        {result.environment && (
          <AnimatedReanimated.View entering={FadeInDown.delay(500).duration(800)} style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="thermometer-outline" size={22} color={theme === 'dark' ? '#ef5350' : '#d32f2f'} />
              <Text style={styles.cardTitle}>Grow Conditions</Text>
            </View>

            <View style={styles.environmentGrid}>
              <View style={styles.envItem}>
                <Ionicons name="thermometer-outline" size={22} color={theme === 'dark' ? '#ef5350' : '#d32f2f'} />
                <Text style={styles.envValue}>{result.environment.temperature ? `${result.environment.temperature}°C` : 'N/A'}</Text>
                <Text style={styles.envLabel}>Temperature</Text>
              </View>

              <View style={styles.envItem}>
                <Ionicons name="water-outline" size={22} color={theme === 'dark' ? '#ef5350' : '#d32f2f'} />
                <Text style={styles.envValue}>{result.environment.humidity ? `${result.environment.humidity}%` : 'N/A'}</Text>
                <Text style={styles.envLabel}>Humidity</Text>
              </View>

              <View style={styles.envItem}>
                <Ionicons name="rainy-outline" size={22} color={theme === 'dark' ? '#ef5350' : '#d32f2f'} />
                <Text style={styles.envValue}>{result.environment.avg_rainfall_past_3days ? `${result.environment.avg_rainfall_past_3days.toFixed(1)}mm` : 'N/A'}</Text>
                <Text style={styles.envLabel}>Recent Rainfall</Text>
              </View>

              <View style={styles.envItem}>
                <Ionicons name="warning-outline" size={22} color={theme === 'dark' ? '#ef5350' : '#d32f2f'} />
                <Text style={styles.envValue}>{formatDiseaseRiskAsPercentage()}</Text>
                <Text style={styles.envLabel}>Disease Risk</Text>
              </View>
            </View>
          </AnimatedReanimated.View>
        )}

        {result.recommendations && (
          <AnimatedReanimated.View entering={FadeInDown.delay(600).duration(800)}>
            <View style={styles.treatmentHeader}>
              <Ionicons name="medkit-outline" size={24} color="#fff" />
              <Text style={styles.treatmentTitle}>Treatment Plan</Text>
            </View>

            {result.recommendations.treatments && (
              <View style={styles.recommendationCard}>
                <View style={styles.recommendationHeader}>
                  <Ionicons name="flask-outline" size={20} color={theme === 'dark' ? '#ef5350' : '#d32f2f'} />
                  <Text style={styles.recommendationTitle}>Chemical Treatments</Text>
                </View>
                {result.recommendations.treatments.map((treatment: string, index: number) => (
                  <Text key={`treatment-${index}`} style={styles.bulletPoint}>• {treatment}</Text>
                ))}
              </View>
            )}

            {result.recommendations.organic_treatments && (
              <View style={styles.recommendationCard}>
                <View style={styles.recommendationHeader}>
                  <Ionicons name="leaf-outline" size={20} color={theme === 'dark' ? '#ef5350' : '#d32f2f'} />
                  <Text style={styles.recommendationTitle}>Organic Solutions</Text>
                </View>
                {result.recommendations.organic_treatments.map((treatment: string, index: number) => (
                  <Text key={`organic-${index}`} style={styles.bulletPoint}>• {treatment}</Text>
                ))}
              </View>
            )}

            {result.recommendations.preventive_measures && (
              <View style={styles.recommendationCard}>
                <View style={styles.recommendationHeader}>
                  <Ionicons name="shield-outline" size={20} color={theme === 'dark' ? '#ef5350' : '#d32f2f'} />
                  <Text style={styles.recommendationTitle}>Prevention</Text>
                </View>
                {result.recommendations.preventive_measures.map((measure: string, index: number) => (
                  <Text key={`preventive-${index}`} style={styles.bulletPoint}>• {measure}</Text>
                ))}
              </View>
            )}

            {result.recommendations.environmental_management && (
              <View style={styles.recommendationCard}>
                <View style={styles.recommendationHeader}>
                  <Ionicons name="globe-outline" size={20} color={theme === 'dark' ? '#ef5350' : '#d32f2f'} />
                  <Text style={styles.recommendationTitle}>Environmental Management</Text>
                </View>
                {result.recommendations.environmental_management.map((tip: string, index: number) => (
                  <Text key={`env-${index}`} style={styles.bulletPoint}>• {tip}</Text>
                ))}
              </View>
            )}

            {result.recommendations.treatment_schedule && (
              <View style={styles.recommendationCard}>
                <View style={styles.recommendationHeader}>
                  <Ionicons name="calendar-outline" size={20} color={theme === 'dark' ? '#ef5350' : '#d32f2f'} />
                  <Text style={styles.recommendationTitle}>Application Schedule</Text>
                </View>
                <Text style={styles.description}>{result.recommendations.treatment_schedule}</Text>
              </View>
            )}
          </AnimatedReanimated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  scrollContainer: {
    paddingTop: STATUSBAR_HEIGHT + 20,
    paddingHorizontal: 16,
    paddingBottom: 50,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  tomatoIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 90,
    backgroundColor: '#ff7043',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  visualIcon: {
    opacity: 0.9,
    zIndex: 1,
  },
  pulseCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  diseaseBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  diseaseName: {
    color: '#d32f2f',
    fontWeight: 'bold',
    fontSize: 16,
  },
  themeToggleButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
  },
  imageInfoContainer: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#FFF3F3',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  imageInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageInfoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '600',
  },
  imageActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 8,
    borderRadius: 50,
    overflow: 'hidden',
  },
  buttonGradient: {
    padding: 8,
  },
  metricsContainer: {
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: '#FFF3F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricBox: {
    width: '48%',
    backgroundColor: '#FFF3F3',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  metricLabel: {
    color: '#333',
    fontSize: 14,
    marginTop: 6,
    marginBottom: 4,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  severityBar: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  boxLabel: {
    color: '#333',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 2,
    fontWeight: '600',
  },
  boxValue: {
    color: '#d32f2f',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsCard: {
    backgroundColor: '#FFF3F3',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  environmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  envItem: {
    width: '48%',
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  envLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  envValue: {
    color: '#d32f2f',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  treatmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingLeft: 8,
  },
  treatmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  recommendationCard: {
    backgroundColor: '#FFF3F3',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  recommendationTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    paddingLeft: 8,
    lineHeight: 20,
  },
  loadingOverlaySmall: {
    position: 'absolute',
    right: 60,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
});

const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  scrollContainer: {
    paddingTop: STATUSBAR_HEIGHT + 20,
    paddingHorizontal: 16,
    paddingBottom: 50,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  tomatoIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 90,
    backgroundColor: '#b71c1c',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  visualIcon: {
    opacity: 0.9,
    zIndex: 1,
  },
  pulseCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#424242',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  diseaseBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#424242',
    borderRadius: 30,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  diseaseName: {
    color: '#ff7043',
    fontWeight: 'bold',
    fontSize: 16,
  },
  themeToggleButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
  },
  imageInfoContainer: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  imageInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageInfoText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
    fontWeight: '600',
  },
  imageActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 8,
    borderRadius: 50,
    overflow: 'hidden',
  },
  buttonGradient: {
    padding: 8,
  },
  metricsContainer: {
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricBox: {
    width: '48%',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  metricLabel: {
    color: '#fff',
    fontSize: 14,
    marginTop: 6,
    marginBottom: 4,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  severityBar: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  boxLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 2,
    fontWeight: '600',
  },
  boxValue: {
    color: '#ff7043',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#b0b0b0',
    lineHeight: 20,
  },
  environmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  envItem: {
    width: '48%',
    padding: 12,
    backgroundColor: '#2c2c2c',
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  envLabel: {
    color: '#b0b0b0',
    fontSize: 12,
    marginTop: 4,
  },
  envValue: {
    color: '#ff7043',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  treatmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingLeft: 8,
  },
  treatmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  recommendationCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  recommendationTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#b0b0b0',
    marginBottom: 6,
    paddingLeft: 8,
    lineHeight: 20,
  },
  loadingOverlaySmall: {
    position: 'absolute',
    right: 60,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
});