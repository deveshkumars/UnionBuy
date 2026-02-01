/**
 * Root Layout - Metropolis Bulk Buy App
 * Dark theme command center aesthetic
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { MetroColors } from '@/constants/theme';
import { AppProvider, useRole } from '@/context/AppContext';
import { configureAmplify } from '@/lib/amplify';
import { clearAllBackendData } from '@/services/backend';
import { resetAllMockData } from '@/services/mockData';

// Configure AWS (Cognito + DynamoDB) when amplify_outputs.json is present
configureAmplify();

// Auto-reset ALL data on app startup for clean testing
resetAllMockData();
clearAllBackendData(); // Also clear DynamoDB data

function RootNavigator() {
  const { role } = useRole();

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: MetroColors.background.primary },
          animation: 'slide_from_right',
        }}
      >
        {role === 'customer' ? (
          <Stack.Screen name="(customer)" options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="(runner)" options={{ headerShown: false }} />
        )}
        <Stack.Screen
          name="item/[id]"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      <StatusBar style="dark" />
    </View>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootNavigator />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MetroColors.background.primary,
  },
});
