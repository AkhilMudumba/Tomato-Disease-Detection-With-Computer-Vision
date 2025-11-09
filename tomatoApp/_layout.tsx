import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Plant Disease Scanner',
          headerShown: false, // Hide header since index.tsx already has a custom header
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            color: Colors.textLight,
          },
        }}
          />
        <Stack.Screen
        name="scanner"
        options={{
          title: 'Plant Disease Scanner',
          headerShown: false, // Hide header since index.tsx already has a custom header
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            color: Colors.textLight,
          },
        }}
      />
      <Stack.Screen
        name="sensors"
        options={{
          title: 'Sensor Data',
          headerShown: false, // Hide header since index.tsx already has a custom header
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            color: Colors.textLight,
          },
        }}
      />
      <Stack.Screen
        name="DiseaseDetails"
        options={{
          title: 'Disease Details',
          headerShown: false, // Hide header since index.tsx already has a custom header
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: Colors.textLight,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          presentation: 'modal',
          animation: 'slide_from_bottom',
          contentStyle: {
            backgroundColor: Colors.background,
          }
        }}
      />
      <Stack.Screen
        name="weather"
        options={{
          title: 'WeatherDetails',
          headerShown: false, // Hide header since index.tsx already has a custom header
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: Colors.textLight,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          presentation: 'modal',
          animation: 'slide_from_bottom',
          contentStyle: {
            backgroundColor: Colors.background,
          }
        }}
      />

      
      <Stack.Screen
        name="diseases"
        options={{
          title: 'diseases',
          headerShown: false, // Hide header since index.tsx already has a custom header
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: Colors.textLight,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          presentation: 'modal',
          animation: 'slide_from_bottom',
          contentStyle: {
            backgroundColor: Colors.background,
          }
        }}
      />

      
    </Stack>
  );
}