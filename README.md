# 🍅 TomatoAPP - Mobile Client for Tomato Disease Detection

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Relationship with Parent Project](#relationship-with-parent-project)
- [Installation](#installation)
- [Backend Configuration](#backend-configuration)
- [Usage](#usage)
- [Development](#development)
- [Integration with ML Models](#integration-with-ml-models)
- [Raspberry Pi Integration](#raspberry-pi-integration)


## Overview

TomatoAPP is the mobile client component of the larger Tomato Disease Detection System. This React Native/Expo application serves as the user interface for capturing images of tomato plants and displaying disease prediction results. The app works in conjunction with backend ML models and can be deployed alongside Raspberry Pi devices for field deployment.

## Features

- 📸 **Image Capture Interface**: User-friendly camera interface for capturing clear images of tomato plants
- 🔄 **Integration with ML Models**: Communicates with backend machine learning models for disease detection
- 📊 **Results Visualization**: Displays prediction results with confidence scores and visual indicators
- 📱 **Mobile-First Design**: Optimized for field use on smartphones and tablets

## Tech Stack

- **Frontend**: React Native/Expo
- **Backend**: Node.js
- **Machine Learning**: TensorFlow.js
- **Data Storage**: Local storage with optional cloud sync

## Project Structure

```
tomatoAPP/
├── .expo/                   # Expo configuration files
├── app/                     # Main application code
├── assets/                  # Images, fonts, and other static assets
├── Backend/                 # Server-side code for the application
├── components/              # Reusable UI components
├── constants/               # Application constants and configuration
├── hooks/                   # Custom React hooks
├── scripts/                 # Utility scripts
├── .gitignore               # Git ignore file
├── .gitattributes           # Git attributes file
├── app.json                 # Expo app configuration
├── expo-env.d.ts            # Expo environment type definitions
├── package-lock.json        # NPM package lock
├── package.json             # NPM dependencies and scripts
├── README.md                # Project documentation
├── tsconfig.json            # TypeScript configuration
└── tsx.ts                   # TypeScript execution configuration
```

## Relationship with Parent Project

This mobile app is part of a larger tomato disease detection system that includes:

1. **Machine Learning Models** (`../models/`) - Pre-trained models for tomato disease classification
2. **Raspberry Pi Integration** (`../raspberry_pi_code/`) - Code for deploying the system on Raspberry Pi devices in the field
3. **TomatoAPP** (this repository) - Mobile interface for end users

## Installation

1. Clone the repository (if cloning just this component):
   ```bash
   git clone https://github.com/mathan0946/tomatoAPP.git
   cd tomatoAPP
   ```

   Or navigate to the tomatoAPP directory if you've cloned the entire project:
   ```bash
   cd tomato_disease_detection_app/tomatoAPP
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

4. Run on your device or emulator:
   - Scan the QR code with the Expo Go app (Android)
   - Or press 'i' for iOS simulator / 'a' for Android emulator

## Backend Configuration

1. Ensure the backend server address is correctly set in `constants/apiConfig.js` (or similar file)
2. If using with Raspberry Pi deployment, configure the connection settings accordingly

## Usage

1. Open the app on your device
2. Allow camera permissions when prompted
3. Navigate to the capture screen
4. Take a clear photo of a tomato plant leaf showing symptoms
5. Wait for the analysis results
6. View detailed disease information and recommendations
7. Save or share the results as needed

## Development

- **Running in Development Mode**:
  ```bash
  npx expo start --dev-client
  ```

- **Building for Production**:
  ```bash
  npx expo build:android  # For Android
  npx expo build:ios      # For iOS
  ```

- **TypeScript Checking**:
  ```bash
  npm run typescript
  ```

## Integration with ML Models

This mobile app is designed to work with the machine learning models located in the `../models/` directory of the parent project. The app can:

1. Use on-device TensorFlow.js models for offline prediction
2. Connect to backend API endpoints that utilize the trained models
3. Work with Raspberry Pi deployments for field-based prediction systems

For more information about the machine learning models, refer to the documentation in the models directory of the parent project.

## Raspberry Pi Integration

The tomatoAPP can be configured to work with Raspberry Pi devices running the detection models in the field. To set up this integration:

1. Deploy the Raspberry Pi code from the parent project to your Pi device
2. Configure the mobile app to connect to the Raspberry Pi's IP address
3. Update the connection settings in the app's configuration files

For detailed instructions on Raspberry Pi setup, refer to the documentation in the `../raspberry_pi_code/` directory of the parent project.


## Acknowledgements

- ML model training data provided by [PlantVillage](https://plantvillage.psu.edu/)
- Built with [Expo](https://expo.dev/) and [React Native](https://reactnative.dev/)

## Contact

Project Link: [https://github.com/mathan0946/tomato_disease_detection_app](https://github.com/AkhilMudumba/tomato_disease_detection_app)

---
*This project aims to support sustainable agriculture through early disease detection and intervention, potentially reducing crop losses and pesticide usage.*
