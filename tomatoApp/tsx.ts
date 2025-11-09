import React, { useRef, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Camera, useCameraDevices } from "react-native-vision-camera";

const CameraScreen = () => {
  const devices = useCameraDevices();
  const device = devices.back;
  const cameraRef = useRef<Camera>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === "authorized");
    })();
  }, []);

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePhoto();
      setPhotoUri(photo.path);
    }
  };

  if (!device) return <Text>No camera found</Text>;
  if (!hasPermission) return <Text>Camera access denied</Text>;

  return (
    <View style={styles.container}>
      <Camera ref={cameraRef} style={styles.camera} device={device} isActive={true} photo />
      <TouchableOpacity style={styles.button} onPress={takePhoto}>
        <Text style={styles.buttonText}>Take Photo</Text>
      </TouchableOpacity>
      {photoUri && <Text>Photo saved at: {photoUri}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  camera: { width: "100%", height: "80%" },
  button: { backgroundColor: "blue", padding: 10, marginTop: 10 },
  buttonText: { color: "white" },
});

export default CameraScreen;
