import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Using Expo icons

interface Disease {
  id: string;
  name: string;
  symptoms: string;
  causes: string;
  treatment: string;
  prevention: string;
  iconName: string; // Add icon name property
}

interface ThemeColors {
  primary: string;
  background: string;
  card: string;
  text: string;
  subText: string;
  headerText: string;
  infoBackground: string;
  cardBorder: string;
  iconBackground: string;
}

const tomatoDiseases: Disease[] = [
  {
    id: '1',
    name: 'Target Spot',
    symptoms: 'Concentric rings of brown spots on leaves, stems and fruits. Lesions may develop a shot-hole appearance.',
    causes: 'Fungus (Corynespora cassiicola) that thrives in warm, humid conditions.',
    treatment: 'Remove infected plant parts. Apply fungicides labeled for target spot control.',
    prevention: 'Proper spacing for air circulation, avoid overhead watering, crop rotation.',
    iconName: 'radio-button-on',
  },
  {
    id: '2',
    name: 'Tomato Mosaic Virus',
    symptoms: 'Mottled light/dark green pattern on leaves, stunted growth, leaf distortion, yellow streaking.',
    causes: 'Virus spread through infected seeds, transplants, and human handling.',
    treatment: 'No cure. Remove and destroy infected plants.',
    prevention: 'Use virus-free seeds, resistant varieties, wash hands and tools, control weeds.',
    iconName: 'bug',
  },
  {
    id: '3',
    name: 'Tomato Yellow Leaf Curl Virus',
    symptoms: 'Yellowing and upward curling of leaves, stunted growth, flowers drop without producing fruit.',
    causes: 'Virus transmitted by whiteflies.',
    treatment: 'No cure. Remove infected plants and control whitefly populations.',
    prevention: 'Use resistant varieties, install reflective mulches, control whiteflies, use insect nets.',
    iconName: 'leaf',
  },
  {
    id: '4',
    name: 'Bacterial Spot',
    symptoms: 'Small, dark, water-soaked spots on leaves and fruits that become scabby. Severe infections cause leaf yellowing and drop.',
    causes: 'Bacteria (Xanthomonas spp.) spread by water splash and contaminated tools.',
    treatment: 'Copper-based sprays, remove infected plants. No cure once established.',
    prevention: 'Use disease-free seeds, rotate crops, avoid overhead irrigation, disinfect garden tools.',
    iconName: 'apps',
  },
  {
    id: '5',
    name: 'Early Blight',
    symptoms: 'Dark brown spots with concentric rings on lower/older leaves. Affected leaves turn yellow and fall off.',
    causes: 'Fungus (Alternaria solani) that survives in soil, infected debris, and some solanaceous weeds.',
    treatment: 'Remove infected leaves. Apply approved fungicides. Improve air circulation.',
    prevention: 'Crop rotation, adequate plant spacing, avoid overhead watering, use resistant varieties.',
    iconName: 'leaf-outline',
  },
  {
    id: '6',
    name: 'Healthy',
    symptoms: 'Vibrant green leaves, strong stem, normal growth patterns, no visible spots or discoloration.',
    causes: 'N/A - This is the ideal state of a tomato plant.',
    treatment: 'N/A - Continue proper care practices.',
    prevention: 'Regular watering, appropriate fertilization, good air circulation, pest monitoring.',
    iconName: 'checkmark-circle',
  },
  {
    id: '7',
    name: 'Late Blight',
    symptoms: 'Water-soaked spots on leaves turning to brown lesions. White fuzzy growth on leaf undersides. Rapid plant death.',
    causes: 'Fungus-like organism (Phytophthora infestans) favoring cool, wet conditions.',
    treatment: 'Remove infected plants immediately. Apply copper-based fungicides preventatively.',
    prevention: 'Plant resistant varieties, provide proper spacing, avoid overhead irrigation, destroy plant debris.',
    iconName: 'water',
  },
  {
    id: '8',
    name: 'Leaf Mold',
    symptoms: 'Yellow patches on upper leaf surfaces with olive-green to grayish-brown fuzzy growth on undersides.',
    causes: 'Fungus (Passalora fulva) thriving in high humidity and moderate temperatures.',
    treatment: 'Improve air circulation, apply fungicides, remove infected leaves.',
    prevention: 'Maintain lower humidity, adequate plant spacing, avoid wetting foliage, use resistant varieties.',
    iconName: 'cloudy',
  },
  {
    id: '9',
    name: 'Septoria Leaf Spot',
    symptoms: 'Small circular spots with dark borders and light centers on lower leaves. Tiny black dots (fruiting bodies) in center of spots.',
    causes: 'Fungus (Septoria lycopersici) that overwinters in plant debris.',
    treatment: 'Remove infected leaves, apply fungicides, improve air circulation.',
    prevention: 'Crop rotation, mulching, avoid wetting foliage, clean garden tools.',
    iconName: 'scan-circle',
  },
  {
    id: '10',
    name: 'Spider Mites/Two Spotted Spider Mite',
    symptoms: 'Tiny yellow or white speckles on leaves, fine webbing on undersides of leaves, leaves turn yellow and dry out.',
    causes: 'Tiny spider-like pests (Tetranychus urticae) that thrive in hot, dry conditions.',
    treatment: 'Spray plants with water to dislodge mites, apply insecticidal soap or miticide.',
    prevention: 'Maintain humidity, regular misting, introduce predatory mites, avoid drought stress.',
    iconName: 'disc',
  }
];

