import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Divider } from 'react-native-paper';
import { useAuthStore } from '../store/authStore';

export default function AuthScreen(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signUp, signIn, loading, error } = useAuthStore();

  const handleAuth = async (): Promise<void> => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      if (isSignUp) {
        await signUp(email, password);
        Alert.alert('Success', 'Account created successfully');
      } else {
        await signIn(email, password);
        Alert.alert('Success', 'Signed in successfully');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            RPV Bible
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
            style={styles.input}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            editable={!loading}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
          />

          {isSignUp && (
            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              editable={!loading}
              style={styles.input}
            />
          )}

          {error && (
            <Text variant="bodySmall" style={styles.errorText}>
              {error}
            </Text>
          )}

          <Button
            mode="contained"
            onPress={handleAuth}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>

          <Divider style={styles.divider} />

          <Button
            mode="text"
            onPress={() => {
              setIsSignUp(!isSignUp);
              setEmail('');
              setPassword('');
              setConfirmPassword('');
            }}
            disabled={loading}
          >
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </Button>
        </View>

        <View style={styles.infoBox}>
          <Text variant="bodySmall" style={styles.infoText}>
            Sign in to sync your bookmarks and preferences across devices. Your data is
            securely stored and encrypted.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    color: '#a9291c',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
    marginTop: 8,
  },
  form: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 12,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 12,
  },
  button: {
    marginTop: 12,
    backgroundColor: '#a9291c',
  },
  divider: {
    marginVertical: 16,
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#a9291c',
  },
  infoText: {
    color: '#666',
    lineHeight: 20,
  },
});
