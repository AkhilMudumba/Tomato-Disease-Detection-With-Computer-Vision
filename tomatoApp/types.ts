import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Index: undefined;
  DiseaseDetails: { result: any }; // Define expected parameters
};

export type NavigationProps = StackNavigationProp<RootStackParamList>;
