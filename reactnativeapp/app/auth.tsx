/**
 * Auth Screen - Sign In / Sign Up
 */

import { FontSizes, Fonts, MetroColors, Spacing } from '@/constants/theme';
import { confirmSignUp, signIn, signUp } from 'aws-amplify/auth';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'confirm'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: { email },
        },
      });
      Alert.alert('Success', 'Check your email for confirmation code');
      setMode('confirm');
    } catch (error: any) {
      Alert.alert('Sign Up Error', error.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmationCode) {
      Alert.alert('Error', 'Please enter confirmation code');
      return;
    }

    setLoading(true);
    try {
      await confirmSignUp({
        username: email,
        confirmationCode,
      });
      Alert.alert('Success', 'Account confirmed! You can now sign in');
      setMode('signin');
      setConfirmationCode('');
    } catch (error: any) {
      Alert.alert('Confirmation Error', error.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await signIn({ username: email, password });
      Alert.alert('Success', 'Signed in!');
      router.replace('/(customer)');
    } catch (error: any) {
      if (error.name === 'UserNotConfirmedException') {
        Alert.alert('Account Not Confirmed', 'Please confirm your account first');
        setMode('confirm');
      } else {
        Alert.alert('Sign In Error', error.message || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>METROPOLIS</Text>
            <Text style={styles.subtitle}>Bulk Buy Platform</Text>
          </View>

          {/* Form */}
          {mode === 'confirm' ? (
            <>
              <Text style={styles.label}>Confirmation Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter code from email"
                value={confirmationCode}
                onChangeText={setConfirmationCode}
                keyboardType="number-pad"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleConfirm}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.buttonText}>CONFIRM</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode('signin')}>
                <Text style={styles.link}>Back to Sign In</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Password (min 8 chars)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={mode === 'signin' ? handleSignIn : handleSignUp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.buttonText}>
                    {mode === 'signin' ? 'SIGN IN' : 'SIGN UP'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              >
                <Text style={styles.link}>
                  {mode === 'signin'
                    ? "Don't have an account? Sign Up"
                    : 'Already have an account? Sign In'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MetroColors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl * 2,
  },
  title: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes['3xl'],
    color: MetroColors.primary,
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: MetroColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    color: MetroColors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: MetroColors.surface,
    borderWidth: 1,
    borderColor: MetroColors.border,
    borderRadius: 4,
    padding: Spacing.md,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    color: MetroColors.text,
  },
  button: {
    backgroundColor: MetroColors.primary,
    padding: Spacing.md,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: Spacing.xl,
    minHeight: 48,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    color: '#000',
    fontWeight: '600',
    letterSpacing: 1,
  },
  link: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: MetroColors.primary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
