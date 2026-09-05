import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const sections = [
  ['A free ledger app', 'LenDen is free to use. The current app has no subscription or in-app purchase. LenDen helps you record loans and payments; it does not itself send money or provide a loan. Your network provider may charge for data or messages.'],
  ['Information you enter', 'We process your account name, mobile number, and password to create and protect your account. Passwords are stored as hashes. Your ledger may contain borrower names, phone numbers, village, family or guarantor details, document notes, loan amounts, interest rates, and payment records. Only enter information you are permitted to use, and avoid unnecessary identity-document details.'],
  ['How information is used', 'Account and ledger information is sent to the LenDen backend to sign you in, display your records, and save changes. Authentication sessions are maintained on the server. Technical request logs may be generated when you use the service.'],
  ['Notes and device storage', 'Quick Notes, your language preference, and onboarding preference are stored on your device. Quick Notes are not currently backed up to the LenDen backend. Clearing app storage or uninstalling the app may remove them.'],
  ['Feedback and service providers', 'Feedback is sent only when you choose to send it through your email or sharing app. It may include your email address and the text you enter. Backend hosting and storage providers process information needed to operate the service. Password recovery uses a private recovery code that you generate while signed in. Only a hash of the code is stored on the backend; keep the original somewhere safe.'],
  ['Retention and your choices', 'Account and ledger records remain on the backend until removed. Logging out or uninstalling the app does not delete those records. To request access, correction, or deletion of your account and associated records, contact lenden@gmail.com. We may ask you to verify account ownership before acting.'],
  ['Security', 'The app uses password hashing and account-based access checks. No storage or transmission system is completely secure. Protect your device and password, and never share a password-reset code.'],
  ['Contact and updates', 'For privacy questions or requests, contact lenden@gmail.com. Changes to this policy will appear here with an updated date.'],
];

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  return <SafeAreaView style={styles.screen}>
    <View style={styles.header}><Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.back}><Text style={styles.backText}>‹ Back</Text></Pressable><Text style={styles.title}>Privacy Policy</Text></View>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.brand}>LenDen</Text><Text style={styles.date}>Last updated: 5 September 2026</Text>
      {sections.map(([title, body]) => <View key={title} style={styles.section}><Text style={styles.heading}>{title}</Text><Text selectable style={styles.body}>{body}</Text></View>)}
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E6EEE8' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18 },
  back: { paddingVertical: 10, paddingRight: 8 },
  backText: { color: '#0E7A61', fontWeight: '800', fontSize: 16 },
  title: { color: '#061B35', fontSize: 20, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 40 },
  brand: { color: '#061B35', fontSize: 28, fontWeight: '900' },
  date: { color: '#60736D', marginTop: 6, marginBottom: 10 },
  section: { marginTop: 20 },
  heading: { color: '#061B35', fontSize: 17, fontWeight: '800', marginBottom: 8 },
  body: { color: '#40534D', fontSize: 14, lineHeight: 23 },
});
