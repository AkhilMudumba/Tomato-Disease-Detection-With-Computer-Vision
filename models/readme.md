# Tomato Leaf Disease Detection App Models Server

![Tomato Leaf Diseases](https://img.shields.io/badge/AI-Plant%20Pathology-brightgreen)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.x-orange)
![Flask](https://img.shields.io/badge/Flask-API-blue)
![Python](https://img.shields.io/badge/Python-3.6%2B-blue)

An AI-powered REST API that detects diseases in tomato plants from leaf images using deep learning.

## 📋 Table of Contents
- [Overview](#overview)
- [Disease Classification](#disease-classification)
- [Technical Architecture](#technical-architecture)
- [Dataset Information](#dataset-information)
- [Model Architecture](#model-architecture)
  - [Transfer Learning with MobileNet V2](#transfer-learning-with-mobilenet-v2)
  - [Two-Stage Model Approach](#two-stage-model-approach)
- [Installation Guide](#installation-guide)
- [Usage Examples](#usage-examples)
  - [Starting the Server](#starting-the-server)
  - [Sample Python Client](#sample-python-client)
  - [cURL Example](#curl-example)
- [API Reference](#api-reference)
  - [Health Check Endpoint](#health-check-endpoint)
  - [Prediction Endpoint](#prediction-endpoint)
- [Performance Metrics](#performance-metrics)
- [Future Improvements](#future-improvements)

## 🔍 Overview

This project implements an intelligent system for early detection of tomato plant diseases through leaf image analysis. The system uses a two-stage deep learning approach:

1. **Leaf Validation**: Verifies whether the submitted image contains a tomato leaf
2. **Disease Classification**: If confirmed as a tomato leaf, identifies potential diseases affecting the plant

Early disease detection helps farmers implement timely interventions, reduce crop losses, and minimize pesticide usage through targeted treatments.

## 🍅 Disease Classification

The system can identify the following tomato conditions:

| Disease | Description |
|---------|-------------|
| Bacterial Spot | Caused by Xanthomonas bacteria, creates water-soaked spots |
| Early Blight | Fungal disease causing concentric ring patterns |
| Late Blight | Caused by Phytophthora infestans, appears as dark water-soaked lesions |
| Leaf Mold | Yellow spots on upper leaf surfaces with grayish mold underneath |
| Septoria Leaf Spot | Small circular spots with dark borders |
| Spider Mites | Tiny pests causing yellowing and fine webbing |
| Target Spot | Concentric rings forming a target-like pattern |
| Yellow Leaf Curl Virus | Transmitted by whiteflies, causing leaf curling and yellowing |
| Mosaic Virus | Mottled pattern of yellow and green on leaves |
| Healthy | Normal, disease-free tomato leaves |

## 🏗️ Technical Architecture

The application follows a modular architecture:

```
                                 ┌─────────────────┐
                                 │   Input Image   │
                                 └────────┬────────┘
                                          │
                                          ▼
┌─────────────────┐            ┌────────────────────┐
│   Flask API     │◄───────────┤  Image Processing  │
└─────────┬───────┘            └──────────┬─────────┘
          │                               │
          ▼                               ▼
┌─────────────────┐            ┌────────────────────┐
│ Response JSON   │            │ Leaf Detection CNN │
└─────────────────┘            └──────────┬─────────┘
          ▲                               │
          │                               ▼
┌─────────────────┐          ┌──────────────────────┐
│ Disease Details │◄─────────┤ Disease Detection CNN│
└─────────────────┘          └──────────────────────┘
```

This pipeline ensures that only validated tomato leaf images are processed for disease classification, reducing false positives and improving overall accuracy.

## 📊 Dataset Information

This project leverages the **PlantVillage dataset**, one of the most comprehensive repositories for plant disease imagery:

- **Size**: Over 50,000 expertly curated plant disease images
- **Classes**: 38 different classes of plant-disease combinations
- **Tomato Subset**: Approximately 18,000 images covering healthy and diseased tomato leaves
- **Image Quality**: Controlled environment with consistent lighting and background
- **Resolution**: 256x256 pixels RGB images

The dataset provides labeled images for all 10 classes (9 diseases + healthy) that our system detects, enabling supervised learning for the classification models.

## 🧠 Model Architecture

### Transfer Learning with MobileNet V2

This project utilizes transfer learning with the MobileNet V2 architecture for both classification tasks:

![Transfer Learning Diagram](https://img.shields.io/badge/Transfer%20Learning-MobileNetV2-blue)

**Why MobileNet V2?**
- **Efficiency**: Optimized for mobile and embedded devices
- **Speed**: Fast inference time for real-time applications
- **Accuracy**: Strong performance despite compact size
- **Resource-friendly**: Low computational and memory requirements

### Two-Stage Model Approach

1. **Leaf Detection Model**:
   - Base: MobileNet V2 (pre-trained on ImageNet)
   - Final Layer: Binary classifier (tomato leaf vs. non-tomato)
   - Input Size: 224x224x3 RGB images
   - Training: Fine-tuned on custom dataset of tomato and non-tomato plant images

2. **Disease Classification Model**:
   - Base: MobileNet V2 (pre-trained on ImageNet)
   - Final Layer: 10-class softmax classifier
   - Input Size: 224x224x3 RGB images
   - Training: Fine-tuned on PlantVillage tomato disease dataset

The two-stage approach improves overall system reliability by filtering out non-relevant images before disease diagnosis.

## 📥 Installation Guide

1. **Clone the repository**:
```bash
git clone https://github.com/yourusername/tomato-leaf-disease-detection.git
cd tomato-leaf-disease-detection
```

2. **Create a virtual environment** (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

The requirements.txt file contains:
```
Flask==2.3.3
tensorflow==2.13.0
Pillow==10.2.0
numpy==1.24.4
```

4. **Download pre-trained models**:
   Place the following model files in the project root directory:
   - `leaf_detection_model_fine_tuned.h5`: First-stage tomato leaf classifier
   - `plant_disease_model.h5`: Second-stage disease classifier

   Note: These models are not included in the repository due to size constraints.

5. **Verify the installation**:
```bash
python app.py
```

## 🚀 Usage Examples

### Starting the Server

```bash
python app.py
```

The server will run on `http://localhost:5000` by default.

### Sample Python Client

```python
import requests
import base64
from PIL import Image
import io

def encode_image(image_path):
    with open(image_path, "rb") as img_file:
        return base64.b64encode(img_file.read()).decode('utf-8')

def detect_disease(image_path):
    # Encode the image
    img_base64 = encode_image(image_path)
    
    # Send request to API
    response = requests.post(
        'http://localhost:5000/predict',
        json={'image': img_base64}
    )
    
    # Return results
    return response.json()

# Example usage
result = detect_disease('path/to/tomato_leaf.jpg')
print(result)
```

### cURL Example

```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$(base64 -w 0 path/to/tomato_leaf.jpg)\"}"
```

## 📘 API Reference

### Health Check Endpoint

**Request**:
```
GET /health
```

**Response**:
```json
{
  "status": "healthy"
}
```

### Prediction Endpoint

**Request**:
```
POST /predict
Content-Type: application/json

{
  "image": "base64_encoded_image_data"
}
```

**Successful Response** (Status 200):
```json
{
  "predicted_class": "Tomato_Late_blight",
  "confidence": 0.93,
  "all_probabilities": [0.02, 0.03, 0.93, 0.005, 0.001, 0.004, 0.0, 0.01, 0.0, 0.0],
  "class_names": [
    "Tomato_Bacterial_spot",
    "Tomato_Early_blight",
    "Tomato_Late_blight",
    "Tomato_Leaf_Mold",
    "Tomato_Septoria_leaf_spot",
    "Tomato_Spider_mites_Two_spotted_spider_mite",
    "Tomato__Target_Spot",
    "Tomato__Tomato_YellowLeaf__Curl_Virus",
    "Tomato__Tomato_mosaic_virus",
    "Tomato_healthy"
  ],
  "is_valid_tomato": true,
  "tomato_confidence": 0.99
}
```

**Error Response** (Status 400):
```json
{
  "error": "Not a tomato leaf image",
  "detail": "Detected as 'Non-tomato' with 87.56% confidence",
  "is_valid_tomato": false
}
```

## 📈 Performance Metrics

The models were evaluated on a held-out test set from the PlantVillage dataset:

| Model | Accuracy | Precision | Recall | F1 Score |
|-------|----------|-----------|--------|----------|
| Leaf Detection | 98.5% | 97.9% | 98.2% | 98.0% |
| Disease Classification | 94.7% | 93.8% | 93.6% | 93.7% |

Note: Individual disease class performance may vary. Early blight and late blight have slightly lower precision due to visual similarities.

## 🔮 Future Improvements

Potential enhancements for future versions:

- **Expanded Plant Support**: Extend models to detect diseases in other crops
- **Offline Mode**: Enable model inference without internet connectivity
- **Time-Series Analysis**: Track disease progression over time


*This project aims to support sustainable agriculture through early disease detection and intervention, potentially reducing crop losses and pesticide usage.*

[Back to Top](#tomato-leaf-disease-detection-app-models-server)