import { Modal, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore, type AuthStore } from '../store/useAuthStore';
import { t } from '../constants/i18n';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsModal({ visible, onClose }: Props) {
  const language = useAuthStore((s: AuthStore) => s.language);
  const theme = useAuthStore((s: AuthStore) => s.theme);
  const blueLightFilter = useAuthStore((s: AuthStore) => s.blueLightFilter);
  const setLanguage = useAuthStore((s: AuthStore) => s.setLanguage);
  const setTheme = useAuthStore((s: AuthStore) => s.setTheme);
  const setBlueLightFilter = useAuthStore((s: AuthStore) => s.setBlueLightFilter);

  const isDark = theme === 'dark';
  const bg = isDark ? '#161B22' : '#FFF';
  const textColor = isDark ? '#E6EDF3' : '#1A365D';
  const textSec = isDark ? '#8B949E' : '#718096';
  const cardBg = isDark ? '#21262D' : '#F7FAFC';
  const borderC = isDark ? '#30363D' : '#E2E8F0';
  const primary = isDark ? '#58A6FF' : '#1A365D';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={st.overlay}>
        <View style={[st.sheet, { backgroundColor: bg }]}>
          <View style={st.header}>
            <Text style={[st.title, { color: textColor }]}>{t('settings.title')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[st.closeX, { color: textSec }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Language Selection */}
          <View style={st.section}>
            <Text style={[st.sectionTitle, { color: textColor }]}>{t('settings.language')}</Text>
            <View style={st.optionRow}>
              {[
                { key: 'en' as const, label: '🇬🇧 English' },
                { key: 'tr' as const, label: '🇹🇷 Türkçe' },
              ].map((lang) => (
                <TouchableOpacity
                  key={lang.key}
                  style={[
                    st.optionBtn,
                    { backgroundColor: cardBg, borderColor: borderC },
                    language === lang.key && { backgroundColor: primary, borderColor: primary },
                  ]}
                  onPress={() => setLanguage(lang.key)}
                >
                  <Text
                    style={[
                      st.optionText,
                      { color: textColor },
                      language === lang.key && { color: '#FFF' },
                    ]}
                  >
                    {lang.label}
                  </Text>
                  {language === lang.key && <Text style={{ color: '#FFF', fontSize: 16 }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Theme Selection */}
          <View style={st.section}>
            <Text style={[st.sectionTitle, { color: textColor }]}>{t('settings.theme')}</Text>
            <View style={st.optionRow}>
              {[
                { key: 'light' as const, label: t('settings.light') },
                { key: 'dark' as const, label: t('settings.dark') },
              ].map((th) => (
                <TouchableOpacity
                  key={th.key}
                  style={[
                    st.optionBtn,
                    { backgroundColor: cardBg, borderColor: borderC },
                    theme === th.key && { backgroundColor: primary, borderColor: primary },
                  ]}
                  onPress={() => setTheme(th.key)}
                >
                  <Text
                    style={[
                      st.optionText,
                      { color: textColor },
                      theme === th.key && { color: '#FFF' },
                    ]}
                  >
                    {th.label}
                  </Text>
                  {theme === th.key && <Text style={{ color: '#FFF', fontSize: 16 }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Blue Light Filter */}
          <View style={st.section}>
            <View style={[st.toggleRow, { backgroundColor: cardBg, borderColor: borderC }]}>
              <View style={{ flex: 1 }}>
                <Text style={[st.toggleLabel, { color: textColor }]}>{t('settings.blueLightFilter')}</Text>
                <Text style={[st.toggleDesc, { color: textSec }]}>{t('settings.blueLightDesc')}</Text>
              </View>
              <Switch
                value={blueLightFilter}
                onValueChange={setBlueLightFilter}
                trackColor={{ false: borderC, true: '#D69E2E' }}
                thumbColor={blueLightFilter ? '#FFF' : '#f4f4f4'}
              />
            </View>
          </View>

          <TouchableOpacity style={[st.doneBtn, { backgroundColor: primary }]} onPress={onClose}>
            <Text style={st.doneTxt}>{t('settings.done')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800' },
  closeX: { fontSize: 22, padding: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  optionRow: { flexDirection: 'row', gap: 10 },
  optionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
  },
  optionText: { fontSize: 15, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
    borderWidth: 1, gap: 12,
  },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggleDesc: { fontSize: 11, marginTop: 2 },
  doneBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  doneTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
