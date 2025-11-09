import requests
import base64
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Union, Optional
import os
import cv2
from skimage import exposure, feature, filters
from skimage.feature import graycomatrix, graycoprops
import matplotlib.cm as cm
from scipy import ndimage
import mahotas as mt
# Import the disease database
from tomato_disease_database import TOMATO_DISEASE_DATABASE

class EnhancedTomatoDiseaseClient:
    def __init__(self, server_url: str, api_key: str, location: str):
        """Initialize client with server URL and weather API credentials"""
        self.server_url = server_url
        self.api_key = api_key
        self.location = location
        self.disease_database = TOMATO_DISEASE_DATABASE
        self.output_dir = os.path.join("codes", "disease_detection_outputs")
        os.makedirs(self.output_dir, exist_ok=True)

    def send_image(self, image_path: str) -> Dict:
        """Send image to server and get prediction"""
        try:
            # Read and encode image
            with open(image_path, 'rb') as image_file:
                image_data = base64.b64encode(image_file.read()).decode('utf-8')
            
            # Send to server
            response = requests.post(
                f"{self.server_url}/predict",
                json={"image": image_data}
            )
            response.raise_for_status()
            return response.json()
            
        except Exception as e:
            print(f"Error sending image to server: {e}")
            return None

    def validate_tomato_leaf(self, image_path: str) -> Dict:
        """Validate if the image contains a tomato leaf
        
        This method is referenced in the server code but was missing in the original client.
        
        Returns:
            Dict: Contains 'is_valid_tomato', 'tomato_confidence' and possibly 'detail' keys
        """
        try:
            # Read and encode image
            with open(image_path, 'rb') as image_file:
                image_data = base64.b64encode(image_file.read()).decode('utf-8')
            
            # Send to server for leaf validation only
            response = requests.post(
                f"{self.server_url}/validate_leaf",
                json={"image": image_data}
            )
            response.raise_for_status()
            return response.json()
            
        except Exception as e:
            print(f"Error validating tomato leaf: {e}")
            return {
                "is_valid_tomato": False,
                "tomato_confidence": 0.0,
                "detail": f"Error during validation: {str(e)}"
            }

    def extract_texture_features(self, image: np.ndarray) -> np.ndarray:
        """Extract Haralick texture features"""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        else:
            gray = image
        textures = mt.features.haralick(gray)
        return textures.mean(axis=0)

    def calculate_glcm_features(self, image: np.ndarray) -> Dict[str, float]:
        """Calculate GLCM features"""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        glcm = graycomatrix(gray, [1], [0], symmetric=True, normed=True)
        
        return {
            'contrast': graycoprops(glcm, 'contrast')[0, 0],
            'dissimilarity': graycoprops(glcm, 'dissimilarity')[0, 0],
            'homogeneity': graycoprops(glcm, 'homogeneity')[0, 0],
            'energy': graycoprops(glcm, 'energy')[0, 0],
            'correlation': graycoprops(glcm, 'correlation')[0, 0]
        }

    def segment_leaf(self, image: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Segment the leaf from background"""
        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        a_channel = lab[:,:,1]
        _, binary = cv2.threshold(a_channel, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        kernel = np.ones((5,5), np.uint8)
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
        
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if contours:
            largest_contour = max(contours, key=cv2.contourArea)
            mask = np.zeros_like(binary)
            cv2.drawContours(mask, [largest_contour], -1, 255, -1)
            return mask, binary
        return binary, binary

    def detect_disease_regions(self, image: np.ndarray, mask: np.ndarray, predicted_class: str) -> Tuple[np.ndarray, np.ndarray]:
        """Detect disease-affected regions"""
        hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        disease_mask = np.zeros_like(mask)
        
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        radius = 3
        n_points = 8 * radius
        lbp = feature.local_binary_pattern(gray, n_points, radius, method='uniform')
        
        if 'Bacterial_spot' in predicted_class:
            lower_hsv = np.array([0, 30, 30])
            upper_hsv = np.array([20, 255, 255])
            color_mask = cv2.inRange(hsv, lower_hsv, upper_hsv)
            
            gradient = filters.sobel(gray)
            gradient_mask = gradient > filters.threshold_otsu(gradient)
            disease_mask = cv2.bitwise_or(color_mask, gradient_mask.astype(np.uint8) * 255)
            
        elif 'Early_blight' in predicted_class or 'Late_blight' in predicted_class:
            lower_lab = np.array([0, 128, 128])
            upper_lab = np.array([255, 135, 135])
            disease_mask = cv2.inRange(lab, lower_lab, upper_lab)
            
            texture_features = self.extract_texture_features(gray)
            texture_mask = lbp > np.mean(lbp)
            disease_mask = cv2.bitwise_and(disease_mask, texture_mask.astype(np.uint8) * 255)
            
        else:
            lower_hsv = np.array([20, 30, 30])
            upper_hsv = np.array([80, 255, 255])
            color_mask = cv2.inRange(hsv, lower_hsv, upper_hsv)
            
            glcm_features = self.calculate_glcm_features(image)
            texture_mask = lbp > np.mean(lbp)
            
            gradient = filters.sobel(gray)
            gradient_mask = gradient > filters.threshold_otsu(gradient)
            
            disease_mask = cv2.bitwise_or(color_mask, gradient_mask.astype(np.uint8) * 255)
            disease_mask = cv2.bitwise_and(disease_mask, texture_mask.astype(np.uint8) * 255)
        
        disease_mask = cv2.bitwise_and(disease_mask, mask)
        
        kernel = np.ones((3,3), np.uint8)
        disease_mask = cv2.morphologyEx(disease_mask, cv2.MORPH_OPEN, kernel)
        disease_mask = cv2.morphologyEx(disease_mask, cv2.MORPH_CLOSE, kernel)
        
        heatmap = self.create_disease_heatmap(image, disease_mask)
        
        return disease_mask, heatmap

    def create_disease_heatmap(self, image: np.ndarray, disease_mask: np.ndarray) -> np.ndarray:
        """Create a heatmap of disease severity"""
        mask_float = disease_mask.astype(float) / 255.0
        heatmap = ndimage.gaussian_filter(mask_float, sigma=3)
        heatmap = exposure.rescale_intensity(heatmap, out_range=(0, 1))
        heatmap_colored = cm.jet(heatmap)[:, :, :3]
        return heatmap_colored

    def process_image_analysis(self, image_path: str, prediction_result: Dict) -> Tuple[str, float]:
        """Process leaf image with advanced techniques"""
        img = cv2.imread(image_path)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        leaf_mask, binary = self.segment_leaf(img)
        disease_mask, heatmap = self.detect_disease_regions(img, leaf_mask, prediction_result["predicted_class"])
        
        alpha = 0.6
        blended = img.copy().astype(float) / 255
        blended[disease_mask > 0] = blended[disease_mask > 0] * (1 - alpha) + heatmap[disease_mask > 0] * alpha
        
        severity = np.sum(disease_mask > 0) / np.sum(leaf_mask > 0) * 100
        
        # Create disease-specific subfolder
        disease_name = prediction_result['predicted_class']
        disease_output_dir = os.path.join(self.output_dir, disease_name)
        os.makedirs(disease_output_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"analysis_{timestamp}_{prediction_result['predicted_class']}_{prediction_result['confidence']:.2f}_severity_{severity:.1f}.png"
        save_path = os.path.join(disease_output_dir, filename)
        
        plt.figure(figsize=(15, 5))
        
        plt.subplot(141)
        plt.imshow(img)
        plt.title('Original Image')
        plt.axis('off')
        
        plt.subplot(142)
        plt.imshow(leaf_mask, cmap='gray')
        plt.title('Leaf Segmentation')
        plt.axis('off')
        
        plt.subplot(143)
        plt.imshow(heatmap)
        plt.title(f'Disease Heatmap\nSeverity: {severity:.1f}%')
        plt.axis('off')
        
        plt.subplot(144)
        plt.imshow(blended)
        plt.title('Highlighted Areas')
        plt.axis('off')
        
        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        return save_path, severity

    def get_weather_data(self) -> Tuple[Optional[Dict], Optional[List[float]], Optional[Dict]]:
        """Fetch weather data"""
        try:
            current_url = f"http://api.weatherapi.com/v1/current.json?key={self.api_key}&q={self.location}"
            current_response = requests.get(current_url)
            current_response.raise_for_status()
            current_weather = current_response.json()["current"]

            rainfall_data = []
            for i in range(1, 4):
                date = (datetime.today() - timedelta(days=i)).strftime("%Y-%m-%d")
                history_url = f"http://api.weatherapi.com/v1/history.json?key={self.api_key}&q={self.location}&dt={date}"
                history_response = requests.get(history_url)
                history_response.raise_for_status()
                rainfall = history_response.json()["forecast"]["forecastday"][0]["day"]["totalprecip_mm"]
                rainfall_data.append(rainfall)

            forecast_url = f"http://api.weatherapi.com/v1/forecast.json?key={self.api_key}&q={self.location}&days=3"
            forecast_response = requests.get(forecast_url)
            forecast_response.raise_for_status()
            forecast_data = forecast_response.json()["forecast"]["forecastday"]

            return current_weather, rainfall_data, forecast_data
            
        except requests.exceptions.RequestException as e:
            print(f"Error fetching weather data: {e}")
            return None, None, None

    def generate_recommendations(self, predicted_class: str, confidence: float, weather_data: Dict) -> Dict:
        """Generate comprehensive recommendations based on disease and conditions"""
        if predicted_class == 'Tomato_healthy':
            return self._get_healthy_recommendations()

        disease_info = self.disease_database.get(predicted_class, {})
        disease_risk = self._calculate_disease_risk(weather_data, predicted_class)
        severity = self.determine_severity_level(confidence)

        return {
            'disease': predicted_class,
            'confidence': confidence,
            'risk_level': disease_risk,
            'severity': severity,
            'severity_description': disease_info.get('severity_levels', {}).get(severity, ''),
            'treatments': disease_info.get('treatments', []),
            'preventive_measures': disease_info.get('preventive_measures', []),
            'organic_treatments': disease_info.get('organic_treatments', []),
            'environmental_recommendations': self._get_environmental_recommendations(weather_data, predicted_class),
            'treatment_schedule': self._get_treatment_schedule(predicted_class, weather_data)
        }

    def determine_severity_level(self, confidence: float) -> str:
        """Determine severity level based on confidence score"""
        if confidence >= 0.8:
            return 'high'
        elif confidence >= 0.6:
            return 'medium'
        else:
            return 'low'

    def _calculate_disease_risk(self, weather_data: Dict, disease: str) -> float:
        """Calculate disease risk based on weather conditions and disease-specific thresholds"""
        if disease not in self.disease_database:
            return 0.0

        temp = weather_data.get('temp_c', 20)  # Default value if missing
        humidity = weather_data.get('humidity', 50)  # Default value if missing
        disease_info = self.disease_database[disease]
        
        optimal_temp = disease_info.get('optimal_temp', (20, 30))
        optimal_humidity = disease_info.get('optimal_humidity', (60, 80))
        
        temp_risk = self._calculate_range_risk(temp, optimal_temp)
        humidity_risk = self._calculate_range_risk(humidity, optimal_humidity)

        # Factor in soil moisture if available
        soil_moisture = weather_data.get('soil_moisture')
        if soil_moisture is not None and isinstance(soil_moisture, (int, float)):
            optimal_soil_moisture = disease_info.get('optimal_soil_moisture', (40, 60))
            soil_moisture_risk = self._calculate_range_risk(soil_moisture, optimal_soil_moisture)
            
            # Weight humidity more heavily for moisture-dependent diseases
            if any(term in disease.lower() for term in ['blight', 'mold', 'spot']):
                return (temp_risk + 2 * humidity_risk + soil_moisture_risk) / 4
            return (temp_risk + humidity_risk + soil_moisture_risk) / 3
        else:
            # Weight humidity more heavily for moisture-dependent diseases
            if any(term in disease.lower() for term in ['blight', 'mold', 'spot']):
                return (temp_risk + 2 * humidity_risk) / 3
            return (temp_risk + humidity_risk) / 2

    def _calculate_range_risk(self, value: float, optimal_range: Tuple[float, float]) -> float:
        """Calculate risk factor based on optimal range"""
        if optimal_range[0] <= value <= optimal_range[1]:
            return 1.0
        elif value < optimal_range[0]:
            return max(0, 1 - (optimal_range[0] - value) / optimal_range[0])
        else:
            return max(0, 1 - (value - optimal_range[1]) / optimal_range[1])

    def _get_treatments(self, disease: str, severity: str) -> List[str]:
        """Get treatment recommendations based on disease and severity"""
        # Add your treatment recommendations here
        return ["Implement appropriate fungicide program", 
                "Remove infected leaves",
                "Improve air circulation",
                "Adjust irrigation practices"]

    def _get_environmental_recommendations(self, weather_data: Dict, disease: str) -> List[str]:
        """Generate environmental recommendations based on weather and specific disease"""
        recommendations = []
        temp = weather_data.get('temp_c', 20)  # Default if missing
        humidity = weather_data.get('humidity', 50)  # Default if missing
        soil_moisture = weather_data.get('soil_moisture')  # May be None
        
        disease_info = self.disease_database.get(disease, {})
        optimal_temp = disease_info.get('optimal_temp', (20, 30))
        optimal_humidity = disease_info.get('optimal_humidity', (60, 80))
        optimal_soil_moisture = disease_info.get('optimal_soil_moisture', (40, 60))

        # Temperature management
        if temp > optimal_temp[1]:
            recommendations.extend([
                "Install shade cloth to reduce temperature",
                "Increase ventilation and air movement",
                "Apply mulch to maintain root temperature",
                "Water early morning or late evening"
            ])
        elif temp < optimal_temp[0]:
            recommendations.extend([
                "Use row covers or tunnels",
                "Apply dark mulch to increase heat absorption",
                "Consider greenhouse cultivation",
                "Reduce water frequency"
            ])

        # Humidity management
        if humidity > optimal_humidity[1]:
            recommendations.extend([
                "Improve air circulation between plants",
                "Reduce overhead irrigation",
                "Increase plant spacing",
                "Remove excess foliage",
                "Use dehumidifiers in greenhouse settings"
            ])
        elif humidity < optimal_humidity[0]:
            recommendations.extend([
                "Use humidity trays or misting systems",
                "Apply organic mulch to retain moisture",
                "Install windbreaks",
                "Group plants to create microclimate"
            ])

        # Soil moisture management (if data available)
        if soil_moisture is not None and isinstance(soil_moisture, (int, float)):
            if soil_moisture > optimal_soil_moisture[1]:
                recommendations.extend([
                    "Reduce watering frequency",
                    "Improve soil drainage",
                    "Consider raised beds for better drainage",
                    "Use moisture-wicking materials in soil"
                ])
            elif soil_moisture < optimal_soil_moisture[0]:
                recommendations.extend([
                    "Increase watering frequency",
                    "Apply mulch to retain soil moisture",
                    "Water deeply but less frequently",
                    "Consider drip irrigation for efficient water delivery"
                ])

        return recommendations

    def _get_treatment_schedule(self, disease: str, weather_data: Dict) -> List[str]:
        """Generate detailed treatment schedule based on disease characteristics"""
        disease_info = self.disease_database.get(disease, {})
        schedule = []

        # Weather-based timing
        humidity = weather_data.get('humidity', 60)
        temp = weather_data.get('temp_c', 25)
        
        if humidity > 85:
            schedule.append("Delay chemical treatments until humidity decreases below 85%")
        elif temp > 30:
            schedule.append("Apply treatments early morning or late evening")
        else:
            schedule.append("Current conditions are suitable for treatment")

        # Disease-specific schedules
        if 'bacterial' in disease.lower():
            schedule.extend([
                "Week 1: Apply copper-based treatments",
                "Week 2: Monitor disease progression",
                "Week 3: Rotate to different bactericide",
                "Week 4: Evaluate treatment effectiveness"
            ])
        elif 'virus' in disease.lower():
            schedule.extend([
                "Immediately: Remove infected plants",
                "Weekly: Monitor for vectors",
                "Bi-weekly: Apply insecticide treatments",
                "Monthly: Evaluate surrounding plants"
            ])
        else:  # Fungal diseases
            schedule.extend([
                "Day 1: Initial fungicide application",
                "Day 7-10: Second application",
                "Day 14-21: Rotate fungicide class",
                "Day 28: Evaluate and repeat if necessary"
            ])

        return schedule

    def _get_healthy_recommendations(self) -> Dict:
        """Generate recommendations for healthy plants"""
        return {
            'disease': 'Healthy',
            'confidence': 1.0,
            'risk_level': 0.0,
            'severity': 'none',
            'severity_description': 'No disease detected. Plant appears healthy.',
            'treatments': [
                "Continue regular monitoring",
                "Maintain current practices",
                "Follow preventive schedule",
                "Document successful practices"
            ],
            'preventive_measures': [
                "Regular inspection for early detection",
                "Proper plant spacing",
                "Crop rotation",
                "Use disease-resistant varieties"
            ],
            'organic_treatments': [
                "Neem oil as preventive spray",
                "Compost tea applications",
                "Beneficial microbes in soil",
                "Companion planting"
            ],
            'environmental_recommendations': [
                "Monitor weather conditions",
                "Maintain proper irrigation",
                "Ensure good air circulation",
                "Regular soil testing"
            ],
            'treatment_schedule': [
                "Monthly preventive treatments",
                "Weekly monitoring schedule",
                "Seasonal rotation planning"
            ]
        }

def run_client(image_path: str, server_url: str, api_key: str, location: str):
    """Run the enhanced client application"""
    try:
        # Initialize client
        client = EnhancedTomatoDiseaseClient(server_url, api_key, location)
        
        # Send image and get prediction
        print("Analyzing image...")
        prediction_result = client.send_image(image_path)
        if prediction_result is None:
            raise Exception("Failed to get prediction from server")
        
        # Check if valid tomato leaf
        if not prediction_result.get("is_valid_tomato", True):
            print(f"WARNING: {prediction_result.get('detail', 'Not a valid tomato leaf')}")
            return
            
        # Process image analysis
        print("Processing detailed analysis...")
        analysis_path, severity = client.process_image_analysis(image_path, prediction_result)
        
        # Get weather data
        print("Fetching environmental data...")
        current_weather, rainfall_data, forecast_data = client.get_weather_data()
        
        if current_weather is None:
            raise Exception("Failed to fetch weather data")
        
        # Generate recommendations
        print("Generating comprehensive recommendations...")
        recommendations = client.generate_recommendations(
            prediction_result["predicted_class"],
            prediction_result["confidence"],
            current_weather
        )
        
        # Print detailed results
        print("\n=== Comprehensive Tomato Disease Analysis Report ===")
        print(f"\nDetection Results:")
        print(f"Detected Disease: {recommendations['disease']}")
        print(f"Confidence: {recommendations['confidence']:.2f}")
        print(f"Severity Level: {recommendations['severity']}")
        print(f"Severity Description: {recommendations['severity_description']}")
        print(f"Disease Severity (Affected Area): {severity:.1f}%")
        print(f"Analysis Images Saved: {analysis_path}")
        
        print(f"\nEnvironmental Conditions:")
        print(f"Temperature: {current_weather['temp_c']}°C")
        print(f"Humidity: {current_weather['humidity']}%")
        print(f"Average Rainfall (past 3 days): {sum(rainfall_data)/3:.2f}mm")
        print(f"Disease Risk Level: {recommendations['risk_level']:.2f}")
        
        print("\nRecommended Treatments:")
        for i, treatment in enumerate(recommendations['treatments'], 1):
            print(f"{i}. {treatment}")
        
        print("\nOrganic Treatment Options:")
        for i, treatment in enumerate(recommendations['organic_treatments'], 1):
            print(f"{i}. {treatment}")
        
        print("\nPreventive Measures:")
        for i, measure in enumerate(recommendations['preventive_measures'], 1):
            print(f"{i}. {measure}")
        
        print("\nEnvironmental Management:")
        for i, rec in enumerate(recommendations['environmental_recommendations'], 1):
            print(f"{i}. {rec}")
        
        print("\nTreatment Schedule:")
        for i, schedule in enumerate(recommendations['treatment_schedule'], 1):
            print(f"{i}. {schedule}")

    except Exception as e:
        print(f"Error running client: {e}")


if __name__ == "__main__":
    SERVER_URL = "http://localhost:5000"  # Adjust if server is on different machine
    IMAGE_PATH = r"PlantVillage/Tomato_Spider_mites_Two_spotted_spider_mite/0a1c03ea-1a2d-449e-bcc4-4a8b62febf88___Com.G_SpM_FL 9433.JPG"
    API_KEY = "026682ee9123472195243748251202"
    LOCATION = "London"
    
    run_client(IMAGE_PATH, SERVER_URL, API_KEY, LOCATION)