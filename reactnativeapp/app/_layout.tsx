/**
 * Root Layout - Metropolis Bulk Buy App
 * Dark theme command center aesthetic
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { configureAmplify } from '@/lib/amplify';
import { AppProvider, useRole } from '@/context/AppContext';
import { MetroColors } from '@/constants/theme';

// Configure AWS (Cognito + DynamoDB) when amplify_outputs.json is present
configureAmplify();

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
      <StatusBar style="light" />
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
