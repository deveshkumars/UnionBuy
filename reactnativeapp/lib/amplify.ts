/**
 * Amplify (Cognito + AppSync/DynamoDB) configuration for React Native
 * - Must import react-native-get-random-values before aws-amplify (crypto polyfill)
 */
import 'react-native-get-random-values';

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser, signIn, signUp, signOut, fetchAuthSession } from 'aws-amplify/auth';

// Schema type from Amplify backend (for typed Data client)
import type { Schema } from 'amplify/data/resource';

let configured = false;

/**
 * Configure Amplify with outputs from `ampx sandbox`.
 * Call once at app entry (e.g. _layout.tsx). If outputs are missing, app runs in mock mode.
 */
export function configureAmplify(): boolean {
  if (configured) return true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const outputs = require('../amplify_outputs.json') as Record<string, unknown>;
    if (outputs?.auth && outputs?.data) {
      Amplify.configure(outputs);
      configured = true;
      return true;
    }
  } catch {
    // No amplify_outputs.json or invalid — use mock API
  }
  return false;
}

export function isBackendConfigured(): boolean {
  return configured;
}

/** Typed Data client for AppSync/DynamoDB (Products, Pledges, BulkOrders, UserProfile) */
export function getDataClient() {
  return generateClient<Schema>({ authMode: 'userPool' });
}

/** Auth helpers (Cognito) */
export const Auth = {
  getCurrentUser,
  signIn,
  signUp,
  signOut,
  fetchAuthSession,
};
