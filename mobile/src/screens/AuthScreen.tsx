import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { RedButton, Pill, textStyles } from '../components/Rpv';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';

export default function AuthScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signUp, signIn, loading, error, isAuthenticated } = useAuthStore();

  // Mirror the web login flow — land on the dashboard after auth
  useEffect(() => {
    if (isAuthenticated) {
      navigation.navigate('Dashboard');
    }
  }, [isAuthenticated, navigation]);

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
        await signUp(email.trim(), password);
      } else {
        await signIn(email.trim(), password);
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
          <View style={styles.pillRow}>
            <Pill variant="navy">Redemption Project Version</Pill>
          </View>
          <Text style={textStyles.heroTitle}>A Bible built for today.</Text>
          <Text style={styles.heroSub}>
            {isSignUp
              ? 'Create an account to sync bookmarks and preferences.'
              : 'Sign in to sync bookmarks and preferences across devices.'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="email-outline" size={18} color={colors.inkFaint} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.inkFaint}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="lock-outline" size={18} color={colors.inkFaint} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.inkFaint}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.inkFaint}
              />
            </TouchableOpacity>
          </View>

          {isSignUp ? (
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="lock-check-outline" size={18} color={colors.inkFaint} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor={colors.inkFaint}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <RedButton
            title={isSignUp ? 'Create Account' : 'Sign In'}
            onPress={handleAuth}
            loading={loading}
            style={styles.submit}
          />

          <TouchableOpacity
            onPress={() => {
              setIsSignUp(!isSignUp);
              setPassword('');
              setConfirmPassword('');
            }}
            disabled={loading}
            style={styles.switchRow}
          >
            <Text style={styles.switchText}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Your data is securely stored and encrypted.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { flexGrow: 1, paddingBottom: spacing.xl },
  hero: {
    backgroundColor: colors.navy900,
    padding: spacing.lg,
    paddingTop: spacing.xl + spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'flex-start',
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    marginBottom: spacing.md,
  },
  pillRow: { flexDirection: 'row', marginBottom: spacing.sm },
  heroSub: { color: colors.lavSoft, fontSize: 13, lineHeight: 19, marginTop: 8 },
  form: { padding: spacing.lg },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 14,
    marginBottom: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 12,
  },
  error: { color: colors.red700, fontSize: 13, marginBottom: spacing.sm },
  submit: { marginTop: spacing.xs },
  switchRow: { alignItems: 'center', marginTop: spacing.md },
  switchText: { color: colors.navy800, fontWeight: '600', fontSize: 14 },
  footer: {
    textAlign: 'center',
    color: colors.inkFaint,
    fontSize: 12,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
});
