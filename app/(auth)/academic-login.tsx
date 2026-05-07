import { useRouter } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { getUserProfile, loginAcademic } from '../../services/api';
import { formatDisplayNameFromEmail } from '../../utils/formatName';

export default function AcademicLoginScreen() {
  const router = useRouter();
  const login = useAuthStore(s => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    const e = email.trim().toLowerCase();
    if (!e || !password) { setError('Email and password are required.'); return; }
    if (!e.endsWith('@mu.edu.tr')) { setError('Academic email must end with @mu.edu.tr'); return; }
    setError(''); setLoading(true);
    try {
      const res = await loginAcademic(e);
      if (res?.success) {
        login({ ...res.user, role: 'academic' });
        router.replace('/(academic)/home');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch {
      setError('Network error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={st.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1F15" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={st.backBtn} onPress={() => router.back()}><Text style={st.backText}>← Back</Text></TouchableOpacity>
          <View style={st.header}>
            <View style={st.iconWrap}>
              <Image source={require('../../assets/university/logo.png')} style={{ width: 80, height: 80, borderRadius: 40 }} resizeMode="cover" />
            </View>
            <Text style={st.title}>Academic Staff Login</Text>
            <Text style={st.subtitle}>Sign in with your MSKU staff account</Text>
          </View>
          <View style={st.form}>
            <Text style={st.label}>University Email</Text>
            <View style={st.inputWrap}>
              <Text style={st.inputIcon}>📧</Text>
              <TextInput style={st.input} placeholder="username@mu.edu.tr" placeholderTextColor="#A0AEC0" value={email} onChangeText={v => { setEmail(v); if (error) setError(''); }} keyboardType="email-address" autoCapitalize="none" />
            </View>
            {error ? <Text style={st.errorText}>⚠️ {error}</Text> : null}
            <Text style={st.label}>Password</Text>
            <View style={st.inputWrap}>
              <Text style={st.inputIcon}>🔑</Text>
              <TextInput style={st.input} placeholder="Enter your password" placeholderTextColor="#A0AEC0" value={password} onChangeText={setPassword} secureTextEntry />
            </View>
            <TouchableOpacity style={st.forgotBtn} onPress={() => {
              if (!email.trim()) { Alert.alert('Forgot Password', 'Please enter your university email first.'); return; }
              if (!email.trim().toLowerCase().endsWith('@mu.edu.tr')) { Alert.alert('Invalid Email', 'Enter a valid @mu.edu.tr email.'); return; }
              Alert.alert('✅ Password Reset', `A password reset link has been sent to:\n${email.trim()}`);
            }}><Text style={st.forgotText}>Forgot password?</Text></TouchableOpacity>
            <TouchableOpacity style={[st.loginBtn, loading && st.loginBtnDisabled]} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              <Text style={st.loginBtnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
            </TouchableOpacity>
            <View style={st.infoBox}><Text style={st.infoText}>🔒  Use your OBS staff credentials.{'\n'}Access restricted to authorized personnel.</Text></View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1F15' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  backBtn: { marginTop: 16, marginBottom: 8 },
  backText: { color: 'rgba(255,255,255,0.7)', fontSize: 15 },
  header: { alignItems: 'center', paddingVertical: 32 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(39,103,73,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  icon: { fontSize: 40 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  form: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, gap: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
  label: { color: '#2D3748', fontSize: 13, fontWeight: '700', marginBottom: 6, marginTop: 14, letterSpacing: 0.3 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 12 },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#1A202C' },
  errorText: { color: '#C53030', fontSize: 12, marginTop: 6, fontWeight: '500' },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 8, marginBottom: 4 },
  forgotText: { color: '#276749', fontSize: 13, fontWeight: '600' },
  loginBtn: { backgroundColor: '#276749', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16 },
  loginBtnDisabled: { backgroundColor: '#A0AEC0' },
  loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  infoBox: { backgroundColor: '#F0FFF4', borderRadius: 12, padding: 14, marginTop: 16 },
  infoText: { color: '#276749', fontSize: 12, lineHeight: 20 },
});