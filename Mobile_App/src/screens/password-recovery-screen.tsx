import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api';

export function PasswordRecoveryScreen({ setup = false }: { setup?: boolean }) {
  const router = useRouter();
  const { token } = useAuth();
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  async function submit() {
    if (submitting.current) return;
    setError('');
    if (password.length < 6) { setError('Use a password with at least 6 characters.'); return; }
    if (!setup && (!/^\+?[0-9]{5,15}$/.test(mobile.trim()) || !/^[A-Fa-f0-9]{32}$/.test(code.trim().replace(/-/g, '')))) {
      setError('Enter your registered mobile number and the recovery code saved from Profile.'); return;
    }
    if (!setup && password !== confirmation) { setError('Passwords do not match.'); return; }
    submitting.current = true; setBusy(true);
    try {
      if (setup) {
        const result = await apiRequest<{ recoveryCode: string }>('/api/auth/recovery-code', { method: 'POST', token, body: { password } });
        setGeneratedCode(result.recoveryCode);
      } else {
        const result = await apiRequest<{ message: string }>('/api/auth/reset-password', { method: 'POST', body: { mobile: mobile.trim(), recoveryCode: code.trim(), newPassword: password } });
        setSuccess(result.message);
      }
      setPassword(''); setConfirmation(''); setCode('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to complete request. Please retry.'); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <SafeAreaView style={styles.screen}><KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable disabled={busy} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.back}><Text style={styles.link}>‹ Back</Text></Pressable>
      <Text style={styles.title}>{setup ? 'Recovery Code' : 'Forgot Password'}</Text>
      <Text style={styles.body}>{setup ? 'Create a private recovery code now so you can reset a forgotten password later. Generating a new code replaces your previous one.' : 'Use the recovery code you saved from Profile to set a new password. No SMS or payment is needed.'}</Text>
      {setup && !token ? <Text style={styles.error}>Please log in to generate a recovery code.</Text> : generatedCode ? <View style={styles.card}>
        <Text style={styles.label}>Save this code somewhere private</Text><Text selectable style={styles.code}>{generatedCode}</Text>
        <Text style={styles.body}>This code is shown only now and works once. Keep it outside this app, such as in a password manager. Anyone with this code and your mobile number can reset your password.</Text>
        <Pressable onPress={() => router.back()} style={styles.button}><Text style={styles.buttonText}>I have saved my code</Text></Pressable>
      </View> : success ? <View style={styles.card}><Text accessibilityRole="alert" style={styles.body}>{success}</Text><Pressable onPress={() => router.replace('/')} style={styles.button}><Text style={styles.buttonText}>Back to Login</Text></Pressable></View> : <View style={styles.card}>
        {!setup ? <><Text style={styles.label}>Registered mobile number</Text><TextInput accessibilityLabel="Registered mobile number" editable={!busy} value={mobile} onChangeText={setMobile} keyboardType="phone-pad" style={styles.input} placeholder="Mobile number" placeholderTextColor="#60736D" />
          <Text style={styles.label}>Recovery code</Text><TextInput accessibilityLabel="Recovery code" editable={!busy} value={code} onChangeText={setCode} autoCapitalize="characters" autoCorrect={false} maxLength={39} style={styles.input} placeholder="Saved 32-character code" placeholderTextColor="#60736D" /></> : null}
        <Text style={styles.label}>{setup ? 'Current password' : 'New password'}</Text><TextInput accessibilityLabel={setup ? 'Current password' : 'New password'} editable={!busy} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} style={styles.input} />
        {!setup ? <><Text style={styles.label}>Confirm new password</Text><TextInput accessibilityLabel="Confirm new password" editable={!busy} value={confirmation} onChangeText={setConfirmation} secureTextEntry autoCapitalize="none" autoCorrect={false} style={styles.input} /></> : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Pressable accessibilityRole="button" disabled={busy} onPress={submit} style={[styles.button, busy && { opacity: 0.5 }]}><Text style={styles.buttonText}>{busy ? 'Please wait…' : setup ? 'Generate Recovery Code' : 'Reset Password'}</Text></Pressable>
      </View>}
      {!setup && !success ? <Text selectable style={styles.body}>No recovery code? If you are still logged in on another device, generate one from Profile. Otherwise contact lenden@gmail.com for help. Account ownership must be verified; knowing a mobile number alone cannot reset a password.</Text> : null}
    </ScrollView>
  </KeyboardAvoidingView></SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E6EEE8' },
  content: { padding: 22, paddingBottom: 48, gap: 16 },
  back: { paddingVertical: 10, alignSelf: 'flex-start' },
  link: { color: '#0E7A61', fontSize: 16, fontWeight: '800' },
  title: { color: '#061B35', fontSize: 26, fontWeight: '900' },
  body: { color: '#40534D', fontSize: 14, lineHeight: 22 },
  card: { padding: 18, borderRadius: 18, backgroundColor: '#F6FAF7', gap: 12 },
  label: { color: '#061B35', fontWeight: '800' },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#B9CAC1', borderRadius: 10, paddingHorizontal: 12, color: '#061B35' },
  button: { backgroundColor: '#0E7A61', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '800' },
  error: { color: '#B42318', lineHeight: 21 },
  code: { fontSize: 22, lineHeight: 32, fontWeight: '800', color: '#061B35' },
});
