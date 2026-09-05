import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Share, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export function ProfileOptions({ hindi, onLanguageChange }: { hindi: boolean; onLanguageChange: (value: boolean) => Promise<void> }) {
  const router = useRouter();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [emailUnavailable, setEmailUnavailable] = useState(false);
  async function changeLanguage(value: boolean) {
    setBusy(true); setError('');
    try { await onLanguageChange(value); } catch { setError(hindi ? 'भाषा सेव नहीं हुई।' : 'Could not save language.'); }
    finally { setBusy(false); }
  }
  async function sendFeedback() {
    if (!feedback.trim() || busy) return;
    setBusy(true); setError('');
    try {
      await Linking.openURL(`mailto:lenden@gmail.com?subject=${encodeURIComponent('LenDen feedback')}&body=${encodeURIComponent(feedback.trim())}`);
    } catch { setEmailUnavailable(true); setError(hindi ? 'ईमेल ऐप नहीं खुला। कृपया lenden@gmail.com पर भेजें।' : 'Could not open an email app. Please send your feedback to lenden@gmail.com.'); }
    finally { setBusy(false); }
  }
  async function shareFeedback() {
    try {
      await Share.share({ title: 'LenDen feedback', message: `To: lenden@gmail.com\n\n${feedback.trim()}` });
    } catch { setError(hindi ? 'साझा नहीं हो सका। कृपया दोबारा कोशिश करें।' : 'Could not share feedback. Please try again.'); }
  }
  return <View style={styles.container}>
    <Pressable accessibilityRole="button" onPress={() => router.push('/recovery-code')} style={styles.feedbackRow}><Text style={styles.title}>{hindi ? 'रिकवरी कोड' : 'Recovery Code'}</Text><Text style={styles.title}>›</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={() => router.push('/privacy-policy')} style={styles.feedbackRow}><Text style={styles.title}>{hindi ? 'गोपनीयता नीति' : 'Privacy Policy'}</Text><Text style={styles.title}>›</Text></Pressable>
    <Text style={styles.title}>{hindi ? 'भाषा' : 'Language'}</Text>
    <View style={styles.row}>{[{ label: 'English', value: false }, { label: 'हिन्दी', value: true }].map((option) => <Pressable key={option.label} accessibilityRole="radio" accessibilityState={{ checked: hindi === option.value, disabled: busy }} disabled={busy} onPress={() => changeLanguage(option.value)} style={[styles.choice, hindi === option.value && styles.selected]}><Text style={[styles.choiceText, hindi === option.value && styles.selectedText]}>{option.label}</Text></Pressable>)}</View>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: feedbackOpen }} onPress={() => setFeedbackOpen(!feedbackOpen)} style={styles.feedbackRow}><Text style={styles.title}>{hindi ? 'सुझाव दें' : 'Feedback'}</Text><Text style={styles.title}>{feedbackOpen ? '−' : '+'}</Text></Pressable>
    {feedbackOpen ? <View style={styles.form}><Text style={styles.caption}>{hindi ? 'हमें बताएं कि हम क्या बेहतर कर सकते हैं।' : 'Tell us what we can improve.'}</Text><TextInput accessibilityLabel={hindi ? 'आपका सुझाव' : 'Your feedback'} style={styles.input} multiline maxLength={2000} placeholder={hindi ? 'अपना सुझाव लिखें…' : 'Write your feedback…'} placeholderTextColor="#6B7C76" value={feedback} onChangeText={setFeedback} /><Text style={styles.caption}>{hindi ? 'आपके ईमेल ऐप में खुलेगा: ' : 'Opens your email app to: '}lenden@gmail.com</Text><Pressable disabled={!feedback.trim() || busy} onPress={sendFeedback} style={[styles.send, (!feedback.trim() || busy) && styles.disabled]}><Text style={styles.selectedText}>{hindi ? 'ईमेल खोलें' : 'Open Email'}</Text></Pressable></View> : null}
    {emailUnavailable && feedbackOpen ? <Pressable accessibilityRole="button" disabled={!feedback.trim()} onPress={shareFeedback} style={styles.send}><Text style={styles.selectedText}>{hindi ? 'सुझाव साझा करें' : 'Share Feedback Instead'}</Text></Pressable> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>;
}
const styles = StyleSheet.create({
  container: { alignSelf: 'stretch', marginTop: 20, gap: 12 },
  title: { color: '#061B35', fontWeight: '800', fontSize: 16 },
  row: { flexDirection: 'row', gap: 10 },
  choice: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: '#EEF5F0', borderWidth: 1, borderColor: '#C5D5CD' },
  selected: { backgroundColor: '#061B35', borderColor: '#061B35' },
  choiceText: { color: '#40534D', fontWeight: '800' },
  selectedText: { color: '#FFFFFF', fontWeight: '800' },
  feedbackRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#DCE7E2' },
  form: { gap: 10 },
  caption: { color: '#60736D', fontSize: 12 },
  input: { minHeight: 100, textAlignVertical: 'top', borderRadius: 12, borderWidth: 1, borderColor: '#C5D5CD', backgroundColor: '#F6FAF7', padding: 12, color: '#061B35' },
  send: { padding: 14, alignItems: 'center', backgroundColor: '#0E7A61', borderRadius: 12 },
  disabled: { opacity: 0.5 },
  error: { color: '#B42318' },
});
