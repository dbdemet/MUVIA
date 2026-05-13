import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

const ADMIN_CREDENTIALS = [
  { email: 'admin@msku.edu.tr', password: 'admin2026', name: 'System Admin', role: 'admin' },
];

export default function AdminLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    const admin = ADMIN_CREDENTIALS.find(a => a.email === email && a.password === password);
    
    if (admin) {
      try {
        await SecureStore.setItemAsync('adminAuth', JSON.stringify({ email, name: admin.name, role: admin.role, timestamp: Date.now() }));
        router.replace('/(admin)/home');
      } catch (e) {
        Alert.alert('Error', 'Failed to save session');
      }
    } else {
      Alert.alert('Invalid Credentials', 'Email or password is incorrect');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={st.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3A1A1A" />
      <View style={st.header}>
        <Text style={st.logo}>🛡️</Text>
        <Text style={st.title}>Admin Console</Text>
        <Text style={st.subtitle}>Campus Management System</Text>
      </View>

      <View style={st.form}>
        <Text style={st.label}>Personnel Email</Text>
        <TextInput
          style={st.input}
          placeholder="admin@msku.edu.tr"
          placeholderTextColor="#A0AEC0"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />

        <Text style={st.label}>Password</Text>
        <TextInput
          style={st.input}
          placeholder="Enter password"
          placeholderTextColor="#A0AEC0"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          style={[st.btnLogin, loading && st.btnLoginDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={st.btnLoginText}>{loading ? 'Logging in...' : 'Login'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A202C' },
  header: { alignItems: 'center', paddingVertical: 60 },
  logo: { fontSize: 60, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#A0AEC0' },
  form: { marginHorizontal: 20 },
  label: { color: '#CBD5E0', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { backgroundColor: '#2D3748', borderWidth: 1, borderColor: '#4A5568', borderRadius: 10, padding: 14, color: '#FFF', fontSize: 14, marginBottom: 16 },
  btnLogin: { backgroundColor: '#2A69AC', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnLoginDisabled: { opacity: 0.5 },
  btnLoginText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
