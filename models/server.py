import tensorflow as tf
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
from flask import Flask, request, jsonify
import os
import base64
from PIL import Image
import io

app = Flask(__name__)

class LeafDetectionServer:
    def __init__(self, leaf_model_path: str, disease_model_path: str):
        """Initialize the server with both models"""
        # Load both models
        self.leaf_model = load_model(leaf_model_path)
        self.disease_model = load_model(disease_model_path)
        
        # Class names for leaf detection (adjust based on your actual classes)
        self.leaf_class_names = ['Non-tomato', 'tomato']
        
        # Class names for disease detection
        self.disease_class_names = [
            'Tomato_Bacterial_spot',
            'Tomato_Early_blight',
            'Tomato_Late_blight',
            'Tomato_Leaf_Mold',
            'Tomato_Septoria_leaf_spot',
            'Tomato_Spider_mites_Two_spotted_spider_mite',
            'Tomato__Target_Spot',
            'Tomato__Tomato_YellowLeaf__Curl_Virus',
            'Tomato__Tomato_mosaic_virus',
            'Tomato_healthy'
        ]
    
    def process_image(self, image_data: str) -> np.ndarray:
        """Process base64 image data"""
        # Decode base64 image
        img_bytes = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(img_bytes))
        
        # Convert to RGB (important for RGBA images)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize and preprocess
        img = img.resize((224, 224))
        img_array = img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        return img_array / 255.0
    
    def is_tomato_leaf(self, image_data: str) -> tuple:
        """Check if image contains a tomato leaf"""
        processed_image = self.process_image(image_data)
        predictions = self.leaf_model.predict(processed_image, verbose=0)
        predicted_class = self.leaf_class_names[np.argmax(predictions[0])]
        confidence = float(np.max(predictions[0]))
        
        # Return True if it's a tomato leaf, along with confidence
        return predicted_class == 'tomato', confidence, predicted_class
    
    def predict_disease(self, image_data: str) -> dict:
        """Predict disease from image data"""
        processed_image = self.process_image(image_data)
        predictions = self.disease_model.predict(processed_image, verbose=0)
        predicted_class = self.disease_class_names[np.argmax(predictions[0])]
        confidence = float(np.max(predictions[0]))
        all_probabilities = [float(p) for p in predictions[0]]
        
        return {
            "predicted_class": predicted_class,
            "confidence": confidence,
            "all_probabilities": all_probabilities,
            "class_names": self.disease_class_names
        }
    
    def process_request(self, image_data: str) -> dict:
        """Process the request by first checking if it's a tomato leaf"""
        # First check if it's a tomato leaf
        is_tomato, confidence, leaf_class = self.is_tomato_leaf(image_data)
        
        if not is_tomato:
            return {
                "error": "Not a tomato leaf image",
                "detail": f"Detected as '{leaf_class}' with {confidence*100:.2f}% confidence",
                "is_valid_tomato": False
            }
        
        # If it is a tomato leaf, then predict the disease
        disease_result = self.predict_disease(image_data)
        disease_result["is_valid_tomato"] = True
        disease_result["tomato_confidence"] = confidence
        
        return disease_result

# Initialize server with paths to both models
server = LeafDetectionServer(
    leaf_model_path="./leaf_detection_model_fine_tuned.h5",
    disease_model_path="./plant_disease_model.h5"
)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get image data from request
        data = request.get_json()
        if 'image' not in data:
            return jsonify({"error": "No image data provided"}), 400
        
        # Process the image through both models
        result = server.process_request(data['image'])
        
        # Return appropriate response
        if result.get("is_valid_tomato", False):
            return jsonify(result)
        else:
            return jsonify(result), 400
    
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error processing request: {error_details}")
        return jsonify({"error": str(e), "details": error_details}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({"status": "healthy"})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)