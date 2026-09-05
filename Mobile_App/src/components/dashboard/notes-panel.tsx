import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Note = { id: string; text: string; createdAt: string };

export function NotesPanel({ userId, hindi, focusRequest = 0 }: { userId: string; hindi: boolean; focusRequest?: number }) {
  const composerRef = useRef<TextInput>(null);
  useEffect(() => {
    if (focusRequest > 0) composerRef.current?.focus();
  }, [focusRequest]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<'load' | 'save' | ''>('');
  const [retry, setRetry] = useState(0);
  const saveInProgress = useRef(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const key = `lenden:notes:${userId}`;
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(key).then((value) => {
      const parsed: unknown = value ? JSON.parse(value) : [];
      if (!Array.isArray(parsed) || !parsed.every((note) => typeof note?.id === 'string' && typeof note?.text === 'string' && typeof note?.createdAt === 'string')) throw new Error('Invalid notes');
      if (active) { setNotes(parsed); setLoadFailed(false); setError(''); }
    }).catch(() => { if (active) { setLoadFailed(true); setError('load'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [key, retry]);

  async function save() {
    if (!draft.trim() || saveInProgress.current || loading || loadFailed) return;
    saveInProgress.current = true;
    setSaving(true);
    setError('');
    const next = [{ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text: draft.trim(), createdAt: new Date().toISOString() }, ...notes];
    try {
      await AsyncStorage.setItem(key, JSON.stringify(next));
      setNotes(next);
      setDraft('');
    } catch {
      setError('save');
    } finally { saveInProgress.current = false; setSaving(false); }
  }
  const filtered = notes.filter((note) => note.text.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return (
    <View style={styles.panel}>
      <View style={styles.heading}><Text style={styles.title}>{hindi ? 'छोटे नोट्स' : 'Quick Notes'}</Text><Text style={styles.count}>{notes.length}</Text></View>
      <Text style={styles.caption}>{hindi ? 'इस डिवाइस पर आपके लिए सेव किए गए नोट्स' : 'Your notes, saved on this device'}</Text>
      <TextInput ref={composerRef} accessibilityLabel={hindi ? 'नया नोट' : 'New note'} placeholder={hindi ? 'एक छोटा नोट लिखें…' : 'Write a short note…'} placeholderTextColor="#6B7C76" multiline maxLength={500} value={draft} onChangeText={setDraft} style={[styles.input, styles.composer]} />
      <View style={styles.heading}><Text style={styles.caption}>{draft.length}/500</Text><Pressable accessibilityRole="button" disabled={!draft.trim() || saving || loading || loadFailed} onPress={save} style={[styles.button, (!draft.trim() || saving || loading || loadFailed) && styles.disabled]}><Text style={styles.buttonText}>{saving ? (hindi ? 'सेव हो रहा है…' : 'Saving…') : (hindi ? 'नोट सेव करें' : 'Save Note')}</Text></Pressable></View>
      {error ? <Text style={styles.error}>{error === 'load'
        ? (hindi ? 'नोट्स लोड नहीं हो सके। फिर कोशिश करें।' : 'Could not load notes. Please retry.')
        : (hindi ? 'नोट सेव नहीं हुआ। दोबारा कोशिश करें।' : 'Could not save note. Your text is still here; try saving again.')}</Text> : null}
      {loadFailed ? <Pressable accessibilityRole="button" disabled={loading} onPress={() => { setLoading(true); setRetry((value) => value + 1); }} style={styles.button}><Text style={styles.buttonText}>{hindi ? 'फिर कोशिश करें' : 'Retry loading notes'}</Text></Pressable> : null}
      <TextInput accessibilityLabel={hindi ? 'नोट्स खोजें' : 'Search notes'} placeholder={hindi ? 'नोट्स खोजें…' : 'Search notes…'} placeholderTextColor="#6B7C76" value={query} onChangeText={setQuery} style={styles.input} autoCorrect={false} />
      {loading ? <ActivityIndicator color="#061B35" /> : loadFailed ? null : filtered.length ? filtered.map((note) => <View key={note.id} style={styles.note}><Text style={styles.noteText}>{note.text}</Text><Text style={styles.caption}>{new Date(note.createdAt).toLocaleDateString(hindi ? 'hi-IN' : 'en-IN')}</Text></View>) : <Text style={styles.caption}>{query.trim() ? (hindi ? 'कोई नोट नहीं मिला।' : 'No matching notes.') : (hindi ? 'आपके नोट्स यहाँ दिखेंगे।' : 'Your notes will appear here.')}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: '#EEF5F0', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#B9CAC1', marginTop: 16, gap: 12 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  title: { color: '#061B35', fontSize: 18, fontWeight: '800' },
  count: { color: '#0E7A61', fontWeight: '800' },
  caption: { color: '#60736D', fontSize: 12, marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#C5D5CD', borderRadius: 12, backgroundColor: '#F6FAF7', padding: 12, color: '#061B35', minHeight: 44 },
  composer: { minHeight: 86, textAlignVertical: 'top' },
  button: { backgroundColor: '#0E7A61', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  buttonText: { color: '#FFFFFF', fontWeight: '800' },
  disabled: { opacity: 0.5 },
  note: { backgroundColor: '#F6FAF7', borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: '#0E7A61' },
  noteText: { color: '#1F2D32', fontSize: 14, lineHeight: 21 },
  error: { color: '#B42318' },
});