const TomatoDiseaseScreen: React.FC = () => {
  const systemTheme = useColorScheme();
  const [darkMode, setDarkMode] = useState(systemTheme === 'dark');
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Define theme colors
  const theme: ThemeColors = darkMode ? {
    primary: '#E53935', // Slightly lighter red for dark mode
    background: '#121212',
    card: '#1E1E1E',
    text: '#E0E0E0',
    subText: '#AAAAAA',
    headerText: 'white',
    infoBackground: '#2C1C1C',
    cardBorder: '#E53935',
    iconBackground: '#2C1C1C',
  } : {
    primary: '#D32F2F',
    background: '#F8F8F8',
    card: 'white',
    text: '#333333',
    subText: '#666666',
    headerText: 'white',
    infoBackground: '#FFEBEE',
    cardBorder: '#D32F2F',
    iconBackground: '#FFEBEE',
  };

  const handleDiseasePress = (disease: Disease) => {
    setSelectedDisease(disease);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <View style={styles.headerContent}>
          <Ionicons name="nutrition" size={32} color="white" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Tomato Diseases</Text>
            <Text style={styles.headerSubtitle}>Identify and treat common issues</Text>
          </View>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          <Ionicons name={darkMode ? "sunny" : "moon"} size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.infoCard, { backgroundColor: theme.infoBackground, borderLeftColor: theme.primary }]}>
          <Ionicons name="information-circle" size={24} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.text }]}>Tap on any disease to learn more about symptoms, causes, and treatments.</Text>
        </View>

        {tomatoDiseases.map((disease) => (
          <TouchableOpacity
            key={disease.id}
            style={[styles.diseaseCard, { 
              backgroundColor: theme.card, 
              borderLeftColor: theme.cardBorder,
              shadowColor: darkMode ? '#000' : '#000',
            }]}
            onPress={() => handleDiseasePress(disease)}
            activeOpacity={0.7}
          >
            <View style={styles.diseaseCardContent}>
              <View style={[styles.iconContainer, { backgroundColor: theme.iconBackground }]}>
                <Ionicons name={disease.iconName as any} size={28} color={theme.primary} />
              </View>
              <View style={styles.diseaseInfo}>
                <Text style={[styles.diseaseName, { color: theme.text }]}>{disease.name}</Text>
                <Text style={[styles.diseasePreview, { color: theme.subText }]} numberOfLines={2}>
                  {disease.symptoms}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.subText} />
            </View>
          </TouchableOpacity>
        ))}
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.subText }]}>© 2025 Tomato Disease Guide</Text>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        {selectedDisease && (
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
                <Ionicons 
                  name={selectedDisease.iconName as any} 
                  size={32} 
                  color="white" 
                  style={styles.modalHeaderIcon} 
                />
                <Text style={styles.modalHeaderTitle}>{selectedDisease.name}</Text>
                <TouchableOpacity style={styles.closeIcon} onPress={closeModal}>
                  <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <View style={[styles.sectionContainer, { 
                  backgroundColor: theme.card, 
                  borderLeftColor: darkMode ? theme.primary : '#FFCDD2' 
                }]}>
                  <View style={styles.sectionTitleContainer}>
                    <Ionicons name="alert-circle" size={22} color={theme.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Symptoms</Text>
                  </View>
                  <Text style={[styles.sectionText, { color: theme.subText }]}>{selectedDisease.symptoms}</Text>
                </View>
                
                <View style={[styles.sectionContainer, { 
                  backgroundColor: theme.card, 
                  borderLeftColor: darkMode ? theme.primary : '#FFCDD2' 
                }]}>
                  <View style={styles.sectionTitleContainer}>
                    <Ionicons name="help-circle" size={22} color={theme.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Causes</Text>
                  </View>
                  <Text style={[styles.sectionText, { color: theme.subText }]}>{selectedDisease.causes}</Text>
                </View>
                
                <View style={[styles.sectionContainer, { 
                  backgroundColor: theme.card, 
                  borderLeftColor: darkMode ? theme.primary : '#FFCDD2' 
                }]}>
                  <View style={styles.sectionTitleContainer}>
                    <Ionicons name="medkit" size={22} color={theme.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Treatment</Text>
                  </View>
                  <Text style={[styles.sectionText, { color: theme.subText }]}>{selectedDisease.treatment}</Text>
                </View>
                
                <View style={[styles.sectionContainer, { 
                  backgroundColor: theme.card, 
                  borderLeftColor: darkMode ? theme.primary : '#FFCDD2' 
                }]}>
                  <View style={styles.sectionTitleContainer}>
                    <Ionicons name="shield" size={22} color={theme.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Prevention</Text>
                  </View>
                  <Text style={[styles.sectionText, { color: theme.subText }]}>{selectedDisease.prevention}</Text>
                </View>
              </ScrollView>
              
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: theme.primary }]}
                onPress={closeModal}
                activeOpacity={0.8}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 40,  
    padding: 16,
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  themeToggle: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
    padding: 12,
  },
  infoCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    elevation: 1,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
  },
  diseaseCard: {
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderLeftWidth: 3,
  },
  diseaseCardContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  diseaseInfo: {
    flex: 1,
  },
  diseaseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  diseasePreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
  },
  modalHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  modalHeaderIcon: {
    marginRight: 12,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  closeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  modalScrollView: {
    padding: 16,
  },
  sectionContainer: {
    marginBottom: 20,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  closeButton: {
    padding: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
  },
});

export default TomatoDiseaseScreen;